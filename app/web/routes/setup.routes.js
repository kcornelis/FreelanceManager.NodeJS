'use strict';

module.exports = function(app) {

	var setup = require('../controllers/setup');

	app.route('/setup').get(setup.getSetup).post(setup.postSetup);
};
