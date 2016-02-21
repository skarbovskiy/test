'use strict';

var selectors = {
	adventureLink: 'button.adventureWhite',
	adventureItem: '#adventureListForm table tr:first-child td:last-child a',
	startButton: '.adventureSendButton button.green',
	mainPageLink: 'li.villageResources a'
}

var service = {
	process: function (client) {
		return client.click(selectors.adventureLink)
			.click(selectors.adventureItem)
			.click(selectors.startButton)
			.click(selectors.mainPageLink);
	}
};

module.exports = service;
