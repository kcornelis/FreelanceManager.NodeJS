 'use strict';

var servicebus = require_infrastructure('servicebus'),
	mongoose = require('mongoose'),
	Account = mongoose.model('Account');

servicebus.subscribeToDomainEvents('fm-account-rm', {
	
	AccountCreated: function(evt, done) {

		var account = new Account({
			aggregateRootId: evt.aggregateRootId,
			firstName: evt.firstName,
			lastName: evt.lastName,
			name: evt.name,
			email: evt.email,
			version: evt.metadata.eventVersion
		});
		
		account.save(function(){
			done();
		});
	},

	AccountDetailsChanged: function(evt, done) {

		Account.findOne({
			aggregateRootId: evt.aggregateRootId
		})
		.exec(function(err, account) {
			if(account) {
				account.firstName = evt.firstName;
				account.lastName = evt.lastName;
				account.name = evt.name;
				account.email = evt.email;
				account.version = evt.metadata.eventVersion;
				
				account.save(done);
			}
			else done('account not found');
		});
	},

	AccountPasswordChanged: function(evt, done){

		Account.findOne({
			aggregateRootId: evt.aggregateRootId
		})
		.exec(function(err, account) {
			if(account) {
				account.version = evt.metadata.eventVersion;
				
				account.save(done);
			}
			else done('account not found');
		});
	},

	AccountMadeAdmin: function(evt, done){

		Account.findOne({
			aggregateRootId: evt.aggregateRootId
		})
		.exec(function(err, account) {
			if(account) {
				account.admin = true;
				account.version = evt.metadata.eventVersion;
				
				account.save(done);
			}
			else done('account not found');
		});
	}
});
