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
	app.route('/api/public/projects/active').get(project.getActive);
	app.route('/api/public/projects/:projectId').get(project.getById);

	app.route('/api/public/projects').post(project.create);
	app.route('/api/public/projects/:projectId').post(project.update);
	app.route('/api/public/projects/:projectId/hide').post(project.hide);
	app.route('/api/public/projects/:projectId/unhide').post(project.unhide);
	app.route('/api/public/projects/:projectId/changetasks').post(project.changeTasks);
};