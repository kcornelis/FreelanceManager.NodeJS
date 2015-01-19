'use strict';

/**
 * Module dependencies.
 */
var timeRegistration = require('../controllers/timeregistration'),
	jwt = require('express-jwt'),
	config = require_config();

module.exports = function(app) {
	
	app.use('/api/public', jwt({ secret: config.jwtSecret }));

	app.route('/api/public/timeregistrations').get(timeRegistration.getAll);
	app.route('/api/public/timeregistrations/bydate/:date').get(timeRegistration.getForDate);
	app.route('/api/public/timeregistrations/byrange/:from/:to').get(timeRegistration.getForRange);
	app.route('/api/public/timeregistrations/getinfo/:from/:to').get(timeRegistration.getInfo);
	app.route('/api/public/timeregistrations/:timeRegistrationId').get(timeRegistration.getById);
	app.route('/api/public/timeregistrations/uninvoiced').get(timeRegistration.getUninvoiced);

	app.route('/api/public/timeregistrations').post(timeRegistration.create);
	app.route('/api/public/timeregistrations/:timeRegistrationId').post(timeRegistration.update);
};