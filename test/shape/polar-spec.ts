/**
 * Copyright (c) 2017 ~ present NAVER Corp.
 * billboard.js project is licensed under the MIT license
 */
/* eslint-disable */
/* global describe, beforeEach, it, expect */
import {expect} from "chai";
import util from "../assets/util";
import CLASS from "../../src/config/classes";

describe("SHAPE POLAR", () => {
	let chart;
	let args;

	beforeEach(function(){
		chart = util.generate(args);
	});

	describe("default polar", () => {
		before(() => {
			args = {
				data: {
                    columns: [
                        ["data1", 60],
                        ["data2", 120],
                        ["data3", 75]
                    ],
                    type: "polar",
                },
                polar: {}
			};
		});

		it("polar should be positioned at center", () => {
			const rect = chart.$.main.select(`.${CLASS.chartPolarArcs}`).node().getBoundingClientRect();
			const left = (chart.$.chart.node().getBoundingClientRect().width - rect.width) / 2;

			expect(left).to.be.closeTo(rect.x, 5);
		});

        it("should render arc and level", () => {
			const polar = chart.$.main.select(`.${CLASS.chartPolars}`);
			const dataLen = chart.data().length;

			const arcs = polar.selectAll(`.${CLASS.chartPolarArcs} .${CLASS.chartArc}`);
			expect(arcs.size()).to.be.equal(dataLen);

			const levels = polar.selectAll(`.${CLASS.levels} .${CLASS.level}`);
			// default level depth value
			expect(levels.size()).to.be.equal(3);
		});

		it("set level options", () => {
			args.polar.level = {
				depth: 8,
				show: false,
			};
		});

		it("check for level options", () => {
			const polar = chart.$.main.select(`.${CLASS.chartPolars}`);
			const levels = polar.select(`.${CLASS.levels}`);
			const level = levels.selectAll("circle");

			// check for level element depth size
			expect(args.polar.level.depth).to.be.equal(level.size());

			// level should be hidden
			level.each(function() {
				expect(this.style.visibility).to.be.equal("hidden");
			});
		});

		it("set options: hidden elements to show", () => {
			args.polar.level.show = true;
		});
    });
});
