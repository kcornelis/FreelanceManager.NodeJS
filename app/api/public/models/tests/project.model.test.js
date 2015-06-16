'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	uuid = require('node-uuid'),
	Project = mongoose.model('Project');


describe('Project Model Unit Tests:', function() {

	var tenant = uuid.v1();

	describe('When an project is created', function() {

		var original, saved;

		before(function(done) {
			original = Project.create(tenant, 'companyId', 'FM Manager', 'Freelance management');
			done();
		});

		it('should be able to save without problems', function(done) {
			original.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('should be in the database', function(done) {
			Project.findOne({
				_id: original._id
			}, function(err, project) {

				should.not.exist(err);
				should.exist(project);

				saved = project;

				done();
			});
		});

		it('should have a tenant', function() {

			saved.tenant.should.eql(tenant);
		});

		it('should have a client id', function() {

			saved.companyId.should.eql('companyId');
		});

		it('should have a name', function() {

			saved.name.should.eql('FM Manager');
		});

		it('should have a description', function() {

			saved.description.should.eql('Freelance management');
		});	

		it('should not be hidden', function() {

			saved.hidden.should.eql(false);
		});	

		it('should have some default tasks', function() {

			saved.tasks[0].name.should.eql('Development');
			saved.tasks[0].defaultRateInCents.should.eql(0);

			saved.tasks[1].name.should.eql('Analyse');
			saved.tasks[1].defaultRateInCents.should.eql(0);

			saved.tasks[2].name.should.eql('Meeting');
			saved.tasks[2].defaultRateInCents.should.eql(0);			
		});	

		it('should have version 2', function() {

			saved.version.should.eql(2);
		});

		it('should have a created event', function() {

			saved.events[0].companyId.should.eql('companyId');
			saved.events[0].name.should.eql('FM Manager');
			saved.events[0].description.should.eql('Freelance management');
			saved.events[0].tenant.should.eql(tenant);

			saved.events[0].metadata.eventName.should.eql('ProjectCreated');
		});

		it('should have a tasks changed event', function() {

			saved.events[1].tasks[0].name.should.eql('Development');
			saved.events[1].tasks[0].defaultRateInCents.should.eql(0);

			saved.events[1].tasks[1].name.should.eql('Analyse');
			saved.events[1].tasks[1].defaultRateInCents.should.eql(0);

			saved.events[1].tasks[2].name.should.eql('Meeting');
			saved.events[1].tasks[2].defaultRateInCents.should.eql(0);

			saved.events[1].metadata.eventName.should.eql('ProjectTasksChanged');
		});

		it('should have created on date', function() {

			new Date(saved.createdOn).should.greaterThan(new Date(Date.now() - 10000));
			new Date(saved.createdOn).should.lessThan(new Date(Date.now() + 10000));
		});

		after(function(done) {
			Project.remove(done);
		});
	});

	describe('When a project is created with no tenant', function() {

		it('should fail', function(done) {

			var project = Project.create(null, 'companyId', 'FM Manager', 'Freelance management');
			project.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	describe('When a project is created with no company', function() {

		it('should fail', function(done) {

			var project = Project.create(tenant, undefined, 'FM Manager', 'Freelance management');
			project.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	describe('When a project is created with no name', function() {

		it('should fail', function(done) {

			var project = Project.create(tenant, 'companyId', '', 'Freelance management');
			project.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});	

	describe('When a project details is changed', function() {

		var original, saved;

		before(function(done) {
			original = Project.create(tenant, 'companyId', 'FM Manager', 'Freelance management');
			original.save(done);
		});

		it('should be saved with no problems', function(done) {
			Project.findById(original._id, function(err, project) {

				should.not.exist(err);

				project.changeDetails('Freelance Manager', 'Test project');

				project.save(function(saveerr) {

					should.not.exist(saveerr);
					done();
				});
			});
		});

		it('should be updated in the database', function(done) {
			Project.findById(original._id, function(err, project) {

				should.not.exist(err);
				should.exist(project);

				saved = project;

				done();
			});
		});

		it('should have no updated client id', function() {

			saved.companyId.should.eql('companyId');
		});

		it('should have an updated name', function() {

			saved.name.should.eql('Freelance Manager');
		});

		it('should have an updated description', function() {

			saved.description.should.eql('Test project');
		});

		it('should have the same created on date', function() {

			saved.createdOn.should.eql(original.createdOn);
		});

		it('should have an updated version', function() {

			saved.version.should.eql(3);
		});

		it('should have a details changed event', function() {

			saved.events[2].name.should.eql('Freelance Manager');
			saved.events[2].description.should.eql('Test project');

			saved.events[2].metadata.eventName.should.eql('ProjectDetailsChanged');
		});

		after(function(done) {
			Project.remove(done);
		});
	});

	describe('When a project details is changed with the same values', function() {

		var project;

		before(function() {
			project = Project.create(tenant, 'companyId', 'FM Manager', 'Freelance management');
			project.changeDetails('FM Manager', 'Freelance management');
		});

		it('should not create a new event', function() {

			project.events.should.have.length(2);
		});

		after(function(done) {
			Project.remove(done);
		});
	});

	describe('When a project tasks is changed', function() {

		var original, saved;

		before(function(done) {
			original = Project.create(tenant, 'companyId', 'FM Manager', 'Freelance management');
			original.save(done);
		});

		it('should be saved with no problems', function(done) {
			Project.findById(original._id, function(err, project) {

				should.not.exist(err);

				project.changeTasks([
					{ name: 'Development', defaultRateInCents: 5000 },
					{ name: 'Meeting', defaultRateInCents: 4000 },
					{ name: 'Thinking', defaultRateInCents: 6000 }]);

				project.save(function(saveerr) {

					should.not.exist(saveerr);
					done();
				});
			});
		});

		it('should be updated in the database', function(done) {
			Project.findById(original._id, function(err, project) {

				should.not.exist(err);
				should.exist(project);

				saved = project;

				done();
			});
		});

		it('should have an updated task list', function() {

			saved.tasks[0].name.should.eql('Development');
			saved.tasks[0].defaultRateInCents.should.eql(5000);

			saved.tasks[1].name.should.eql('Meeting');
			saved.tasks[1].defaultRateInCents.should.eql(4000);

			saved.tasks[2].name.should.eql('Thinking');
			saved.tasks[2].defaultRateInCents.should.eql(6000);
		});

		it('should have an updated version', function() {

			saved.version.should.eql(3);
		});

		it('should have a tasks changed event', function() {

			saved.events[2].tasks[0].name.should.eql('Development');
			saved.events[2].tasks[0].defaultRateInCents.should.eql(5000);

			saved.events[2].tasks[1].name.should.eql('Meeting');
			saved.events[2].tasks[1].defaultRateInCents.should.eql(4000);

			saved.events[2].tasks[2].name.should.eql('Thinking');
			saved.events[2].tasks[2].defaultRateInCents.should.eql(6000);

			saved.events[2].metadata.eventName.should.eql('ProjectTasksChanged');
		});

		after(function(done) {
			Project.remove(done);
		});
	});

	describe('When a project tasks is changed with the same values', function() {

		var project;

		before(function() {
			project = Project.create(tenant, 'companyId', 'FM Manager', 'Freelance management');
			project.changeTasks([
					{ name: 'Development', defaultRateInCents: 0 },
					{ name: 'Analyse', defaultRateInCents: 0 },
					{ name: 'Meeting', defaultRateInCents: 0 }]);
		});

		it('should not create a new event', function() {

			project.events.should.have.length(2);
		});

		after(function(done) {
			Project.remove(done);
		});
	});

	describe('When a project is made hidden', function() {

		var original, saved;

		before(function(done) {
			original = Project.create(tenant, 'companyId', 'FM Manager', 'Freelance management');
			original.save(done);
		});

		it('should be saved with no problems', function(done) {
			Project.findById(original._id, function(err, project) {

				should.not.exist(err);

				project.hide();

				project.save(function(saveerr) {

					should.not.exist(saveerr);
					done();
				});
			});
		});

		it('should be updated in the database', function(done) {
			Project.findById(original._id, function(err, project) {

				should.not.exist(err);
				should.exist(project);

				saved = project;

				done();
			});
		});

		it('should have an updated hidden field', function() {

			saved.hidden.should.eql(true);
		});

		it('should have an updated version', function() {

			saved.version.should.eql(3);
		});

		it('should have a details changed event', function() {


			saved.events[2].metadata.eventName.should.eql('ProjectHidden');
		});

		after(function(done) {
			Project.remove(done);
		});
	});

	describe('When a project is hidden for the second time', function() {

		var project;

		before(function() {
			project = Project.create(tenant, 'companyId', 'FM Manager', 'Freelance management');
			project.hide();
			project.hide();
		});

		it('should not create a new event', function() {

			project.events.should.have.length(3); // create, tasks, hide
		});

		after(function(done) {
			Project.remove(done);
		});
	});

	describe('When a project is made unhidden', function() {

		var original, saved;

		before(function(done) {
			original = Project.create(tenant, 'companyId', 'FM Manager', 'Freelance management');
			original.save(done);
		});

		it('should be saved with no problems', function(done) {
			Project.findById(original._id, function(err, project) {

				should.not.exist(err);

				project.hide();
				project.unhide();

				project.save(function(saveerr) {

					should.not.exist(saveerr);
					done();
				});
			});
		});

		it('should be updated in the database', function(done) {
			Project.findById(original._id, function(err, project) {

				should.not.exist(err);
				should.exist(project);

				saved = project;

				done();
			});
		});

		it('should have an updated hidden field', function() {

			saved.hidden.should.eql(false);
		});

		it('should have an updated version', function() {

			saved.version.should.eql(4);
		});

		it('should have a details changed event', function() {


			saved.events[3].metadata.eventName.should.eql('ProjectUnhidden');
		});

		after(function(done) {
			Project.remove(done);
		});
	});

	describe('When a project is unhidden for the second time', function() {

		var project;

		before(function() {
			project = Project.create(tenant, 'companyId', 'FM Manager', 'Freelance management');
			project.unhide();
			project.unhide();
		});

		it('should not create a new event', function() {

			project.events.should.have.length(2); // create, tasks
		});

		after(function(done) {
			Project.remove(done);
		});
	});
});