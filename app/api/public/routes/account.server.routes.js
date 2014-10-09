'use strict';

/**
 * Module dependencies.
 */
var account = require('../controllers/account'),
	jwt = require('express-jwt'),
	config = require_config();

module.exports = function(app) {

	app.use('/api/public', jwt({ secret: config.jwtSecret }));

	app.route('/api/public/accounts').get(account.getAll);
	app.route('/api/public/account/:accountId').get(account.getById);

	app.route('/api/public/account/create').post(account.create);
	app.route('/api/public/account/update/:accountId').post(account.update);
	app.route('/api/public/account/:accountId/changepassword').post(account.changepassword);
};