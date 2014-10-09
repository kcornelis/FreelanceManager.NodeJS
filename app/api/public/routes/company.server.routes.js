'use strict';

/**
 * Module dependencies.
 */
var company = require('../controllers/company'),
	jwt = require('express-jwt'),
	config = require_config();

module.exports = function(app) {
	
	app.use('/api/public', jwt({ secret: config.jwtSecret }));

	app.route('/api/public/companies').get(company.getAll);
	app.route('/api/public/company/:companyId').get(company.getById);

	app.route('/api/public/company/create').post(company.create);
	app.route('/api/public/company/update/:companyId').post(company.update);
};