var express = require('express'),
	cors = require('cors'),

	util = require('./util.js');


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
	router.get('/assets/by-id/:id([0-9A-Fa-f]{8})', function(req,res,next)
	{
		console.log('request by '+(req.session.username || '<anon>'));
		res.sendStatus(200);
	});

	return router;
}

module.exports = router;

// top-level script, just start the server
if(!module.parent)
{
	var config = require('../config.json');
	var app = express();
	app.use(config.urlBasePath, router(config));
	app.listen(config.port);
	console.log('Started asset server on port '+config.port);
}
