 'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	uuid = require('node-uuid'),
	_ = require('lodash'),
	util = require('util'),
	AggregateRoot = require('../aggregateroot'),
	repository = require('../repository');

/**
 * Test data
 */

 function Person(id, name) {

	this._name = '';

	AggregateRoot.call(this, id);
	subscribeToDomainEvents(this);

	if(name){
		this.apply('PersonCreated', {
			name: name
		});	
	}
};

util.inherits(Person, AggregateRoot);

_.extend(Person.prototype, {
	getName: function(){
		return this._name;
	},
	rename: function(name){
		this.apply('PersonRenamed', {
			name: name
		});	
	}
});

function subscribeToDomainEvents(person) {
	var _this = person;

	person.onEvent('PersonCreated', function(event) {
		_this._name = event.name;
	});

	person.onEvent('PersonRenamed', function(event) {
		_this._name = event.name;
	});
}

/**
 * Unit tests
 */
describe('Repository Unit Tests:', function() {

	describe('When an aggregate is saved in the repository', function() {

		var id = uuid.v1();
		var person = new Person(id, 'John');

		it('should be able to save without problems', function(done) {

			repository.save(person, function(err){
				should.not.exist(err);
				done();
			});
		});
	});

	describe('When an aggregate is retrieved by id', function() {

		var id = uuid.v1();

		before(function(done){
			repository.save(new Person(id, 'John'), function(){
				done();
			});
		});

		it('should be able to get without problems', function(done) {

			repository.getById(new Person(id), function(err){
				should.not.exist(err);
				done();
			});
		});
	});

	describe('When a person is saved and retrieved from the repository', function(){
		
		var id = uuid.v1();
		var person;

		before(function(done){
			var original = new Person(id, 'John');
			original.rename('Jane');
			original.rename('Homer');
			repository.save(original, function(){
				repository.getById(new Person(id), function(err, p){
					person = p;
					done();
				});
			});
		});

		it('should have all events applied', function(){
			person.getName().should.eql('Homer');
		});

		it('should have the correct version', function(){
			person.getVersion().should.eql(3);
		});		
	});
});
