'use strict';

var config = require_config(),
	jwt = require('jsonwebtoken'),
	mongoose = require('mongoose'),
	Account = mongoose.model('Account');

exports.authenticate = function(req, res, next) {

	Account.findOne({ email: req.body.email }, function(err, account) {
		if(err) {
			next(err);
		} else {
			if(account && account.authenticate(req.body.password)) {
				
				var profile = {
					email: account.email,
					id: account.id,
					firstName: account.firstName,
					lastName: account.lastName,
					fullName: account.fullName
				};

				var token = jwt.sign(profile, config.jwtSecret, { expiresInMinutes: 60*5 });

				res.json({ token: token });
			}
			else {
				res.send(401, 'Wrong email or password');
			}
		}
	});
};
