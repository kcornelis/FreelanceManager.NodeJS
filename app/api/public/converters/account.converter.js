'use strict';

var _ = require('lodash'),
	Q = require('q');

function singleToDto(account) {
	return account ? {
		id: account.id,
		name: account.name,
		firstName: account.firstName,
		lastName: account.lastName,
		email: account.email
	} : null;
}

function multipleToDto(accounts) {
	return _.map(accounts, singleToDto);
}

function toDto(a) {
	return _.isArray(a) ? multipleToDto(a) : singleToDto(a);
}

module.exports = {
	toDto: toDto,
	toDtoQ: function(a) {
		return Q.fcall(toDto, a);
	}
};
