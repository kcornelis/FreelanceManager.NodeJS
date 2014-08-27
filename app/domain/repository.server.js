'use strict';

var config = require_config(),
	_ = require('lodash'),
	AggregateRoot = require('./aggregateroot');

var es = require('eventstore')({
  type: 'mongodb',
  host: config.mongo.eventstore.host, 
  port: config.mongo.eventstore.port,   
  dbName: config.mongo.eventstore.name
});
es.useEventPublisher(function(evt, callback) {
	// bus.sendAndWaitForAck('event', evt, callback);
});
es.init();

exports.save = function(item, callback) {
	
	if(item instanceof AggregateRoot == false){
		throw new Error('item should be an aggregate root!');
	}

	var changes = item.getUncommittedChanges();

	if(changes.length > 0) {
		es.getEventStream(item.getId(), function(err, stream) { 

			if(err) {
				callback(err);                   
			}
			else {
			    _.each(changes, function(evt) {
			    	stream.addEvent(evt);
			    });

				stream.commit(function(err, stream) {
					callback(err);
				});
			}
		});	
	}
	else {
		callback();
	}
};

exports.getById = function(item, callback){

	es.getEventStream(item.getId(), function(err, stream){
		if(err) {
			callback(err);
		}
		else {
			var payloads = _.map(stream.events, function(i) { return i.payload; });
			
			item.loadFromHistory(payloads);
			callback(null, item);
		}
	});
};