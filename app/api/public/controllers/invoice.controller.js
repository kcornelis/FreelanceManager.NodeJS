'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	_ = require('lodash'),
	Invoice = mongoose.model('Invoice');

function convert(invoice){
	return {
		id: invoice.id,
		number: invoice.number,
		date: invoice.date,
		creditTerm: invoice.creditTerm,
		template: invoice.template,
		customer: {
			name: invoice.customer.name,
			vatNumber: invoice.customer.vatNumber,
			number: invoice.customer.number,
			address: {
				line1: invoice.customer.address.line1,
				line2: invoice.customer.address.line2,
				postalcode: invoice.customer.address.postalcode,
				city: invoice.customer.address.city
			}
		},
		lines: _.map(invoice.lines, function(l){
			return {
				description: l.description,
				quantity: l.quantity,
				priceInCents: l.priceInCents,
				vatPercentage: l.vatPercentage,
				totalInCents: l.totalInCents
			};
		}),
		subTotalInCents: invoice.subTotalInCents,
		vatPerPercentages: _.map(invoice.vatPerPercentages, function(p){
			return {
				vatPercentage: p.vatPercentage,
				totalVatInCents: p.totalVatInCents
			};
		}),
		totalVatInCents: invoice.totalVatInCents,
		totalInCents: invoice.totalInCents,
		linkedTimeRegistrations: invoice.linkedTimeRegistrations
	};
}

exports.getById = function(req, res, next) {

	Invoice.findOne(
	{ 
		_id: req.params.invoiceId,
		tenant: req.user.id
	}, 
	function(err, invoice) {
		if(invoice)
			res.send(convert(invoice));
		else next();
	});
};

exports.getAll = function(req, res, next) {

	Invoice.find(
	{ 
		tenant: req.user.id 
	},
	function(err, invoices) {
		if(err) next(err);
		else res.send(_.map(invoices, convert));
	});
};

exports.create = function(req, res, next) {

	var invoice = Invoice.create(req.user.id, req.body.number, req.body.date, req.body.creditTerm);
	invoice.changeTemplate(req.body.template);
	invoice.replaceLines(req.body.lines);
	invoice.changeCustomer(req.body.customer.name, req.body.customer.vatNumber, req.body.customer.number, req.body.customer.address);
	invoice.linkTimeRegistrations(req.body.linkedTimeRegistrationIds);

	invoice.save(function(err){
		if(err) next(err);                     
		else res.send(convert(invoice));
	});
};