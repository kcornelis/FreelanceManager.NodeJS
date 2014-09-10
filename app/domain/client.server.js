'use strict';

var util = require('util'),
	_ = require('lodash'),
	AggregateRoot = require_domain('aggregateroot'),
	repository = require_infrastructure('repository');

module.exports = Client;	

function Client(id, name){

	this._name = '';

	AggregateRoot.call(this, id);
	subscribeToDomainEvents(this);

	if(name){
		this.apply('ClientCreated', {
			name: name
		});	
	}
}

util.inherits(Client, AggregateRoot);

_.extend(Client.prototype, {
	getName: function(){
		return this._name;
	},
	changeDetails: function(name){
		this.apply('ClientDetailsChanged', {
			name: name
		});			
	}
});

function subscribeToDomainEvents(client) {
	var _this = client;

	client.onEvent('ClientCreated', function(event) {
		_this._name = event.name;
	});

	client.onEvent('ClientDetailsChanged', function(event) {
		_this._name = event.name;
	});
}