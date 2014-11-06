'use strict';

var mongoose = require('mongoose'),
    Account = mongoose.model('Account'),
    uuid = require('node-uuid');


exports.getSetup = function(req, res) {

  Account.findOne(function(err, hasAccount){

    if(hasAccount) {
      res.status(404).render('404', {
        url: req.originalUrl,
        error: 'Not Found'
      });
    }
    else {
      res.render('setup');
    }
  });
};

exports.postSetup = function(req, res) {

  Account.findOne(function(err, hasAccount){

    if(hasAccount){
      res.status(404).render('404', {
        url: req.originalUrl,
        error: 'Not Found'
      });
    }
    else{

      var account = Account.create(req.body.name, req.body.firstName, req.body.lastName, req.body.email);
      account.changePassword(req.body.password);
      account.makeAdmin();

      account.save(function(err){
        if(!err) {
          res.redirect('/');
        }
        else {
          res.redirect('/setup');
        }
      });
    }
  });
};
