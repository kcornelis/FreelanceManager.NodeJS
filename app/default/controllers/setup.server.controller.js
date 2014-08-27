'use strict';

var mongoose = require('mongoose'),
    AccountModel = mongoose.model('Account'),
    DomainAccount = require_domain('account'),
    repository = require_domain('repository'),
    uuid = require('node-uuid');


exports.getSetup = function(req, res) {

  AccountModel.findOne().exec(function(err, hasAccount){

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

  AccountModel.findOne().exec(function(err, hasAccount){

    if(hasAccount){
      res.status(404).render('404', {
        url: req.originalUrl,
        error: 'Not Found'
      });
    }
    else{

      var id = uuid.v1();
      var account = new DomainAccount(id, req.body.name, req.body.firstName, req.body.lastName, req.body.email);
      account.changePassword(req.body.password);
      account.makeAdmin();

      repository.save(account, function(err){
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
