 'use strict';

var servicebus = require_infrastructure('servicebus'),
	mongoose = require('mongoose'),
	Client = mongoose.model('Client');

servicebus.subscribeToDomainEvents('fm-client-rm', {
	
	ClientCreated: function(evt, done) {

		var client = new Client({
			aggregateRootId: evt.aggregateRootId,
			name: evt.name,
			version: evt.metadata.eventVersion
		});
		
		client.save(done);
	},

	ClientDetailsChanged: function(evt, done) {

		Client.findOne({
			aggregateRootId: evt.aggregateRootId
		}, function(err, client) {
			if(client) {
				client.name = evt.name;
				client.version = evt.metadata.eventVersion;
				
				client.save(done);
			}
			else done('client not found');
		});
	}
});
