 'use strict';

var servicebus = require_infrastructure('servicebus'),
	mongoose = require('mongoose'),
	AccountPassword = mongoose.model('AccountPassword');

servicebus.subscribeToDomainEvents('fm-accountpassword-rm', {
	
	AccountCreated: function(evt, done) {

		var account = new AccountPassword({
			aggregateRootId: evt.aggregateRootId,
			email: evt.email,
			version: evt.metadata.eventVersion
		});
		
		account.save(function(){
			done();
		});
	},

	AccountDetailsChanged: function(evt, done) {

		AccountPassword.findOne({
			aggregateRootId: evt.aggregateRootId
		})
		.exec(function(err, account) {
			if(account) {
				account.email = evt.email;
				account.version = evt.metadata.eventVersion;
				
				account.save(done);
			}
			else done('account password not found');
		});
	},

	AccountPasswordChanged: function(evt, done){

		AccountPassword.findOne({
			aggregateRootId: evt.aggregateRootId
		})
		.exec(function(err, account) {
			if(account) {
				account.passwordHash = evt.passwordHash;
				account.passwordSalt = evt.passwordSalt;
				account.version = evt.metadata.eventVersion;
				
				account.save(done);
			}
			else done('account password not found');
		});
	},

	AccountMadeAdmin: function(evt, done){

		AccountPassword.findOne({
			aggregateRootId: evt.aggregateRootId
		})
		.exec(function(err, account) {
			if(account) {
				account.version = evt.metadata.eventVersion;
				
				account.save(done);
			}
			else done('account password not found');
		});
	}
});
