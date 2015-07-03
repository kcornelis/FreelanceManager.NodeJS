'use strict';

var _ = require('lodash'),
	Q = require('q');

function singleToDto(company) {
	return company ? {
		id: company.id,
		name: company.name,
		number: company.number,
		vatNumber: company.vatNumber,
		address: company.address ? {
			line1: company.address.line1,
			line2: company.address.line2,
			postalcode: company.address.postalcode,
			city: company.address.city
		} : null
	} : null;
}

function multipleToDto(companies) {
	return _.map(companies, singleToDto);
}

function toDto(c) {
	return _.isArray(c) ? multipleToDto(c) : singleToDto(c);
}

module.exports = {
	toDto: toDto,
	toDtoQ: function(c) {
		return Q.fcall(toDto, c);
	}
};
