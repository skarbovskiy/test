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
		.timeouts('implicit', 5000)
		.timeouts('page load', 30000)
		.then(callback);
		.title()
		.then(function(res) {
	  	assert(res.value === config.account.server.title, 'Wrong page title');
	  })
		.setValue('form[name="login"] input[name="name"]', config.account.login)
		.setValue('form[name="login"] input[name="password"]', config.account.password)
		.submitForm('form[name="login"]')
		.getText('.playerName')
		.then(function (name) {
			assert(name === config.account.login, 'main page didnot render');
		})
}
