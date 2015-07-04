'use strict';

var should = require('should'),
	mongoose = require('mongoose'),
	TimeRegistration = mongoose.model('TimeRegistration'),
	Company = mongoose.model('Company'),
	Project = mongoose.model('Project'),
	convert = require('../timeregistration');

describe('Time Registration Converter Unit Tests:', function() {

	describe('When an time registration is converted to a dto', function() {

		var converted,
			company,
			project;

		beforeEach(function() {
			company = Company.create(1, '1', 'John Doe', 'BE123', { line1: 'kerkstraat', line2: 'tav me', postalcode: '1000', city: 'brussel'});
			project = Project.create(1, company.id, 'FM Manager', 'Freelance management');
			var timeRegistration = TimeRegistration.create('1', company.id, project.id, 'Development', true, 'description', 20141020, 30, 1205);

			converted = convert.toDtoWithCompanyAndProject(timeRegistration, company, project);
		});

		it('should have an id', function() {
			converted.id.should.exist;
		});

		it('should have a company id', function() {
			converted.companyId.should.eql(company.id);
		});

		it('should have a company', function() {
			converted.company.name.should.eql('John Doe');
		});

		it('should have a project id', function() {
			converted.projectId.should.eql(project.id);
		});

		it('should have a project', function() {
			converted.project.name.should.eql('FM Manager');
			converted.project.description.should.eql('Freelance management');
		});

		it('should have a task', function() {
			converted.task.should.eql('Development');
		});

		it('should have a billable flag', function() {
			converted.billable.should.eql(true);
		});

		it('should have a description', function() {
			converted.description.should.eql('description');
		});

		it('should have a date', function() {
			converted.date.year.should.eql(2014);
			converted.date.month.should.eql(10);
			converted.date.day.should.eql(20);
			converted.date.numeric.should.eql(20141020);
		});

		it('should have a from hour', function() {
			converted.from.hour.should.eql(0);
			converted.from.minutes.should.eql(30);
			converted.from.numeric.should.eql(30);
		});

		it('should have a to hour', function() {
			converted.to.hour.should.eql(12);
			converted.to.minutes.should.eql(5);
			converted.to.numeric.should.eql(1205);
		});

		it('should have a total minutes', function() {
			converted.totalMinutes.should.eql(695);
		});
	});

	describe('When multiple time registrations are converted to dtos', function() {

		var converted;

		beforeEach(function() {
			var companies = [
				Company.create(1, '1', 'John Doe', 'BE123', { line1: 'kerkstraat', line2: 'tav me', postalcode: '1000', city: 'brussel'}),
				Company.create(1, '2', 'Jane Doe', 'BE123', { line1: 'kerkstraat', line2: 'tav me', postalcode: '1000', city: 'brussel'}),
				Company.create(1, '3', 'Ricky Doe', 'BE123', { line1: 'kerkstraat', line2: 'tav me', postalcode: '1000', city: 'brussel'})
			];

			var projects = [
				Project.create(1, companies[0].id, 'FM Manager 1', 'Freelance management 1'),
				Project.create(1, companies[1].id, 'FM Manager 2', 'Freelance management 2')
			];

			var timeRegistrations = [
				TimeRegistration.create('1', companies[0].id, projects[0].id, 'Development', true, 'description 1', 20141020, 30, 1205),
				TimeRegistration.create('1', companies[1].id, projects[1].id, 'Development', true, 'description 2', 20141020, 30, 1205)
			];

			converted = convert.toDtoWithCompanyAndProject(timeRegistrations, companies, projects);
		});

		it('should convert to an array', function() {
			converted.length.should.eql(2);

			converted[0].description.should.eql('description 1');
			converted[1].description.should.eql('description 2');
		});

		it('should map companies', function() {
			converted[0].company.name.should.eql('John Doe');
			converted[1].company.name.should.eql('Jane Doe');
		});

		it('should map projects', function() {
			converted[0].project.name.should.eql('FM Manager 1');
			converted[1].project.name.should.eql('FM Manager 2');
		});
	});

	describe('When an time registration is converted to a dto with a promise', function() {

		var converted,
			company,
			project;

		beforeEach(function(done) {
			company = Company.create(1, '1', 'John Doe', 'BE123', { line1: 'kerkstraat', line2: 'tav me', postalcode: '1000', city: 'brussel'});
			project = Project.create(1, company.id, 'FM Manager', 'Freelance management');
			var timeRegistration = TimeRegistration.create('1', company.id, project.id, 'Development', true, 'description', 20141020, 30, 1205);

			convert.toDtoWithCompanyAndProjectQ(timeRegistration, company, project)
				.done(function(a) { converted = a; done(); });
		});

		it('should have an id', function() {
			converted.id.should.exist;
		});

		it('should have a company id', function() {
			converted.companyId.should.eql(company.id);
		});

		it('should have a company', function() {
			converted.company.name.should.eql('John Doe');
		});

		it('should have a project id', function() {
			converted.projectId.should.eql(project.id);
		});

		it('should have a project', function() {
			converted.project.name.should.eql('FM Manager');
			converted.project.description.should.eql('Freelance management');
		});

		it('should have a task', function() {
			converted.task.should.eql('Development');
		});

		it('should have a billable flag', function() {
			converted.billable.should.eql(true);
		});

		it('should have a description', function() {
			converted.description.should.eql('description');
		});

		it('should have a date', function() {
			converted.date.year.should.eql(2014);
			converted.date.month.should.eql(10);
			converted.date.day.should.eql(20);
			converted.date.numeric.should.eql(20141020);
		});

		it('should have a from hour', function() {
			converted.from.hour.should.eql(0);
			converted.from.minutes.should.eql(30);
			converted.from.numeric.should.eql(30);
		});

		it('should have a to hour', function() {
			converted.to.hour.should.eql(12);
			converted.to.minutes.should.eql(5);
			converted.to.numeric.should.eql(1205);
		});

		it('should have a total minutes', function() {
			converted.totalMinutes.should.eql(695);
		});
	});
});
