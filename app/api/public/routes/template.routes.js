'use strict';

/**
 * Module dependencies.
 */
var template = require('../controllers/template'),
	jwt = require('express-jwt'),
	config = require_config();

module.exports = function(app) {
	
	app.use('/api/public', jwt({ secret: config.jwtSecret }));

	app.route('/api/public/templates').get(template.getAll);
	app.route('/api/public/templates/active').get(template.getActive);
	app.route('/api/public/templates/:templateId').get(template.getById);

	app.route('/api/public/templates').post(template.create);
	app.route('/api/public/templates/:templateId').post(template.update);
	app.route('/api/public/templates/:templateId/hide').post(template.hide);
	app.route('/api/public/templates/:templateId/unhide').post(template.unhide);
};