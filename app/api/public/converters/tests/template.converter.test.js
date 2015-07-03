'use strict';

var should = require('should'),
	mongoose = require('mongoose'),
	Template = mongoose.model('Template'),
	convert = require('../template');

describe('Template Converter Unit Tests:', function() {

	describe('When an template is converted to a dto', function() {

		var converted;

		beforeEach(function() {
			var template = Template.create('1', 'template name', 'template content');
			template.hide();

			converted = convert.toDto(template);
		});

		it('should have an id', function() {
			converted.id.should.exist;
		});

		it('should have a name', function() {
			converted.name.should.eql('template name');
		});

		it('should have content', function() {
			converted.content.should.eql('template content');
		});

		it('should have a hidden flag', function() {
			converted.hidden.should.eql(true);
		});
	});

	describe('When multiple templates are converted to dtos', function() {

		var converted;

		beforeEach(function() {
			converted = convert.toDto([
				Template.create('1', 'template name 1', 'template content 1'),
				Template.create('2', 'template name 2', 'template content 2')
			]);
		});

		it('should convert to an array', function() {
			converted.length.should.eql(2);

			converted[0].name.should.eql('template name 1');
			converted[1].name.should.eql('template name 2');
		});
	});

	describe('When an template is converted to a dto with a promise', function() {

		var converted;

		beforeEach(function(done) {
			var template = Template.create('1', 'template name', 'template content');
			template.hide();

			convert.toDtoQ(template)
				.then(function(a) { converted = a; })
				.finally(done)
				.done();
		});

		it('should have an id', function() {
			converted.id.should.exist;
		});

		it('should have a name', function() {
			converted.name.should.eql('template name');
		});

		it('should have content', function() {
			converted.content.should.eql('template content');
		});

		it('should have a hidden flag', function() {
			converted.hidden.should.eql(true);
		});
	});
});
