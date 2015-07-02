'use strict';

var _ = require('lodash');

function convert(account) {
	return {
		id: account.id,
		name: account.name,
		firstName: account.firstName,
		lastName: account.lastName,
		email: account.email
	};
}

module.exports = function(a) {
	return _.isArray(a) ? _.map(a, convert) : convert(a);
};
