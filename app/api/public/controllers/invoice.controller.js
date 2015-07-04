'use strict';

var mongoose = require('mongoose-q')(),
	_ = require('lodash'),
	convert = require('../converters/invoice'),
	Invoice = mongoose.model('Invoice'),
	Company = mongoose.model('Company');

exports.getById = function(req, res, next) {

	Invoice.findOneQ({
		_id: req.params.invoiceId,
		tenant: req.user.id
	})
	.then(convert.toDtoQ)
	.then(function(dto) { 
		if(dto) res.send(dto);
		else next(); // invoice not found
	})
	.catch(next)
	.done();
};

exports.getAll = function(req, res, next) {

	Invoice.findQ({
		tenant: req.user.id
	})
	.then(convert.toDtoQ)
	.then(res.send.bind(res))
	.catch(next)
	.done();
};

exports.getByDate = function(req, res, next) {

	Invoice.findQ({
		tenant: req.user.id,
		'date.numeric': { $gte: req.params.from, $lte: req.params.to }
	})
	.then(convert.toDtoQ)
	.then(res.send.bind(res))
	.catch(next)
	.done();
};

exports.create = function(req, res, next) {

	var invoice = Invoice.create(req.user.id, req.body.number, req.body.date, req.body.creditTerm);
	invoice.changeTemplate(req.body.template);
	invoice.replaceLines(req.body.lines);
	invoice.changeCustomer(req.body.customer.name, req.body.customer.vatNumber, req.body.customer.number, req.body.customer.address);
	invoice.linkTimeRegistrations(req.body.linkedTimeRegistrationIds);

	invoice.saveQ()
		.then(convert.toDtoQ)
		.then(res.send.bind(res))
		.catch(next)
		.done();
};

exports.preview = function(req, res) {

	var invoice = Invoice.create(req.user.id, req.body.number, req.body.date, req.body.creditTerm);
	invoice.changeTemplate(req.body.template);
	invoice.replaceLines(req.body.lines);
	invoice.changeCustomer(req.body.customer.name, req.body.customer.vatNumber, req.body.customer.number, req.body.customer.address);
	invoice.linkTimeRegistrations(req.body.linkedTimeRegistrationIds);

	res.send(convert.toDto(invoice));
};

exports.getInfoForPeriodPerCustomer = function(req, res, next) {
	
	Invoice.aggregate()
		.match({
			tenant: req.user.id,
			'date.numeric': { $gte: parseInt(req.params.from), $lte: parseInt(req.params.to) }
		})
		.group({ 
			_id: { customerNumber: '$customer.number' },
			count: { $sum: 1 },
			totalWithoutVatInCents: { $sum: '$subTotalInCents' },
			totalInCents: { $sum: '$totalInCents' }
		})
		.execQ()
		.then(function(result) {
			var customerNumbers = _.uniq(_.pluck(result, '_id.customerNumber'));
			return [result, Company.find({ tenant: req.user.id }).in('number', customerNumbers).execQ()];
		})
		.spread(function(result, companies) {
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
		})
		.catch(next)
		.done();
};
