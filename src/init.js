'use strict';
var webdriverio = require('webdriverio');
var assert = require('assert');

var config = require('../config');

var options = {
    desiredCapabilities: {
        browserName: 'firefox'
    }
};

module.exports = function () {
	var client = webdriverio
	  .remote(options);

	return client.init()
		.url(config.account.server.url)
		.timeouts('script', 5000)
		.timeouts('implicit', 100)
		.timeouts('page load', 30000)
		.title()
		.then(function(res) {
	  	assert(res.value === config.account.server.title, 'Wrong page title');
	  })
		.setValue('form[name="login"] input[name="name"]', config.account.login)
		.setValue('form[name="login"] input[name="password"]', config.account.password)
		.submitForm('form[name="login"]')
		.isVisible('#sysmsg')
		.then(function (hasSystemMessage) {
			var promise = null;
			if (hasSystemMessage) {
				promise = client.getHTML('#sysmsg')
					.then(function (html) {
						console.log(html);
					})
					.click('p a')
					.getText('.playerName');
			} else {
				promise = client.getText('.playerName');
			}
			return promise;
		})
		.then(function (name) {
			assert(name === config.account.login, 'main page didnot render');
		})
}
