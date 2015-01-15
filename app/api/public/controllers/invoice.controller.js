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
		to: {
			name: invoice.to.name,
			vatNumber: invoice.to.vatNumber,
			customerNumber: invoice.to.customerNumber,
			address: {
				line1: invoice.to.address.line1,
				line2: invoice.to.address.line2,
				postalcode: invoice.to.address.postalcode,
				city: invoice.to.address.city
			}
		},
		lines: _.map(invoice.lines, function(l){
			return {
				description: l.description,
				quantity: l.quantity,
				price: l.price,
				vatPercentage: l.vatPercentage,
				total: l.total
			}
		}),
		subTotal: invoice.subTotal,
		vatPerPercentages: _.map(invoice.vatPerPercentages, function(p){
			return {
				vatPercentage: p.vatPercentage,
				totalVat: p.totalVat
			}
		}),
		totalVat: invoice.totalVat,
		total: invoice.total
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
}

exports.getAll = function(req, res) {

	Invoice.find(
	{ 
		tenant: req.user.id 
	},
	function(err, invoices) {
		if(err) next(err);
		else res.send(_.map(invoices, convert));
	});
}

exports.create = function(req, res, next) {

	var invoice = Invoice.create(req.user.id, req.body.number, req.body.date, req.body.creditTerm);
	invoice.changeTemplate(req.body.template);
	invoice.replaceLines(req.body.lines);
	invoice.changeTo(req.body.to.name, req.body.to.vatNumber, req.body.to.customerNumber, req.body.to.address);

	invoice.save(function(err){
		if(err) next(err);                     
		else res.send(convert(invoice));
	});
}