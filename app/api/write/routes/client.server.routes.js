'use strict';

/**
 * Module dependencies.
 */
var clients = require('../controllers/client'),
	jwt = require('express-jwt'),
	config = require_config();

module.exports = function(app) {

	app.use('/api/write/clients', jwt({ secret: config.jwtSecret }));

	app.route('/api/write/clients/create').post(clients.create);
	app.route('/api/write/clients/update/:accountId').post(clients.update);
};
