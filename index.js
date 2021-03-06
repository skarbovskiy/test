'use strict'
var webdriverio = require('webdriverio');
var _ = require('lodash');

var init = require('./src/init');
var overview = require('./src/modules/overview');
var buildings = require('./src/modules/buildings');
var adventures = require('./src/modules/adventures');
var market = require('./src/modules/market');

var client = init();

function errorHandler (e) {
	if (e) {
		console.log(e.stack);
	}
	client.saveScreenshot('./snapshot.png')
		.then(function () {
			client.end()
				.then(function () {
					process.exit(e ? 1 : 0);
				});
		})
}

process.on('uncaughtException', errorHandler);
process.on('SIGINT', errorHandler);
process.on('SIGTERM', errorHandler);

client.catch(errorHandler);
var globalStats = null;

main();

function main () {
	overview.getStats(client)
		.then(function (stats) {
			console.log('stats:', stats);
			globalStats = stats;
		})
		.then(doAdventures)
		.then(doBuilding)
		.then(doMarket)
		.catch(errorHandler)
		.delay(_.random(2, 5) * 60 * 1000)//2-5 min
		.then(main)
}

function doAdventures () {
	if (globalStats.adventuresAvailable > 0) {
		console.log('trying to adventure');
		return adventures.process(client);
	}
}

function doBuilding () {
	if (globalStats.buildingsAvailable > 0) {
		console.log('trying to build');
		return buildings.build(client, globalStats)
			.catch(function (e) {
				if (e.message === 'not enough resources') {
					console.log('not enough resources');
					globalStats.buildingsAvailable = 0;
				} else {
					throw e;
				}
			});
	}
}

function doMarket () {
	return market.process(client)
		.then(function (needMore) {
			if (needMore) {
				return doMarket();
			}
		})
}
