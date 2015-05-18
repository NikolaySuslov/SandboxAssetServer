var express = require('express'),
	logger = require('connect-logger'),
	cors = require('cors'),

	util = require('./util.js'),
	assets = require('./assets.js');


function router(config)
{
	var router = express.Router();

	// use CORS
	router.use( cors() );
	router.options('*', cors());

	// attach module config object to requests
	router.use(function(req,res,next){
		req.assetConfig = config;
		return next();
	});

	// parse client session, if available
	router.use( util.headerSessions );

	// define routes
	router.get('/assets/by-id/:id([0-9A-Fa-f]{8})', assets.getAsset);

	return router;
}

module.exports = router;

// top-level script, just start the server
if(!module.parent)
{
	var config = require('../config.json');
	var app = express();
	app.use(logger());
	app.use(config.urlBasePath, router(config));
	app.listen(config.port);
	console.log('Started asset server on port '+config.port);
}
