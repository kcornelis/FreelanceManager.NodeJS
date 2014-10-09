'use strict';

/**
 * Module dependencies.
 */
var accounts = require('../controllers/account'),
	jwt = require('express-jwt'),
	config = require_config();

module.exports = function(app) {

	app.use('/api/public', jwt({ secret: config.jwtSecret }));

	app.route('/api/public/accounts').get(accounts.getAll);
	app.route('/api/public/account/:accountId').get(accounts.getById);

	app.route('/api/public/account/create').post(accounts.create);
	app.route('/api/public/account/update/:accountId').post(accounts.update);
	app.route('/api/public/account/:accountId/changepassword').post(accounts.changepassword);
};