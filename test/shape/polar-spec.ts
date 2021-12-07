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
    });
});
