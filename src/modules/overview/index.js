'use strict';

var Promise = require('bluebird');

var status = {
	plusActivated: false,
	buildingsAvailable: 0,
	adventuresAvailable: 0,
	resources: {
		wood: 0,
		briks: 0,
		stone: 0,
		food: 0
	}
};

var selectors = {
	goldMenu: 'li.gold a',
	plusTab: '#paymentWizard .header ul li:nth-child(2)',
	plusTabContent: '.featureTitle',
	plusRemainingTime: '.paymentPopupDialogWrapper .featureCollection .feature:nth-child(2) .featureContent .featureRemainingTime span',
	plusClose: '#dialogCancelButton',
	buildingList: '.buildingList',
	buildingListItem: '.buildingList .boxes-contents ul li',
	woodCount: '#stockBarResource1 .value',
	briksCount: '#stockBarResource2 .value',
	stoneCount: '#stockBarResource3 .value',
	foodCount: '#stockBarResource4 .value',
	adventureAvialability: 'button.adventureWhite .speechBubbleContainer .speechBubbleContent'
};

var service = {
	getStats: function (client) {
		return new Promise(function (resolve, reject) {
			service._fetchPlusStatus(client)
				.then(service._fetchResources.bind(null, client))
				.then(service._fetchAvailableBuildingsCount.bind(null, client))
				.then(service._fetchAvailableAdventures.bind(null, client))
				.then(function () {
					resolve(status);
				})
				.catch(function (e) {
					reject(e);
				})
		});
	},
	_fetchPlusStatus: function (client) {
		return client.click(selectors.goldMenu)
			.waitForVisible(selectors.plusTab, 10000)
			.click(selectors.plusTab)
			.waitForVisible(selectors.plusTabContent, 10000)
			.getText(selectors.plusRemainingTime)
			.then(function (c) {
				status.plusActivated = true;
			})
			.catch(function (e) {
				status.plusActivated = false;
			})
			.click(selectors.plusClose);
	},
	_fetchResources: function (client) {
		return client.getText(selectors.woodCount)
			.then(function (count) {
				status.resources.wood = parseInt(count);
			})
			.getText(selectors.briksCount)
			.then(function (count) {
				status.resources.briks = parseInt(count);
			})
			.getText(selectors.stoneCount)
			.then(function (count) {
				status.resources.stone = parseInt(count);
			})
			.getText(selectors.foodCount)
			.then(function (count) {
				status.resources.food = parseInt(count);
			})
	},
	_fetchAvailableBuildingsCount: function (client) {
		return client.isVisible(selectors.buildingList)
			.then(function (visible) {
				if (!visible) {
					status.buildingsAvailable = status.plusActivated ? 2 : 1;
					return;
				}
				return client.elements(selectors.buildingListItem)
					.then(function (e) {
						var count = e.value.length;
						status.buildingsAvailable = (count === 2 || (count === 1 && !status.plusActivated)) ? 0 : 1;
					});
			});
	},
	_fetchAvailableAdventures: function (client) {
		return client.isVisible(selectors.adventureAvialability)
			.then(function (available) {
				if (!available) {
					return;
				}
				return client.getText(selectors.adventureAvialability)
					.then(function (count) {
						status.adventuresAvailable = parseInt(count);
					})
			})
	}
}

module.exports = service;
