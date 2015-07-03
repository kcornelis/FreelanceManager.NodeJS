'use strict';

var should = require('should'),
	mongoose = require('mongoose'),
	Project = mongoose.model('Project'),
	Company = mongoose.model('Company'),
	convert = require('../project');

describe('Project Converter Unit Tests:', function() {

	describe('When an project is converted to a dto with company', function() {

		var converted;

		beforeEach(function() {
			var project = Project.create(1, 'companyId', 'FM Manager', 'Freelance management');
			project.changeTasks([
				{ name: 'Development', defaultRateInCents: 0 },
				{ name: 'Meeting', defaultRateInCents: 4000 }
			]);
			project.hide();

			var company = Company.create(1, '1', 'John Doe', 'BE123', { line1: 'kerkstraat', line2: 'tav me', postalcode: '1000', city: 'brussel'});

			converted = convert.toDtoWithCompany(project, company);
		});

		it('should have an id', function() {
			converted.id.should.exist;
		});

		it('should have a company id', function() {
			converted.companyId.should.eql('companyId');
		});

		it('should have a company name', function() {
			converted.company.name.should.eql('John Doe');
		});

		it('should have a name', function() {
			converted.name.should.eql('FM Manager');
		});

		it('should have a description', function() {
			converted.description.should.eql('Freelance management');
		});

		it('should have tasks', function() {
			converted.tasks[0].name.should.eql('Development');
			converted.tasks[0].defaultRateInCents.should.eql(0);
			converted.tasks[0].billable.should.eql(false);

			converted.tasks[1].name.should.eql('Meeting');
			converted.tasks[1].defaultRateInCents.should.eql(4000);
			converted.tasks[1].billable.should.eql(true);
		});

		it('should have a hidden flag', function() {
			converted.hidden.should.eql(true);
		});
	});

	describe('When multiple projects are converted to dtos', function() {

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

			converted = convert.toDtoWithCompany(projects, companies);
		});

		it('should convert to an array', function() {
			converted.length.should.eql(2);

			converted[0].name.should.eql('FM Manager 1');
			converted[1].name.should.eql('FM Manager 2');
		});

		it('should map companies', function() {
			converted[0].company.name.should.eql('John Doe');
			converted[1].company.name.should.eql('Jane Doe');
		});
	});

	describe('When an project is converted to a dto with a promise', function() {

		var converted;

		beforeEach(function(done) {

			var project = Project.create(1, 'companyId', 'FM Manager', 'Freelance management');
			project.changeTasks([
				{ name: 'Development', defaultRateInCents: 0 },
				{ name: 'Meeting', defaultRateInCents: 4000 }
			]);
			project.hide();

			var company = Company.create(1, '1', 'John Doe', 'BE123', { line1: 'kerkstraat', line2: 'tav me', postalcode: '1000', city: 'brussel'});

			convert.toDtoWithCompanyQ(project, company)
				.then(function(a) { converted = a; })
				.finally(done)
				.done();
		});

		it('should have an id', function() {
			converted.id.should.exist;
		});

		it('should have a company id', function() {
			converted.companyId.should.eql('companyId');
		});

		it('should have a company name', function() {
			converted.company.name.should.eql('John Doe');
		});

		it('should have a name', function() {
			converted.name.should.eql('FM Manager');
		});

		it('should have a description', function() {
			converted.description.should.eql('Freelance management');
		});

		it('should have tasks', function() {
			converted.tasks[0].name.should.eql('Development');
			converted.tasks[0].defaultRateInCents.should.eql(0);
			converted.tasks[0].billable.should.eql(false);

			converted.tasks[1].name.should.eql('Meeting');
			converted.tasks[1].defaultRateInCents.should.eql(4000);
			converted.tasks[1].billable.should.eql(true);
		});

		it('should have a hidden flag', function() {
			converted.hidden.should.eql(true);
		});
	});
});
