'use strict';

var should = require('should'),
	mongoose = require('mongoose'),
	uuid = require('node-uuid'),
	Template = mongoose.model('Template');


describe('Template Model Unit Tests:', function() {

	var tenant = uuid.v1();

	describe('When an template is created', function() {

		var original, saved;

		before(function(done) {
			original = Template.create(tenant, 'template name', 'template content');
			done();
		});

		it('should be able to save without problems', function(done) {
			original.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('should be in the database', function(done) {
			Template.findOne({
				_id: original._id
			}, function(err, template) {

				should.not.exist(err);
				should.exist(template);

				saved = template;

				done();
			});
		});

		it('should have a tenant', function() {

			saved.tenant.should.eql(tenant);
		});

		it('should have a name', function() {

			saved.name.should.eql('template name');
		});

		it('should have a content', function() {

			saved.content.should.eql('template content');
		});	

		it('should not be hidden', function() {

			saved.hidden.should.eql(false);
		});	

		it('should have version 1', function() {

			saved.version.should.eql(1);
		});

		it('should have a created event', function() {

			saved.events[0].name.should.eql('template name');
			saved.events[0].content.should.eql('template content');
			saved.events[0].tenant.should.eql(tenant);

			saved.events[0].metadata.eventName.should.eql('TemplateCreated');
		});

		it('should have created on date', function() {

			new Date(saved.createdOn).should.greaterThan(new Date(Date.now() - 10000));
			new Date(saved.createdOn).should.lessThan(new Date(Date.now() + 10000));
		});

		after(function(done) {
			Template.remove(done);
		});
	});

	describe('When a template is created with no tenant', function() {

		it('should fail', function(done) {

			var template = Template.create(null, 'template name', 'template content');
			template.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	describe('When a template is created with no name', function() {

		it('should fail', function(done) {

			var template = Template.create(tenant, '', 'template content');
			template.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});	

	describe('When template details are changed', function() {

		var original, saved;

		before(function(done) {
			original = Template.create(tenant, 'template name', 'template content');
			original.save(done);
		});

		it('should be saved with no problems', function(done) {
			Template.findById(original._id, function(err, template) {

				should.not.exist(err);

				template.changeDetails('hello', 'there');

				template.save(function(saveerr) {

					should.not.exist(saveerr);
					done();
				});
			});
		});

		it('should be updated in the database', function(done) {
			Template.findById(original._id, function(err, template) {

				should.not.exist(err);
				should.exist(template);

				saved = template;

				done();
			});
		});

		it('should have an updated name', function() {

			saved.name.should.eql('hello');
		});

		it('should have an updated content', function() {

			saved.content.should.eql('there');
		});

		it('should have the same created on date', function() {

			saved.createdOn.should.eql(original.createdOn);
		});

		it('should have an updated version', function() {

			saved.version.should.eql(2);
		});

		it('should have a details changed event', function() {

			saved.events[1].name.should.eql('hello');
			saved.events[1].content.should.eql('there');

			saved.events[1].metadata.eventName.should.eql('TemplateDetailsChanged');
		});

		after(function(done) {
			Template.remove(done);
		});
	});

	describe('When a template details is changed with the same values', function() {

		var template;

		before(function() {
			template = Template.create(tenant, 'template name', 'template content');
			template.changeDetails('template name', 'template content');
		});

		it('should not create a new event', function() {

			template.events.should.have.length(1);
		});

		after(function(done) {
			Template.remove(done);
		});
	});

	describe('When a template is made hidden', function() {

		var original, saved;

		before(function(done) {
			original = Template.create(tenant, 'template name', 'template content');
			original.save(done);
		});

		it('should be saved with no problems', function(done) {
			Template.findById(original._id, function(err, template) {

				should.not.exist(err);

				template.hide();

				template.save(function(saveerr) {

					should.not.exist(saveerr);
					done();
				});
			});
		});

		it('should be updated in the database', function(done) {
			Template.findById(original._id, function(err, template) {

				should.not.exist(err);
				should.exist(template);

				saved = template;

				done();
			});
		});

		it('should have an updated hidden field', function() {

			saved.hidden.should.eql(true);
		});

		it('should have an updated version', function() {

			saved.version.should.eql(2);
		});

		it('should have a details changed event', function() {


			saved.events[1].metadata.eventName.should.eql('TemplateHidden');
		});

		after(function(done) {
			Template.remove(done);
		});
	});

	describe('When a template is hidden for the second time', function() {

		var template;

		before(function() {
			template = Template.create(tenant, 'template name', 'template content');
			template.hide();
			template.hide();
		});

		it('should not create a new event', function() {

			template.events.should.have.length(2);
		});

		after(function(done) {
			Template.remove(done);
		});
	});

	describe('When a template is made unhidden', function() {

		var original, saved;

		before(function(done) {
			original = Template.create(tenant, 'template name', 'template content');
			original.save(done);
		});

		it('should be saved with no problems', function(done) {
			Template.findById(original._id, function(err, template) {

				should.not.exist(err);

				template.hide();
				template.unhide();

				template.save(function(saveerr) {

					should.not.exist(saveerr);
					done();
				});
			});
		});

		it('should be updated in the database', function(done) {
			Template.findById(original._id, function(err, template) {

				should.not.exist(err);
				should.exist(template);

				saved = template;

				done();
			});
		});

		it('should have an updated hidden field', function() {

			saved.hidden.should.eql(false);
		});

		it('should have an updated version', function() {

			saved.version.should.eql(3);
		});

		it('should have a details changed event', function() {


			saved.events[2].metadata.eventName.should.eql('TemplateUnhidden');
		});

		after(function(done) {
			Template.remove(done);
		});
	});

	describe('When a template is unhidden for the second time', function() {

		var template;

		before(function() {
			template = Template.create(tenant, 'template name', 'template content');
			template.unhide();
			template.unhide();
		});

		it('should not create a new event', function() {

			template.events.should.have.length(1);
		});

		after(function(done) {
			Template.remove(done);
		});
	});
});