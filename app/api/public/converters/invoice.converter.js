'use strict';

var _ = require('lodash'),
	Q = require('q');

function singleToDto(invoice) {
	return invoice ? {
		id: invoice.id,
		number: invoice.number,
		date: invoice.date,
		creditTerm: invoice.creditTerm,
		template: invoice.template,
		customer: invoice.customer ? {
			name: invoice.customer.name,
			vatNumber: invoice.customer.vatNumber,
			number: invoice.customer.number,
			address: {
				line1: invoice.customer.address.line1,
				line2: invoice.customer.address.line2,
				postalcode: invoice.customer.address.postalcode,
				city: invoice.customer.address.city
			}
		} : null,
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
	} : null;
}

function multipleToDto(invoices) {
	return _.map(invoices, singleToDto);
}

function toDto(i) {
	return _.isArray(i) ? multipleToDto(i) : singleToDto(i);
}

module.exports = {
	toDto: toDto,
	toDtoQ: function(i) {
		return Q.fcall(toDto, i);
	}
};
