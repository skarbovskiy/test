'use strict';
var config = require('cnfg')(__dirname);
config.env = process.env.NODE_ENV || 'development';

module.exports = config;
