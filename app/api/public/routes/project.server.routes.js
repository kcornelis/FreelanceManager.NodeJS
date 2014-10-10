'use strict';

/**
 * Module dependencies.
 */
var project = require('../controllers/project'),
	jwt = require('express-jwt'),
	config = require_config();

module.exports = function(app) {
	
	app.use('/api/public', jwt({ secret: config.jwtSecret }));

	app.route('/api/public/projects').get(project.getAll);
	app.route('/api/public/project/:projectId').get(project.getById);

	app.route('/api/public/project/create').post(project.create);
	app.route('/api/public/project/update/:projectId').post(project.update);
};