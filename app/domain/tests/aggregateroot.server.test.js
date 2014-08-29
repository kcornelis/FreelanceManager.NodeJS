'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	uuid = require('node-uuid'),
	_ = require('lodash'),
	util = require('util'),
	AggregateRoot = require_domain('aggregateroot');

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
describe('Aggregate Root Unit Tests:', function() {

	describe('When an aggregate is created', function() {

		var id = uuid.v1();
		var aggregate = new AggregateRoot(id);

		it('should have an id', function() {
			aggregate.getId().should.eql(id);
		});

		it('should have no version', function(){
			aggregate.getVersion().should.eql(0);
		});

		it('should have no transient events', function(){
			aggregate.getUncommittedChanges().should.be.empty;
		});
	});

	describe('When an event is applied to an aggregate', function(){

		var id = uuid.v1();
		var person = new Person(id, 'John');
		person.rename('Jane');

		it('should contain the event name', function(){
			person.getUncommittedChanges()[0].metadata.eventName.should.eql('PersonCreated');
			person.getUncommittedChanges()[1].metadata.eventName.should.eql('PersonRenamed');
		});

		it('should contain the aggregate id', function(){
			person.getUncommittedChanges()[0].aggregateRootId.should.eql(id);
			person.getUncommittedChanges()[1].aggregateRootId.should.eql(id);
		});

		it('should contain the event version', function(){
			person.getUncommittedChanges()[0].metadata.eventVersion.should.eql(1);
			person.getUncommittedChanges()[1].metadata.eventVersion.should.eql(2);
		});

		it('should contain a unique id', function(){
			person.getUncommittedChanges()[0].metadata.eventId.should.exist;
			person.getUncommittedChanges()[1].metadata.eventId.should.have.length(36);
			person.getUncommittedChanges()[0].metadata.eventId.should.not.eql(person.getUncommittedChanges()[1].metadata.eventId);
		});

		it('should contain a created on date', function(){
      		person.getUncommittedChanges()[0].metadata.eventCreatedOn.should.greaterThan(new Date(Date.now() - 10000));
      		person.getUncommittedChanges()[0].metadata.eventCreatedOn.should.lessThan(new Date(Date.now() + 10000));
		});

		it('should be added to the uncommited changes', function(){
			person.getUncommittedChanges().should.have.length(2);
		});
	});

	describe('When a person is created', function(){

		var id = uuid.v1();
		var person = new Person(id, 'John');

		it('should have an id', function(){
			person.getId().should.eql(id);
		});

		it('should have a name', function(){
			person.getName().should.eql('John');
		});

		it('should have a version', function(){
			person.getVersion().should.eql(1); // one event
		});

		it('should have one uncommitted event', function(){
			person.getUncommittedChanges().should.have.length(1);
		});

		it('should have an uncommitted person created event', function(){
			person.getUncommittedChanges()[0].name.should.eql('John');
		});
	});

	describe('When a person is renamed', function(){

		var id = uuid.v1();
		var person = new Person(id, 'John');
		person.rename('Jane');

		it('should have changes', function(){
			person.getUncommittedChanges().should.have.length(2);
		});

		it('should have the latest event applied', function(){
			person.getName().should.eql('Jane');
		});

		it('should have the latest version', function(){
			person.getVersion().should.eql(2);
		});
	});

	describe('When a persons changes are marked as commited', function(){

		var id = uuid.v1();
		var person = new Person(id, 'John');
		person.rename('Jane');
		person.markChangesAsCommited();

		it('should have no changes', function(){
			person.getUncommittedChanges().should.be.empty;
		});

		it('should have the latest event applied', function(){
			person.getName().should.eql('Jane');
		});

		it('should have the latest version', function(){
			person.getVersion().should.eql(2);
		});
	});

	describe('When a person is loaded from history', function(){

		var id = uuid.v1();
		var p = new Person(id, 'John');
		p.rename('Jane');

		var person = new Person(2);
		person.loadFromHistory(p.getUncommittedChanges());

		it('should have no changes', function(){
			person.getUncommittedChanges().should.be.empty;
		});

		it('should have the latest event applied', function(){
			person.getName().should.eql('Jane');
		});

		it('should have the latest version', function(){
			person.getVersion().should.eql(2);
		});
	});
});