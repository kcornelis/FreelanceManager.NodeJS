'use strict';

var _ = require('lodash'),
	Q = require('q');

function singleToDtoWithCompanyAndProject(timeRegistration, company, project) {
	return timeRegistration ? {
		id: timeRegistration.id,
		companyId: timeRegistration.companyId,
		company: company ? {
			name: company.name
		} : null,
		projectId: timeRegistration.projectId,
		project: project ? {
			name: project.name,
			description: project.description
		} : null,
		task: timeRegistration.task,
		billable: timeRegistration.billable,
		description: timeRegistration.description,
		date: timeRegistration.date,
		from: timeRegistration.from,
		to: timeRegistration.to,
		totalMinutes: timeRegistration.totalMinutes
	} : null;
}

function multipleToDtoWithCompanyAndProject(timeRegistrations, companies, projects) {
	return _.map(timeRegistrations, function(tr) {
			return singleToDtoWithCompanyAndProject(tr,
				_.find(companies, { id: tr.companyId }),
				_.find(projects, { id: tr.projectId }));
		});
}

function toDtoWithCompanyAndProject(tr, c, p) {
	return _.isArray(tr) ? multipleToDtoWithCompanyAndProject(tr, c, p) : singleToDtoWithCompanyAndProject(tr, c, p);
}

module.exports = {
	toDtoWithCompanyAndProject: toDtoWithCompanyAndProject,
	toDtoWithCompanyAndProjectQ: function(t, c, p) {
		return Q.fcall(toDtoWithCompanyAndProject, t, c, p);
	}
};
