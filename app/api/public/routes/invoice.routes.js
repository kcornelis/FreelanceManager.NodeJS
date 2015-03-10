'use strict';

/**
 * Module dependencies.
 */
var invoice = require('../controllers/invoice'),
	jwt = require('express-jwt'),
	config = require_config();

module.exports = function(app) {
	
	app.use('/api/public', jwt({ secret: config.jwtSecret }));

	app.route('/api/public/invoices').get(invoice.getAll);
	app.route('/api/public/invoices/:invoiceId').get(invoice.getById);

	app.route('/api/public/invoices').post(invoice.create);
	app.route('/api/public/invoices/preview').post(invoice.preview);
};