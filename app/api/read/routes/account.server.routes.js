'use strict';

/**
 * Module dependencies.
 */
var accounts = require('../controllers/account');

module.exports = function(app) {

  app.route('/api/read/accounts').get(accounts.getAll);
  app.route('/api/read/account/:accountId').get(accounts.getById);
};
