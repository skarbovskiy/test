'use strict';
var Promise = require('bluebird');
var cheerio = require('cheerio');
var _ = require('lodash');

var config = require('../../../config').buildings;
var selectors = {
	mapElement: '#content map area',
	villageCenterLink: 'li.villageBuildings a',
	resourcesLink: 'li.villageResources a',
	buildButton: '.contractLink button.green'
}

var buildableObjects = [];

var service = {
	build: function (client, stats) {
		buildableObjects = [];
		return service._getResourceAvailableBuildings(client, stats)
			.then(service._getInfrastructureAvailableBuildings.bind(null, client, stats))
			.then(function () {

				var buildIt = null;
				buildableObjects = _.filter(buildableObjects, function (object) {
					if (config.blackList && config.blackList.indexOf(object.title) > -1) {
						return false;
					}
					return true;
				});
				var priorityBuildingObjects = _.filter(buildableObjects, function (object) {
					if (config.priority && config.priority.indexOf(object.title) > -1) {
						return false;
					}
					return true;
				});
				if (priorityBuildingObjects && priorityBuildingObjects.length) {
					buildIt = findBuildingToBuild(priorityBuildingObjects);
				}
				if (buildIt) {
					return buildIt;
				}
				return findBuildingToBuild(buildableObjects);
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
					.execute(function (sc){
						return $$(sc)[0].click();
					}, building.selector)
					.waitForVisible(selectors.buildButton, 5000)
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
					.waitForVisible('.tip-contents .elementText', 5000)
					.isVisible('.tip-contents .elementText .showCosts')
					.then(function (buildable) {
						if (!buildable) {
							return;
						}
						return client.getHTML('.tip-contents', false)
							.then(function (html) {
								var $ = cheerio.load(html);
								var title = $('.elementTitle').text();
								title = title.substr(0, title.indexOf('Уровень') - 1);
								buildableObjects.push({
									title: title,
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
					.keys(['Escape']);
			}, {concurrency: 1});
		})
}

function findBuildingToBuild (buildings) {
	var result = null;
	_.some(_.sortBy(buildings, ['resources.briks', 'resources.wood']), function (building) {
		var res = building.resources;
		var availableRes = stats.resources;
		if (
			res.wood <= (availableRes.wood - config.minResources.wood) &&
			res.briks <= (availableRes.briks - config.minResources.briks) &&
			res.stone <= (availableRes.stone - config.minResources.stone) &&
			res.food <= (availableRes.food - config.minResources.food)
		) {
				result = building;
				return true;
		}
		return false;
	});
	return result;
}

module.exports = service;
