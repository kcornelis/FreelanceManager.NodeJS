 'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	async = require('async'),
	_ = require('lodash'),
	servicebus = require('../servicebus');


/**
 * Unit tests
 */
describe('Service Bus Unit Tests:', function() {

	describe('When a domain event subscription is created', function() {

		it('should be able to execute without problems', function(done) {

			servicebus.subscribeToDomainEvents('sb-test-1', function(){ }, function(err){
				should.not.exist(err);
				done();
			});
		});

		after(function(done){
			servicebus.deleteDomainEventSubscription('sb-test-1', done);
		});
	});

	describe('When a domain event subscription is deleted', function() {

		var counter = 0;

		var handlers = {
			AmountAdded: function(evt, done){
				counter += evt.amount;
				done();
			}
		}

		before(function(done){
			async.series([
				function(done){
					servicebus.subscribeToDomainEvents('sb-test-2', handlers, done);
				},
				function(done){
					servicebus.publishDomainEvent({ amount: 1, metadata: { eventName: 'AmountAdded' } }, done);
				},
				function(done){
					servicebus.processEvents(done);
				}
			], done);
		});

		it('should not handle domain events anymore', function(done){
			servicebus.deleteDomainEventSubscription('sb-test-2', function(){
				servicebus.publishDomainEvent({ amount: 1, metadata: { eventName: 'AmountAdded' } }, function(){
					servicebus.processEvents(function(){
						counter.should.eql(1);
						done();
					});
				});
			});
		});
	});	

	describe('When a domain event is published', function(){
		var counter1 = 0, counter2 = 0;

		var handlers1 = {
			AmountAdded: function(evt, done){
				// without done callback (should not timeout the test)
				counter1 += evt.amount;
				done();
			}
		}

		var handlers2 = {
			AmountAdded: function(evt){
				// without done callback (should not timeout the test)
				counter2 += evt.amount;
			}
		};

		before(function(done){
			async.series([
				function(done){
					servicebus.subscribeToDomainEvents('sb-test-3', handlers1, done);
				},
				function(done){
					servicebus.subscribeToDomainEvents('sb-test-4', handlers2, done);
				},
				function(done){
					servicebus.publishDomainEvent({ amount: 1, metadata: { eventName: 'AmountAdded' } }, done);
				},
				function(done){
					servicebus.publishDomainEvent({ amount: 2, metadata: { eventName: 'AmountAdded' } }, done);
				},
				function(done){
					servicebus.processEvents(done);
				}
			], done);
		});

		it('should be dispatched to the subscriptions', function(){
			counter2.should.eql(3);
			counter1.should.eql(3);
		});

		after(function(done){
			servicebus.deleteDomainEventSubscription('sb-test-3', function(){
				servicebus.deleteDomainEventSubscription('sb-test-4', function(){
					done();
				});
			});
		});
	});
});	