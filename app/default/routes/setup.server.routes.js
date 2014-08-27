'use strict';

module.exports = function(app) {
	// Root routing
	var setup = require('../controllers/setup');
	app.route('/setup').get(setup.getSetup).post(setup.postSetup);
};
