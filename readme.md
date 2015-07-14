## Freelance manager [![Build Status](https://travis-ci.org/kcornelis/FreelanceManager.NodeJS.svg?branch=master)](https://travis-ci.org/kcornelis/FreelanceManager.NodeJS)

This is a demo application in NodeJS.   
It provides basic CRM, projects, time tracking and invoicing.   
   
### Frameworks
   
- NodeJS - Express
- MongoDB
- Bootstrap - [Flat Theme](https://github.com/kcornelis/flat-theme)
- AngularJS
- Flot
- Mocha - Karma
- Grunt
- Travis
- ...
   
### Grunt
   
```bash
# lint and run the project locally (no libbuild)
grunt

# build everything
grunt build
# only build external libraries (run after an npm or bower package is updated)
grunt libbuild
# only build our own javascript and css files
grunt fmbuild

# lint and test everything
grunt test
# lint and test the server
grunt testserver
# lint and test the client
grunt testclient
```
   

## GNU GENERAL PUBLIC LICENSE
   
Copyright (c) 2015 Kevin Cornelis