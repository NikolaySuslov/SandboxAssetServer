var express = require('express'),
	cors = require('cors'),
	bodyParser = require('body-parser'),
	libpath = require('path'),
	compress = require('compression'),

	util = require('./util.js'),
	assets = require('./assets.js'),
	groups = require('./groups.js'),
	db = require('./db.js');


function router(config)
{
	db.initialize( libpath.join(config.dataDir, 'database.sqlite') );
	
	var router = express.Router();

	// use compression
	router.use(compress({
		filter: function(req,res){
			return res.get('Content-Type') === 'application/octet-stream' || compress.filter(req,res);
		}
	}));

	// use CORS
	router.use( cors() );
	router.options('*', cors());

	// parse body
	router.use( bodyParser.raw({
		limit: 500e6,
		type: '*/*'
	}));

	// attach module config object to requests
	router.use(function(req,res,next){
		req.assetConfig = config;
		return next();
	});

	// parse client session, if available
	router.use( util.headerSessions );

	// define routes
	router.post('/assets/new', assets.newAsset);
	router.get('/assets/by-id/:id([0-9A-Fa-f]{8})', assets.getAsset);
	router.post('/assets/by-id/:id([0-9A-Fa-f]{8})', assets.overwriteAsset);

	router.post('/groups/new', groups.newGroup);
	router.get('/groups/by-user/:user([A-Za-z][A-Za-z0-9]*)', groups.getUserMembership);
	router.get('/groups/:gname([A-Za-z][A-Za-z0-9]*)', groups.getGroupMembership);
	router.post('/groups/:gname([A-Za-z][A-Za-z0-9]*)/adduser', groups.addUser);
	router.post('/groups/:gname([A-Za-z][A-Za-z0-9]*)/rmuser', groups.rmUser);

	return router;
}

module.exports = router;

// top-level script, just start the server
if(!module.parent)
{
	var config = require('../config.json'),
		logger = require('connect-logger');

	var app = express();
	app.use(logger());
	app.set('x-powered-by', false);
	app.set('etag', 'strong');

	app.use(config.urlBasePath, router(config));

	app.listen(config.port);
	console.log('Started asset server on port '+config.port);
}
