/**
 * Copyright (c) 2017 ~ present NAVER Corp.
 * billboard.js project is licensed under the MIT license
 */
/* eslint-disable */
import {expect} from "chai";
import util from "../assets/util";
import CLASS from "../../src/config/classes";

describe("API select", () => {
	let chart;
	let main;
	let args: any = {
		data: {
			columns: [
				["data1", 30, 200, 100, 400, 150],
				["data2", 5000, 2000, 1000, 4000, 1500]
			],
			selection: {
				enabled: true
			}
		}
	};

	describe("selection for circle data points", () => {
		before(() => {
			chart = util.generate(args);
			main = chart.$.main;
		});

		it("should select all data points", () => {
			chart.select();

			const selected = main.selectAll(`.${CLASS.selectedCircle}`);
			const dataLen = chart.data.values("data1").length + chart.data.values("data2").length;

			expect(selected.size()).to.be.equal(dataLen);
		});

		it("should unselect indice '1' data point", done => {
			const indice = 1;

			chart.unselect(["data1", "data2"], [indice]);

			setTimeout(() => {
				const unselected = main.selectAll(`.${CLASS.selectedCircle}`)
					.filter(`.${CLASS.selectedCircle}-${indice}`);

				expect(unselected.empty()).to.be.ok;

				done();
			}, 500);
		});

		it("should unselect all data points", done => {
			chart.unselect();

			setTimeout(() => {
				const unselected = main.selectAll(`.${CLASS.selectedCircle}`);

				expect(unselected.empty()).to.be.ok;

				done();
			}, 500);
		});

		it("should select some portion of data points", done => {
			const indice = [1, 3];

			chart.select("data1", indice, true);

			const selected = chart.selected();

			setTimeout(() => {
				main.selectAll(`.${CLASS.selectedCircles}-data1 circle`).each((v, i) => {
					expect(v).to.be.equal(selected[i]);
					expect(v.index).to.be.equal(indice[i]);
				});

				done();
			}, 500);
		});
	});

	describe("selection for bar", () => {
		before(() => {
			args.data.type = "bar";
			chart = util.generate(args);
			main = chart.$.main;
		});

		it("should select all data points", () => {
			chart.select();

			const selected = main.selectAll(`.${CLASS.SELECTED}`);
			const dataLen = chart.data.values("data1").length + chart.data.values("data2").length;

			expect(selected.size()).to.be.equal(dataLen);
		});

		it("should unselect indice '1' data point", done => {
			const indice = 1;

			chart.unselect(["data1", "data2"], [indice]);

			setTimeout(() => {
				const unselected = main.selectAll(`.${CLASS.SELECTED}`)
					.filter(`.${CLASS.bar}-${indice}`);

				expect(unselected.empty()).to.be.ok;

				done();
			}, 500);
		});

		it("should unselect all data points", done => {
			chart.unselect();

			setTimeout(() => {
				const unselected = main.selectAll(`.${CLASS.SELECTED}`);

				expect(unselected.empty()).to.be.ok;

				done();
			}, 500);
		});

		it("should select some portion of data points", done => {
			const indice = [1, 3];
			const color = chart.color("data1");

			chart.select("data1", indice, true);

			const selected = chart.selected();

			setTimeout(() => {
				main.selectAll(`.${CLASS.shapes}-data1 path.${CLASS.SELECTED}`).each(function(v, i) {
					expect(v).to.be.equal(selected[i]);
					expect(v.index).to.be.equal(indice[i]);

					// check for the selected color
					expect(this.style.filter).to.be.equal("brightness(1.25)");
				});

				done();
			}, 500);
		});
	});
});
