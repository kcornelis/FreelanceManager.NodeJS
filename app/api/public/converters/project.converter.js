'use strict';

var _ = require('lodash'),
	Q = require('q');

function singleToDtoWithCompany(project, company) {
	return project ? {
		id: project.id,
		companyId: project.companyId,
		company: company ? {
			name: company.name
		} : null,
		name: project.name,
		description: project.description,
		tasks: _.map(project.tasks, function(t) {
			return {
				name: t.name,
				defaultRateInCents: t.defaultRateInCents,
				billable: t.defaultRateInCents > 0
			};
		}),
		hidden: project.hidden
	} : null;
}

function multipleToDtoWithCompany(projects, companies) {
	return _.map(projects, function(p) {
		return singleToDtoWithCompany(p, _.find(companies, { id: p.companyId }));
	});
}

function toDtoWithCompany(p, c) {
	return _.isArray(p) ? multipleToDtoWithCompany(p, c) : singleToDtoWithCompany(p, c);
}

module.exports = {
	toDtoWithCompany: toDtoWithCompany,
	toDtoWithCompanyQ: function(p, c) {
		return Q.fcall(toDtoWithCompany, p, c);
	}
};
