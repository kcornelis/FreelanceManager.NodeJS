'use strict';

/**
 * Module dependencies.
 */
var jwt = require('express-jwt'),
	config = require_config();

module.exports = function(app) {
	
	// Core routing
	var core = require('../controllers/core');

	app.route('/').get(/*jwt({ secret: config.jwtSecret }),*/ core.index);
};