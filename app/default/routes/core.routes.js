'use strict';

module.exports = function(app) {
	
	// Core routing
	var core = require('../controllers/core');

	app.route('/').get(core.index);
	app.route('/render').get(core.render);
};