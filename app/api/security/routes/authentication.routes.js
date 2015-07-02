'use strict';

module.exports = function(app) {
	
	// authentication routing
	var authentication = require('../controllers/authentication');

	app.route('/security/authenticate').post(authentication.authenticate);
};
