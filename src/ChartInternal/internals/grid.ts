/**
 * Copyright (c) 2017 ~ present NAVER Corp.
 * billboard.js project is licensed under the MIT license
 */
import {
	select as d3Select,
	selectAll as d3SelectAll
} from "d3-selection";
import CLASS from "../../config/classes";
import {isArray, isValue} from "../../module/util";

// Grid position and text anchor helpers
const getGridTextAnchor = d => isValue(d.position) || "end";
const getGridTextDx = d => (d.position === "start" ? 4 : (d.position === "middle" ? 0 : -4));
const getGridTextX = (isX, width, height) => d => {
	let x = isX ? 0 : width;

	if (d.position === "start") {
		x = isX ? -height : 0;
	} else if (d.position === "middle") {
		x = (isX ? -height : width) / 2;
	}

	return x;
};

export default {
	initGrid() {
		const $$ = this;

		$$.initGridLines();
		$$.initFocusGrid();
	},

	initGridLines() {
		const $$ = this;
		const {config, state: {clip}, $el: {grid}} = $$;

		if (config.grid_x_lines.length || config.grid_y_lines.length) {
			$$.gridLines = $$.$el.main.insert("g", `.${CLASS.chart}${config.grid_lines_front ? " + *" : ""}`)
				.attr("clip-path", clip.pathGrid)
				.attr("class", `${CLASS.grid} ${CLASS.gridLines}`);

			$$.gridLines.append("g").attr("class", CLASS.xgridLines);
			$$.gridLines.append("g").attr("class", CLASS.ygridLines);

			grid.xLines = d3SelectAll([]);
		}
	},

	updateXGrid(withoutUpdate) {
		const $$ = this;
		const {config, scale, state, $el: {main, grid}} = $$;
		const isRotated = config.axis_rotated;
		const xgridData = $$.generateGridData(config.grid_x_type, scale.x);
		const tickOffset = $$.isCategorized() ? $$.axis.x.tickOffset() : 0;
		const pos = d => ((scale.zoom || scale.x)(d) + tickOffset) * (isRotated ? -1 : 1);

		state.xgridAttr = isRotated ? {
			"x1": 0,
			"x2": state.width,
			"y1": pos,
			"y2": pos,
		} : {
			"x1": pos,
			"x2": pos,
			"y1": 0,
			"y2": state.height,
		};

		grid.x = main.select(`.${CLASS.xgrids}`)
			.selectAll(`.${CLASS.xgrid}`)
			.data(xgridData);

		grid.x.exit().remove();

		grid.x = grid.x.enter()
			.append("line")
			.attr("class", CLASS.xgrid)
			.merge(grid.x);

		if (!withoutUpdate) {
			grid.x.each(function() {
				const grid = d3Select(this);

				Object.keys(state.xgridAttr).forEach(id => {
					grid.attr(id, state.xgridAttr[id])
						.style("opacity", () => (
							grid.attr(isRotated ? "y1" : "x1") === (isRotated ? state.height : 0) ?
								"0" : "1"
						));
				});
			});
		}
	},

	updateYGrid() {
		const $$ = this;
		const {config, state, $el: {grid, main}} = $$;
		const isRotated = config.axis_rotated;
		const gridValues = $$.axis.y.tickValues() || $$.scale.y.ticks(config.grid_y_ticks);
		const pos = d => Math.ceil($$.scale.y(d));

		grid.y = main.select(`.${CLASS.ygrids}`)
			.selectAll(`.${CLASS.ygrid}`)
			.data(gridValues);

		grid.y.exit().remove();

		grid.y = grid.y
			.enter()
			.append("line")
			.attr("class", CLASS.ygrid)
			.merge(grid.y);

		grid.y.attr("x1", isRotated ? pos : 0)
			.attr("x2", isRotated ? pos : state.width)
			.attr("y1", isRotated ? 0 : pos)
			.attr("y2", isRotated ? state.height : pos);

		$$.smoothLines(grid.y, "grid");
	},

	updateGrid(duration) {
		const $$ = this;

		!$$.gridLines && $$.initGridLines();

		// hide if arc type
		$$.$el.grid.main.style("visibility", $$.hasArcType() ? "hidden" : "visible");

		$$.hideGridFocus();
		$$.updateXGridLines(duration);
		$$.updateYGridLines(duration);
	},

	/**
	 * Update X Grid lines
	 * @param {Number} duration
	 * @private
	 */
	updateXGridLines(duration) {
		const $$ = this;
		const {config, $el} = $$;
		const isRotated = config.axis_rotated;

		config.grid_x_show && $$.updateXGrid();

		let xLines = $el.main.select(`.${CLASS.xgridLines}`)
			.selectAll(`.${CLASS.xgridLine}`)
			.data(config.grid_x_lines);

		// exit
		xLines.exit().transition()
			.duration(duration)
			.style("opacity", "0")
			.remove();

		// enter
		const xgridLine = xLines.enter().append("g");

		xgridLine.append("line")
			.style("opacity", "0");

		xgridLine.append("text")
			.attr("transform", isRotated ? "" : "rotate(-90)")
			.attr("dy", -5)
			.style("opacity", "0");

		xLines = xgridLine.merge(xLines);

		xLines
			.attr("class", d => `${CLASS.xgridLine} ${d.class || ""}`.trim())
			.select("text")
			.attr("text-anchor", getGridTextAnchor)
			.attr("dx", getGridTextDx)
			.transition()
			.duration(duration)
			.text(d => d.text)
			.transition()
			.style("opacity", "1");

		$el.grid.xLines = xLines;
	},

	/**
	 * Update Y Grid lines
	 * @param {Number} duration
	 * @private
	 */
	updateYGridLines(duration) {
		const $$ = this;
		const {config, state: {width, height}, $el} = $$;
		const isRotated = config.axis_rotated;

		config.grid_y_show && $$.updateYGrid();

		let ygridLines = $el.main.select(`.${CLASS.ygridLines}`)
			.selectAll(`.${CLASS.ygridLine}`)
			.data(config.grid_y_lines);

		// exit
		ygridLines.exit()
			.transition()
			.duration(duration)
			.style("opacity", "0")
			.remove();

		// enter
		const ygridLine = ygridLines.enter().append("g");

		ygridLine.append("line")
			.style("opacity", "0");

		ygridLine.append("text")
			.attr("transform", isRotated ? "rotate(-90)" : "")
			.style("opacity", "0");

		ygridLines = ygridLine.merge(ygridLines);

		// update
		const yv = $$.yv.bind($$);

		ygridLines
			.attr("class", d => `${CLASS.ygridLine} ${d.class || ""}`.trim())
			.select("line")
			.transition()
			.duration(duration)
			.attr("x1", isRotated ? yv : 0)
			.attr("x2", isRotated ? yv : width)
			.attr("y1", isRotated ? 0 : yv)
			.attr("y2", isRotated ? height : yv)
			.transition()
			.style("opacity", "1");

		ygridLines.select("text")
			.attr("text-anchor", getGridTextAnchor)
			.attr("dx", getGridTextDx)
			.transition()
			.duration(duration)
			.attr("dy", -5)
			.attr("x", getGridTextX(isRotated, width, height))
			.attr("y", yv)
			.text(d => d.text)
			.transition()
			.style("opacity", "1");

		$el.grid.yLines = ygridLines;
	},

	redrawGrid(withTransition) {
		const $$ = this;
		const {
			config: {axis_rotated: isRotated},
			state: {width, height},
			$el: {grid}
		} = $$;
		const xv = $$.xv.bind($$);

		let lines = grid.xLines.select("line");
		let texts = grid.xLines.select("text");

		lines = (withTransition ? lines.transition() : lines)
			.attr("x1", isRotated ? 0 : xv)
			.attr("x2", isRotated ? width : xv)
			.attr("y1", isRotated ? xv : 0)
			.attr("y2", isRotated ? xv : height);

		texts = (withTransition ? texts.transition() : texts)
			.attr("x", getGridTextX(!isRotated, width, height))
			.attr("y", xv)
			.text(d => d.text);

		return [
			(withTransition ? lines.transition() : lines).style("opacity", "1"),
			(withTransition ? texts.transition() : texts).style("opacity", "1")
		];
	},

	initFocusGrid() {
		const $$ = this;
		const {config, state: {clip}, $el} = $$;
		const isFront = config.grid_front;
		const className = `.${CLASS[isFront && $$.gridLines ? "gridLines" : "chart"]}${isFront ? " + *" : ""}`;

		const grid = $el.grid.main = $el.main.insert("g", className)
			.attr("clip-path", clip.pathGrid)
			.attr("class", CLASS.grid);

		config.grid_x_show &&
			grid.append("g").attr("class", CLASS.xgrids);

		config.grid_y_show &&
			grid.append("g").attr("class", CLASS.ygrids);

		if (config.grid_focus_show) {
			grid.append("g")
				.attr("class", CLASS.xgridFocus)
				.append("line")
				.attr("class", CLASS.xgridFocus);

			// to show xy focus grid line, should be 'tooltip.grouped=false'
			if (config.grid_focus_y && !config.tooltip_grouped) {
				grid.append("g")
					.attr("class", CLASS.ygridFocus)
					.append("line")
					.attr("class", CLASS.ygridFocus);
			}
		}
	},

	/**
	 * Show grid focus line
	 * @param {Array} selectedData
	 * @private
	 */
	showGridFocus(selectedData) {
		const $$ = this;
		const {config, state: {width, height}} = $$;
		const isRotated = config.axis_rotated;
		const dataToShow = selectedData.filter(d => d && isValue($$.getBaseValue(d)));

		// Hide when bubble/scatter/stanford plot exists
		if (!config.tooltip_show || dataToShow.length === 0 || $$.hasType("bubble") || $$.hasArcType()) {
			return;
		}

		const focusEl = $$.$el.main.selectAll(`line.${CLASS.xgridFocus}, line.${CLASS.ygridFocus}`);
		const isEdge = config.grid_focus_edge && !config.tooltip_grouped;
		const xx = $$.xx.bind($$);

		focusEl
			.style("visibility", "visible")
			.data(dataToShow.concat(dataToShow))
			.each(function(d) {
				const el = d3Select(this);
				const pos = {
					x: xx(d),
					y: $$.getYScale(d.id)(d.value)
				};
				let xy;

				if (el.classed(CLASS.xgridFocus)) {
					// will contain 'x1, y1, x2, y2' order
					xy = isRotated ?
						[
							null, // x1
							pos.x, // y1
							isEdge ? pos.y : width, // x2
							pos.x // y2
						] : [
							pos.x,
							isEdge ? pos.y : null,
							pos.x,
							height
						];
				} else {
					const isY2 = $$.axis.getId(d.id) === "y2";

					xy = isRotated ?
						[
							pos.y, // x1
							isEdge && !isY2 ? pos.x : null, // y1
							pos.y, // x2
							isEdge && isY2 ? pos.x : height // y2
						] : [
							isEdge && isY2 ? pos.x : null,
							pos.y,
							isEdge && !isY2 ? pos.x : width,
							pos.y
						];
				}

				["x1", "y1", "x2", "y2"]
					.forEach((v, i) => el.attr(v, xy[i]));
			});

		$$.smoothLines(focusEl, "grid");
	},

	hideGridFocus() {
		this.$el.main.selectAll(`line.${CLASS.xgridFocus}, line.${CLASS.ygridFocus}`)
			.style("visibility", "hidden");
	},

	updategridFocus() {
		const $$ = this;
		const {width, height} = $$.state;
		const isRotated = $$.config.axis_rotated;

		$$.$el.main.select(`line.${CLASS.xgridFocus}`)
			.attr("x1", isRotated ? 0 : -10)
			.attr("x2", isRotated ? width : -10)
			.attr("y1", isRotated ? -10 : 0)
			.attr("y2", isRotated ? -10 : height);
	},

	generateGridData(type, scale) {
		const $$ = this;
		const tickNum = $$.$el.main.select(`.${CLASS.axisX}`)
			.selectAll(".tick")
			.size();
		let gridData: Date[] = [];

		if (type === "year") {
			const xDomain = $$.getXDomain();
			const firstYear = xDomain[0].getFullYear();
			const lastYear = xDomain[1].getFullYear();

			for (let i = firstYear; i <= lastYear; i++) {
				gridData.push(new Date(`${i}-01-01 00:00:00`));
			}
		} else {
			gridData = scale.ticks(10);

			if (gridData.length > tickNum) { // use only int
				gridData = gridData.filter(d => String(d).indexOf(".") < 0);
			}
		}

		return gridData;
	},

	getGridFilterToRemove(params) {
		return params ? line => {
			let found = false;

			(isArray(params) ? params.concat() : [params]).forEach(param => {
				if ((("value" in param && line.value === param.value) || ("class" in param && line.class === param.class))) {
					found = true;
				}
			});

			return found;
		} : () => true;
	},

	removeGridLines(params, forX) {
		const $$ = this;
		const {config} = $$;
		const toRemove = $$.getGridFilterToRemove(params);
		const toShow = line => !toRemove(line);
		const classLines = forX ? CLASS.xgridLines : CLASS.ygridLines;
		const classLine = forX ? CLASS.xgridLine : CLASS.ygridLine;

		$$.$el.main.select(`.${classLines}`)
			.selectAll(`.${classLine}`)
			.filter(toRemove)
			.transition()
			.duration(config.transition_duration)
			.style("opacity", "0")
			.remove();

		const gridLines = `grid_${forX ? "x" : "y"}_lines`;

		config[gridLines] = config[gridLines].filter(toShow);
	},
};
