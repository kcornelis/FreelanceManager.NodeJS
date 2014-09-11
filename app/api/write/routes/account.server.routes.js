'use strict';

/**
 * Module dependencies.
 */
var accounts = require('../controllers/account'),
	jwt = require('express-jwt'),
	config = require_config();

module.exports = function(app) {

	app.use('/api/write/accounts', jwt({ secret: config.jwtSecret }));

	app.route('/api/write/accounts/create').post(accounts.create);
	app.route('/api/write/accounts/update/:accountId').post(accounts.update);
	app.route('/api/write/accounts/:accountId/changepassword').post(accounts.changepassword);
};
