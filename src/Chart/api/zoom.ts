/**
 * Copyright (c) 2017 ~ present NAVER Corp.
 * billboard.js project is licensed under the MIT license
 */
import {zoomIdentity as d3ZoomIdentity, zoomTransform as d3ZoomTransform} from "d3-zoom";
import CLASS from "../../config/classes";
import {callFn, extend, getMinMax, isDefined, isObject, isString} from "../../module/util";

/**
 * Check if the given domain is within zoom range
 * @param {Array} domain
 * @return {Boolean}
 * @private
 */
function withinRange(domain: number[], range: number[]): boolean {
	const [min, max] = range;

	return domain.every((v, i) => (
		i === 0 ? (v >= min) : (v <= max)
	));
};

/**
 * Zoom by giving x domain.
 * - **NOTE:**
 *  - For `wheel` type zoom, the minimum zoom range will be set as the given domain. To get the initial state, [.unzoom()](#unzoom) should be called.
 *  - To be used [zoom.enabled](Options.html#.zoom) option should be set as `truthy`.
 * @method zoom
 * @instance
 * @memberof Chart
 * @param {Array} domainValue If domain is given, the chart will be zoomed to the given domain. If no argument is given, the current zoomed domain will be returned.
 * @return {Array} domain value in array
 * @example
 *  // Zoom to specified domain
 *  chart.zoom([10, 20]);
 *
 *  // Get the current zoomed domain
 *  chart.zoom();
 */
const zoom = function(domainValue?: number[]) {
	const $$ = this.internal;
	const {config, scale} = $$;
	let domain = domainValue;
	let resultDomain;

	if (config.zoom_enabled && domain && withinRange(domain, $$.getZoomDomain())) {
		const isTimeSeries = $$.isTimeSeries();

		if (isTimeSeries) {
			domain = domain.map(x => $$.parseDate(x));
		}

		if (config.subchart_show) {
			const xScale = scale.zoom || scale.x;

			$$.brush.getSelection().call($$.brush.move, [xScale(domain[0]), xScale(domain[1])]);
			resultDomain = domain;
		} else {
			scale.x.domain(domain);
			scale.zoom = scale.x;
			$$.axis.x.scale(scale.zoom);

			resultDomain = scale.zoom.orgDomain();
		}

		$$.redraw({
			withTransition: true,
			withY: config.zoom_rescale,
			withDimension: false
		});

		$$.setZoomResetButton();
		callFn(config.zoom_onzoom, this, resultDomain);
	} else {
		resultDomain = scale.zoom ?
			scale.zoom.domain() : scale.x.orgDomain();
	}

	return resultDomain;
};

extend(zoom, {
	/**
	 * Enable and disable zooming.
	 * @method zoom․enable
	 * @instance
	 * @memberof Chart
	 * @param {String|Boolean} enabled Possible string values are "wheel" or "drag". If enabled is true, "wheel" will be used. If false is given, zooming will be disabled.<br>When set to false, the current zooming status will be reset.
	 * @example
	 *  // Enable zooming using the mouse wheel
	 *  chart.zoom.enable(true);
	 *  // Or
	 *  chart.zoom.enable("wheel");
	 *
	 *  // Enable zooming by dragging
	 *  chart.zoom.enable("drag");
	 *
	 *  // Disable zooming
	 *  chart.zoom.enable(false);
	 */
	enable: function(enabled) {
		const $$ = this.internal;
		const {config} = $$
		let enableType: any = enabled;

		if (enabled) {
			enableType = isString(enabled) && /^(drag|wheel)$/.test(enabled) ?
				{type: enabled} : enabled;
		}

		config.zoom_enabled = enableType;

		if (!$$.zoom) {
			$$.initZoom();
			$$.bindZoomEvent();
		} else if (enabled === false) {
			$$.bindZoomEvent(false);
		}

		$$.updateAndRedraw();
	},

	/**
	 * Set or get x Axis maximum zoom range value
	 * @method zoom․max
	 * @instance
	 * @memberof Chart
	 * @param {Number} [max] maximum value to set for zoom
	 * @return {Number} zoom max value
	 * @example
	 *  // Set maximum range value
	 *  chart.zoom.max(20);
	 */
	max: function(max?: number): number {
		const $$ = this.internal;
		const {config, org: {xDomain}} = $$;

		if (max === 0 || max) {
			config.zoom_x_max = getMinMax("max", [xDomain[1], max]);
		}

		return config.zoom_x_max;
	},

	/**
	 * Set or get x Axis minimum zoom range value
	 * @method zoom․min
	 * @instance
	 * @memberof Chart
	 * @param {Number} [min] minimum value to set for zoom
	 * @return {Number} zoom min value
	 * @example
	 *  // Set minimum range value
	 *  chart.zoom.min(-1);
	 */
	min: function(min?: number): number {
		const $$ = this.internal;
		const {config, org: {xDomain}} = $$;

		if (min === 0 || min) {
			config.zoom_x_min = getMinMax("min", [xDomain[0], min]);
		}

		return config.zoom_x_min;
	},

	/**
	 * Set zoom range
	 * @method zoom․range
	 * @instance
	 * @memberof Chart
	 * @param {Object} [range]
	 * @return {Object} zoom range value
	 * {
	 *   min: 0,
	 *   max: 100
	 * }
	 * @example
	 *  chart.zoom.range({
	 *      min: 10,
	 *      max: 100
	 *  });
	 */
	range: function(range) {
		const zoom = this.zoom;

		if (isObject(range)) {
			const {min, max} = range;

			isDefined(min) && zoom.min(min);
			isDefined(max) && zoom.max(max);
		}

		return {
			min: zoom.min(),
			max: zoom.max()
		};
	}
});

export default {
	zoom,

	/**
	 * Unzoom zoomed area
	 * @method unzoom
	 * @instance
	 * @memberof Chart
	 * @example
	 *  chart.unzoom();
	 */
	unzoom() {
		const $$ = this.internal;
		const {config} = $$

		if ($$.scale.zoom) {
			config.subchart_show ?
				$$.brush.getSelection().call($$.brush.move, null) :
				$$.zoom.updateTransformScale(d3ZoomIdentity);

			$$.updateZoom(true);
			$$.zoom.resetBtn && $$.zoom.resetBtn.style("display", "none");

			// reset transform
			const eventRects = $$.$el.main.select(`.${CLASS.eventRects}`);

			if (d3ZoomTransform(eventRects.node()) !== d3ZoomIdentity) {
				$$.zoom.transform(eventRects, d3ZoomIdentity);
			}

			$$.redraw({
				withTransition: true,
				withUpdateXDomain: true,
				withUpdateOrgXDomain: true,
				withY: config.zoom_rescale
			});
		}
	}
};
