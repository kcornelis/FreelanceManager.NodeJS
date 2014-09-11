'use strict';

/**
 * Module dependencies.
 */
var clients = require('../controllers/client'),
	jwt = require('express-jwt'),
	config = require_config();

module.exports = function(app) {

  app.use('/api/read', jwt({ secret: config.jwtSecret }));

  app.route('/api/read/clients').get(clients.getAll);
  app.route('/api/read/client/:clientId').get(clients.getById);
};