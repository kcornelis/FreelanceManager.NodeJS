'use strict';

/**
 * Module dependencies.
 */

module.exports = function(app) {
	
	// Core routing
	var core = require('../controllers/core');

	app.route('/').get(core.index);
};