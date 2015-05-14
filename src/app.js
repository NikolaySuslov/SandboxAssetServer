var express = require('express'),
	cors = require('cors'),

	util = require('./util.js');


function server(config)
{
	var app = config.expressApp || express();

	// parse client session, if available
	app.use( util.headerSessions(config) );
	app.use( cors() );

	app.options('*', cors());

	// define routes
	app.get('/assets/by-id/:id([0-9A-Fa-f]{8})', function(req,res,next)
	{
		console.log('request by '+(req.session.username || '<anon>'));
		res.sendStatus(200);
	});

	// start server
	if( !config.expressApp && config.port ){
		app.listen(config.port);
		console.log('Started asset server on port '+config.port);
	}
}

exports.server = server;

// top-level script, just start the server
if(!module.parent)
{
	server( require('../config.json') );
}
