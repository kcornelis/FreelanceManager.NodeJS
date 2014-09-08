'use strict';

var config = require_config(),
	jwt = require('jsonwebtoken'),
	mongoose = require('mongoose'),
	AccountPassword = mongoose.model('AccountPassword'),
	Account = mongoose.model('Account');

exports.authenticate = function(req, res, next) {

	AccountPassword.findOne({ email: req.body.email }, function(err, accountPassword) {
		if(err) {
			next(err);
		}
		else {
			if(accountPassword && accountPassword.authenticate(req.body.password)) {
				
				Account.findOne({ aggregateRootId: accountPassword.aggregateRootId }, function(err, account){
					
					if(err) {
						next(err);
					}
					else {
						var profile = {
							email: account.email,
							aggregateRootId: account.aggregateRootId,
							firstName: account.firstName,
							lastName: account.lastName,
							fullName: account.fullName
						}

						var token = jwt.sign(profile, config.jwtSecret, { expiresInMinutes: 60*5 });

						res.json({ token: token });
					}
				});
			}
			else {
				res.send(401, 'Wrong email or password');
			}
		}
	});
}