'use strict';
var Promise = require('bluebird');
var _ = require('lodash');
var cheerio = require('cheerio');

var selectors = {
	tableElement: '#auction table tbody tr'
}

var processed = false;

var service = {
	process: function (client) {
		var tabs = 0;
		processed = false;
		return client.click('button.auctionWhite')
			.elements(selectors.tableElement)
			.then(function (elements) {
				var i = 0;
				return Promise.map(elements.value, function (element) {
					if (processed) {
						return;
					}
					var selector = selectors.tableElement + ':nth-child(' + ++i + ')';
					return client.getHTML(selector, false)
						.then(function (html) {
							var $ = cheerio.load(html);
							var title = $('.name').text().trim();
							var silver = parseInt($('.silver').text());
							var bid = $('.bid').text().trim();
							if (bid !== 'Предложить' || silver >= 100) {
								return;
							}
							processed = true;
							console.log('making bid', title, silver);
							return client.click(selector + ' .bid .bidButton')
								.setValue('input.maxBid', 100)
								.click('.submitBid .green')
							})
						}, {concurrency: 1});
					})
					.then(function () {
						return processed;
					});
	}
};

module.exports = service;
