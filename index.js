'use strict'
var webdriverio = require('webdriverio');

var init = require('./src/init');
var overview = require('./src/modules/overview');
var buildings = require('./src/modules/buildings');

var client = init();
client.catch(function (e) {
	console.log(e.stack);
	client.end();
	process.exit(1);
});
var globalStats = null;

main();

function main () {
	overview.getStats(client)
		.then(function (stats) {
			console.log('stats:', stats);
			globalStats = stats;
		})
		.then(doBuilding)
		.catch(function (e) {
			console.log(e.stack);
			client.end();
			process.exit(1);
		})
		.delay(5* 60 * 1000)//5 min
		.then(main)
}

function doBuilding () {
	if (globalStats.buildingsAvailable > 0) {
		console.log('trying to build');
		return buildings.build(client, globalStats)
			.then(function () {
				globalStats.buildingsAvailable--;
			})
			.catch(function (e) {
				if (e.message === 'not enough resources') {
					console.log('not enough resources');
					globalStats.buildingsAvailable = 0;
				} else {
					throw e;
				}
			})
			.then(doBuilding);
	}
}
