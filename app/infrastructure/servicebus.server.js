'use strict';

var config = require_config(),
	async = require('async'),
	_ = require('lodash');

var topicName = 'fm-domain';
var domainSubscriptions = [];
var events = []; // in memory service bus

exports.subscribeToDomainEvents = function(name, handlers, callback) {

	//TODO check for unique names !!!
	domainSubscriptions.push({
		name: name,
		handlers: handlers
	});

	if(callback)
		callback();
};

exports.deleteDomainEventSubscription = function(name, callback){
	_.remove(domainSubscriptions, { name: name });
	
	if(callback)
		callback();
};

exports.processEvents = function(callback) {

	if(events.empty && callback)
		callback();

	async.eachSeries(events, function(evt, evtCallback){
		async.each(domainSubscriptions, function(subscription, subscriptionCallback){
			
			if(evt && evt.metadata && evt.metadata.eventName){
				var handler = subscription.handlers[evt.metadata.eventName];
				if(handler) {
					// check if the handlers has a done callback, if not we should call the subscriptioncallback ourself
					if(handler.length > 1){
						handler(evt, subscriptionCallback);
					}else{
						handler(evt);
						subscriptionCallback();
					}
				}
				else subscriptionCallback();
			}
			else subscriptionCallback();
		},
		function(err) {
			// the evt is send to all subscriptions so we can remove it
			evtCallback();
		});
	},
	function(err) {
		// all events are handled
		events = [];
		if(callback)
			callback();
	});
};

exports.start = function(){
	// start after all registrations in express.js
	receiveLoop();
};

function receiveLoop(){
	setTimeout(function(){
		exports.processEvents(function(){
			receiveLoop();
		});
	}, 1000);
}

exports.publishDomainEvent = function(evt, callback) {

	if(!evt.metadata){
		evt.metadata = {
			eventName: '',
			eventVersion: 0,
			eventId: ''
		};
	}

	events.push(evt);

	if(callback)
		callback();
};

exports.publishDomainEvents = function(evts, callback){
	async.eachSeries(evts, function(evt, done) {
		exports.publishDomainEvent(evt, done);
	}, callback);
};