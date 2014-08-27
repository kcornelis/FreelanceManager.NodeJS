'use strict';

/**
 * Module dependencies.
 */
var accounts = require('../controllers/account');

module.exports = function(app) {

  app.route('/api/write/accounts/create').post(accounts.create);
  app.route('/api/write/accounts/update/:accountId').post(accounts.update);
  app.route('/api/write/accounts/:accountId/changepassword').post(accounts.changepassword);
};
