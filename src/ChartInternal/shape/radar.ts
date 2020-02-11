/**
 * Copyright (c) 2017 ~ present NAVER Corp.
 * billboard.js project is licensed under the MIT license
 */
import {
	select as d3Select,
	event as d3Event
} from "d3-selection";
import CLASS from "../../config/classes";
import {getMinMax, getRange, isDefined, isEmpty, isNumber, isUndefined, setTextValue, toArray} from "../../module/util";

/**
 * Get the position value
 * @param {Boolean} isClockwise If the direction is clockwise
 * @param {String} type Coordinate type 'x' or 'y'
 * @param {Number} edge Number of edge
 * @param {Number} pos The indexed position
 * @param {Number} range
 * @param {Number} ratio
 * @return {number}
 * @private
 */
function getPosition(isClockwise, type, edge, pos, range, ratio) {
	const index = isClockwise && pos > 0 ? edge - pos : pos;
	const r = 2 * Math.PI;
	const func = type === "x" ? Math.sin : Math.cos;

	return range * (1 - ratio * func(index * r / edge));
}

// cache key
const cacheKey = "$radarPoints";

export default {
	initRadar() {
		const $$ = this;
		const {config} = $$;

		if ($$.hasType("radar")) {
			$$.radars = $$.$el.main.select(`.${CLASS.chart}`).append("g")
				.attr("class", CLASS.chartRadars);

			// level
			$$.radars.levels = $$.radars.append("g")
				.attr("class", CLASS.levels);

			// axis
			$$.radars.axes = $$.radars.append("g")
				.attr("class", CLASS.axis);

			// shapes
			$$.radars.shapes = $$.radars.append("g")
				.attr("class", CLASS.shapes);

			$$.maxValue = config.radar_axis_max || $$.getMinMaxData().max[0].value;
		}
	},

	getRadarSize() {
		const $$ = this;
		const {config, state: {arcWidth, arcHeight}} = $$;
		const padding = config.axis_x_categories.length < 4 ? -20 : 10;
		const size = (Math.min(arcWidth, arcHeight) - padding) / 2;

		return [size, size];
	},

	updateTargetsForRadar(targets) {
		const $$ = this;
		const {config} = $$;

		if (isEmpty(config.axis_x_categories)) {
			config.axis_x_categories = getRange(0, getMinMax("max", targets.map(v => v.values.length)));
		}

		$$.generateRadarPoints();
	},

	getRadarPosition(type, index, range, ratio) {
		const $$ = this;
		const {config} = $$;
		const [width, height] = $$.getRadarSize();
		const edge = config.axis_x_categories.length;
		const isClockwise = config.radar_direction_clockwise;

		const pos = toArray(type).map(v => getPosition(
			isClockwise,
			v,
			edge,
			index,
			isDefined(range) ? range : (type === "x" ? width : height),
			isNumber(ratio) ? ratio : config.radar_size_ratio
		));

		return pos.length === 1 ? pos[0] : pos;
	},

	/**
	 * Generate data points
	 * @private
	 */
	generateRadarPoints() {
		const $$ = this;
		const targets = $$.data.targets;

		const [width, height] = $$.getRadarSize();
		const points = $$.cache.get(cacheKey) || {};
		const size = points._size;

		// recalculate position only when the previous dimension has been changed
		if (!size || (size.width !== width && size.height !== height)) {
			targets.forEach(d => {
				points[d.id] = d.values.map((v, i) => (
					$$.getRadarPosition(["x", "y"], i, undefined, $$.getRatio("radar", v))
				));
			});

			points._size = {width, height};
			$$.cache.add(cacheKey, points);
		}
	},

	redrawRadar(duration, durationForExit) {
		const $$ = this;
		const {main} = $$.$el;
		const translate = $$.getTranslate("radar");

		// Adjust radar, circles and texts' position
		if (translate) {
			$$.radars.attr("transform", translate);
			main.selectAll(`.${CLASS.circles}`).attr("transform", translate);
			main.select(`.${CLASS.chartTexts}`).attr("transform", translate);

			$$.generateRadarPoints();
			$$.updateRadarLevel();
			$$.updateRadarAxes();
			$$.updateRadarShape(duration, durationForExit);
		}
	},

	generateGetRadarPoints() {
		const points = this.cache.get(cacheKey);

		return (d, i) => {
			const point = points[d.id][i];

			return [
				point,
				point,
				point,
				point
			];
		};
	},

	updateRadarLevel() {
		const $$ = this;
		const {config} = $$;
		const [width, height] = $$.getRadarSize();
		const depth = config.radar_level_depth;
		const edge = config.axis_x_categories.length;
		const showText = config.radar_level_text_show;

		const radarLevels = $$.radars.levels;
		const levelData = getRange(0, depth);

		const radius = config.radar_size_ratio * Math.min(width, height);
		const levelRatio = levelData.map(l => radius * ((l + 1) / depth));
		const levelTextFormat = config.radar_level_text_format;

		// Generate points
		const points = levelData.map(v => {
			const range = levelRatio[v];
			const pos = getRange(0, edge).map(i => (
				$$.getRadarPosition(["x", "y"], i, range, 1)).join(",")
			);

			return pos.join(" ");
		});

		const level = radarLevels
			.selectAll(`.${CLASS.level}`)
			.data(levelData);

		level.exit().remove();

		const levelEnter = level.enter().append("g")
			.attr("class", (d, i) => `${CLASS.level} ${CLASS.level}-${i}`);

		levelEnter.append("polygon")
			.style("visibility", config.radar_level_show ? null : "hidden");

		if (showText) {
			if (radarLevels.select("text").empty()) {
				radarLevels
					.append("text")
					.attr("dx", "-.5em")
					.attr("dy", "-.7em")
					.style("text-anchor", "end")
					.text(() => levelTextFormat(0));
			}

			levelEnter.append("text")
				.attr("dx", "-.5em")
				.style("text-anchor", "end")
				.text(d => levelTextFormat(
					$$.maxValue / levelData.length * (d + 1)
				));
		}

		levelEnter
			.merge(level)
			.attr("transform", d => `translate(${width - levelRatio[d]}, ${height - levelRatio[d]})`)
			.selectAll("polygon")
			.attr("points", d => points[d]);

		// update level text position
		if (showText) {
			radarLevels.selectAll("text")
				.attr("x", d => (isUndefined(d) ? width : points[d].split(",")[0]))
				.attr("y", d => (isUndefined(d) ? height : 0));
		}
	},

	updateRadarAxes() {
		const $$ = this;
		const {config} = $$;
		const [width, height] = $$.getRadarSize();
		const categories = config.axis_x_categories;

		let axis = $$.radars.axes.selectAll("g")
			.data(categories);

		axis.exit().remove();

		const axisEnter = axis.enter().append("g")
			.attr("class", (d, i) => `${CLASS.axis}-${i}`);

		config.radar_axis_line_show && axisEnter.append("line");
		config.radar_axis_text_show && axisEnter.append("text");

		axis = axisEnter.merge(axis);

		// axis line
		if (config.radar_axis_line_show) {
			axis.select("line")
				.attr("x1", width)
				.attr("y1", height)
				.attr("x2", (d, i) => $$.getRadarPosition("x", i))
				.attr("y2", (d, i) => $$.getRadarPosition("y", i));
		}

		// axis text
		if (config.radar_axis_text_show) {
			const {x = 0, y = 0} = config.radar_axis_text_position;

			axis.select("text")
				.style("text-anchor", "middle")
				.attr("dy", ".5em")
				.call(selection => {
					selection.each(function(d) {
						setTextValue(d3Select(this), String(d), [-0.6, 1.2]);
					});
				})
				.datum((d, i) => ({index: i}))
				.attr("transform", function(d) {
					if (isUndefined(this.width)) {
						// cache evaluated axis text width
						this.width = this.getBoundingClientRect().width / 2;
					}

					let posX = $$.getRadarPosition("x", d.index, undefined, 1);
					let posY = Math.round($$.getRadarPosition("y", d.index, undefined, 1));

					if (posX > width) {
						posX += this.width + x;
					} else if (Math.round(posX) < width) {
						posX -= this.width + x;
					}

					if (posY > height) {
						// update vertical centered edge axis text dy position
						if (posY / 2 === height && this.firstChild.tagName === "tspan") {
							this.firstChild.setAttribute("dy", "0em");
						}

						posY += y;
					} else if (posY < height) {
						posY -= y;
					}

					return `translate(${posX} ${posY})`;
				});
		}

		$$.bindEvent();
	},

	bindEvent() {
		const $$ = this;
		const {config, state: {inputType, transiting}, $el: {svg}} = $$;

		if (config.interaction_enabled) {
			const isMouse = inputType === "mouse";
			const getIndex = () => {
				let target = d3Event.target;

				// in case of multilined axis text
				if (/tspan/i.test(target.tagName)) {
					target = target.parentNode;
				}

				const d: any = d3Select(target).datum();

				return d && Object.keys(d).length === 1 ? d.index : undefined;
			};
			const hide = () => {
				const index = getIndex();
				const noIndex = isUndefined(index);

				if (isMouse || noIndex) {
					this.hideTooltip();
					this.unexpandCircles();

					if (isMouse) {
						$$.setOverOut(false, index);
					} else if (noIndex) {
						$$.callOverOutForTouch();
					}
				}
			};

			$$.radars.select(`.${CLASS.axis}`)
				.on(isMouse ? "mouseover " : "touchstart", () => {
					if (transiting) { // skip while transiting
						return;
					}

					const index = getIndex();

					$$.selectRectForSingle(svg.node(), null, index);
					isMouse ? $$.setOverOut(true, index) : $$.callOverOutForTouch(index);
				})
				.on("mouseout", isMouse ? hide : null);

			if (!isMouse) {
				svg.on("touchstart", hide);
			}
		}
	},

	updateRadarShape(duration, durationForExit) {
		const $$ = this;
		const targets = $$.data.targets;
		const points = $$.cache.get(cacheKey);

		const areas = $$.radars.shapes
			.selectAll("polygon")
			.data(targets);

		const areasEnter = areas.enter().append("g")
			.attr("class", $$.classChartRadar.bind($$));

		areas.exit().transition()
			.duration(durationForExit)
			.remove();

		areasEnter
			.append("polygon")
			.merge(areas)
			.style("fill", d => $$.color(d))
			.style("stroke", d => $$.color(d))
			.attr("points", d => points[d.id].join(" "));
	},

	/**
	 * Get data point x coordinate
	 * @param {Object} d Data object
	 * @return {Number}
	 * @private
	 */
	radarCircleX(d) {
		return this.cache.get(cacheKey)[d.id][d.index][0];
	},

	/**
	 * Get data point y coordinate
	 * @param {Object} d Data object
	 * @return {Number}
	 * @private
	 */
	radarCircleY(d) {
		return this.cache.get(cacheKey)[d.id][d.index][1];
	}
};
