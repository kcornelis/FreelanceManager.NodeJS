'use strict';

/**
 * Module dependencies.
 */
var clients = require('../controllers/client'),
	jwt = require('express-jwt'),
	config = require_config();

module.exports = function(app) {
	
	app.use('/api/public', jwt({ secret: config.jwtSecret }));

	app.route('/api/public/clients').get(clients.getAll);
	app.route('/api/public/client/:clientId').get(clients.getById);

	app.route('/api/public/client/create').post(clients.create);
	app.route('/api/public/client/update/:clientId').post(clients.update);
};