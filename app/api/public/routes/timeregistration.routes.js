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
	app.route('/api/public/timeregistrations/getinfoforperiod/:from/:to').get(timeRegistration.getInfoForPeriod);
	app.route('/api/public/timeregistrations/getinfoforperiodpertask/:from/:to').get(timeRegistration.getInfoForPeriodPerTask);
	app.route('/api/public/timeregistrations/:timeRegistrationId').get(timeRegistration.getById);
	app.route('/api/public/timeregistrations/uninvoiced').get(timeRegistration.getUninvoiced);

	app.route('/api/public/timeregistrations').post(timeRegistration.create);
	app.route('/api/public/timeregistrations/multiple').post(timeRegistration.create);
	app.route('/api/public/timeregistrations/:timeRegistrationId').post(timeRegistration.update);

	app.route('/api/public/timeregistrations/:timeRegistrationId').delete(timeRegistration.delete);
};