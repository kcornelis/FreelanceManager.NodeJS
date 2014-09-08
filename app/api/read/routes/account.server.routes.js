'use strict';

/**
 * Module dependencies.
 */
var accounts = require('../controllers/account'),
	jwt = require('express-jwt'),
	config = require_config();

module.exports = function(app) {

  //app.use('/api/read', jwt({ secret: config.jwtSecret }))

  app.route('/api/read/accounts').get(accounts.getAll);
  app.route('/api/read/account/:accountId').get(accounts.getById);
};