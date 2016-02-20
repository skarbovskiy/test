'use strict';
var Promise = require('bluebird');
var cheerio = require('cheerio');
var _ = require('lodash');

var selectors = {
	mapElement: '#content map area',
	villageCenterLink: 'li.villageBuildings a',
	resourcesLink: 'li.villageResources a',
	buildButton: '.contractLink button.green'
}

var buildableObjects = [];

var service = {
	build: function (client, stats) {
		return service._getResourceAvailableBuildings(client, stats)
			.then(service._getInfrastructureAvailableBuildings.bind(null, client, stats))
			.then(function () {
				var buildIt = null;
				_.some(_.sortBy(buildableObjects, ['resources.wood', 'resources.briks']), function (building) {
					var res = building.resources;
					var availableRes = stats.resources;
					if (
						res.wood <= availableRes.wood &&
						res.briks <= availableRes.briks &&
						res.stone <= availableRes.stone &&
					  res.food <= availableRes.food
					) {
							buildIt = building;
							return true;
					}
					return false;
				});
				return buildIt;
			})
			.then(function (building) {
				if (!building) {
					return client.click(selectors.resourcesLink)
						.then(function () {
							throw new Error('not enough resources');
						})
				}
				var promise = null;
				if (building.type === 'infrastructure') {
					promise = client.click(selectors.villageCenterLink);
				} else {
					promise = client.click(selectors.resourcesLink);
				}
				return promise.waitForVisible(building.selector, 5000)
					.click(building.selector)
					.click(selectors.buildButton)
					.click(selectors.resourcesLink);
			});
	},
	_getResourceAvailableBuildings: function (client, stats) {
		return buildObject(client, stats, 'resource');
	},
	_getInfrastructureAvailableBuildings: function (client, stats) {
		return client.click(selectors.villageCenterLink)
			.then(function () {
				return buildObject(client, stats, 'infrastructure');
			});
	}
};

function buildObject (client, stats, type) {
	return client.elements(selectors.mapElement)
		.then(function (e) {
			var i = 0;
			return Promise.map(e.value, function (element) {
				i++;
				var selector = selectors.mapElement + ':nth-child(' + i + ')';
				return client.rightClick(selector)
					.isVisible('.tip-contents .elementText .showCosts')
					.then(function (buildable) {
						if (!buildable) {
							return;
						}
						return client.isVisible('.tip-contents .elementText .notice')
							.then(function (currentlyBuilding) {
								if (currentlyBuilding) {
									return;
								}
								return client.getHTML('.tip-contents .elementText .showCosts', false)
									.then(function (html) {
										var $ = cheerio.load(html);
										buildableObjects.push({
											selector: selector,
											type: type,
											resources: {
												wood: parseInt($('.r1').text()),
												briks: parseInt($('.r2').text()),
												stone: parseInt($('.r3').text()),
												food: parseInt($('.r4').text())
											}
										});
									});
							})
					})
					.click('.playerName');
			}, {concurrency: 1});
		})
}

module.exports = service;
