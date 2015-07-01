'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	_ = require('lodash'),
	async = require('async'),
	Invoice = mongoose.model('Invoice'),
	Company = mongoose.model('Company');

function convert(invoice) {

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
		lines: _.map(invoice.lines, function(l) {

			return {
				description: l.description,
				quantity: l.quantity,
				priceInCents: l.priceInCents,
				price: l.priceInCents / 100,
				vatPercentage: l.vatPercentage,
				totalInCents: l.totalInCents,
				total: l.totalInCents / 100
			};
		}),
		subTotalInCents: invoice.subTotalInCents,
		subTotal: invoice.subTotalInCents / 100,
		vatPerPercentages: _.map(invoice.vatPerPercentages, function(p) {

			return {
				vatPercentage: p.vatPercentage,
				totalVatInCents: p.totalVatInCents,
				totalVat: p.totalVatInCents / 100
			};
		}),
		totalVatInCents: invoice.totalVatInCents,
		totalVat: invoice.totalVatInCents / 100,
		totalInCents: invoice.totalInCents,
		total: invoice.totalInCents / 100,
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

exports.getByDate = function(req, res, next) {

	Invoice.find(
	{ 
		tenant: req.user.id,
		'date.numeric': { $gte: req.params.from, $lte: req.params.to }
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

	invoice.save(function(err) {

		if(err) next(err);                     
		else res.send(convert(invoice));
	});
};

exports.preview = function(req, res) {

	var invoice = Invoice.create(req.user.id, req.body.number, req.body.date, req.body.creditTerm);
	invoice.changeTemplate(req.body.template);
	invoice.replaceLines(req.body.lines);
	invoice.changeCustomer(req.body.customer.name, req.body.customer.vatNumber, req.body.customer.number, req.body.customer.address);
	invoice.linkTimeRegistrations(req.body.linkedTimeRegistrationIds);

	res.send(convert(invoice));
};

exports.getInfoForPeriodPerCustomer = function(req, res, next) {
	
	Invoice.aggregate([
	{
		$match: {
			tenant: req.user.id,
			'date.numeric': { $gte: parseInt(req.params.from), $lte: parseInt(req.params.to) }
		}
	},
	{ 	
		$group: { 
			_id: { customerNumber: '$customer.number' },
			count: { $sum: 1 },
			totalWithoutVatInCents: { $sum: '$subTotalInCents' },
			totalInCents: { $sum: '$totalInCents' }
		}
	}],
	function (err, result) {
		
		if(err) next(err);
		else
		{
			var companies;

			var customerNumbers = _.uniq(_.map(result, function(tr) { return tr._id.customerNumber; }));

			async.parallel([
				function(done) {
					Company.find({ tenant: req.user.id }).in('number', customerNumbers).exec(function(err, c) { companies = c; done(); });
				}
			], 
			function() {

				res.send(_.map(result, function(r) {

					return {
						customerNumber: r._id.customerNumber,
						company: _.find(companies, { 'number': r._id.customerNumber }),
						count: r.count,
						totalWithoutVatInCents: r.totalWithoutVatInCents,
						totalWithoutVat: r.totalWithoutVatInCents / 100,
						totalInCents: r.totalInCents,
						total: r.totalInCents / 100
					};
				}));
			});
		}
	});	
};