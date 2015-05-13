var express = require('express'),

	util = require('./util.js');


function server(config)
{
	var app = config.expressApp || express();

	// parse client session, if available
	app.use( util.headerSessions(config) );

	// define routes

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
