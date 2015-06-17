var express = require('express'),
	cors = require('cors'),
	cookieParser = require('cookie-parser'),
	bodyParser = require('body-parser'),
	libpath = require('path'),
	compress = require('compression'),

	util = require('./util.js'),
	assets = require('./assets.js'),
	query = require('./query.js'),
	groups = require('./groups.js'),
	metadata = require('./metadata.js'),
	perms = require('./perms.js'),
	db = require('./db.js');


function router(config)
{
	var absoluteDataDir = libpath.resolve( libpath.join(__dirname, '..'), config.dataDir );
	db.initialize( libpath.join(absoluteDataDir, 'database.sqlite') );
	
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

	// parse cookies
	router.use(cookieParser());

	// attach module config object to requests
	router.use(function(req,res,next){
		req.assetConfig = config;
		req.assetConfig.absoluteDataDir = absoluteDataDir;
		return next();
	});

	// parse client session, if available
	router.use( util.headerSessions );
	router.use( util.parseRange );

	// tell clients how to authenticate
	router.get('/session-cookie-name', function(req,res){
		res.send( config.sessionHeader );
	});

	// define routes
	router.post('/assets/new', assets.newAsset);
	router.get('/assets/:id([0-9A-Fa-f]{8})', assets.getAsset);
	router.post('/assets/:id([0-9A-Fa-f]{8})', assets.overwriteAsset);
	router.delete('/assets/:id([0-9A-Fa-f]{8})', assets.deleteAsset);

	router.get('/assets/by-user/:user([A-Za-z_][A-Za-z0-9_-]*)$', query.listAssetsByUser);
	router.get('/assets/by-meta/:conj((?:any|all))-of', query.listAssetsByMeta);

	router.post('/assets/:id([0-9A-Fa-f]{8})/meta/permissions', perms.setPerms);
	router.delete('/assets/:id([0-9A-Fa-f]{8})/meta/permissions',
		function(req,res){ res.status(403).send('Cannot clear protected field'); }
	);
	router.post('/assets/:id([0-9A-Fa-f]{8})/meta/group_name', perms.setGroup);
	router.delete('/assets/:id([0-9A-Fa-f]{8})/meta/group_name', perms.setGroup);

	router.get('/assets/:id([0-9A-Fa-f]{8})/meta/:fields([A-Za-z0-9_+.]+)$', metadata.getSomeMetadata);
	router.get('/assets/:id([0-9A-Fa-f]{8})/meta', metadata.getAllMetadata);
	router.post('/assets/:id([0-9A-Fa-f]{8})/meta/:field([A-Za-z0-9_.]+)$', metadata.setSomeMetadata);
	router.post('/assets/:id([0-9A-Fa-f]{8})/meta', metadata.setAllMetadata);
	router.delete('/assets/:id([0-9A-Fa-f]{8})/meta/:field([A-Za-z0-9_.]+)$', metadata.deleteSomeMetadata);
	router.delete('/assets/:id([0-9A-Fa-f]{8})/meta', metadata.deleteAllMetadata);

	router.post('/groups/new', groups.newGroup);
	router.get('/groups/by-user/:user([A-Za-z_][A-Za-z0-9_-]*)$', groups.getUserMembership);
	router.get('/groups/:gname([A-Za-z_][A-Za-z0-9_-]*)$', groups.getGroupMembership);
	router.post('/groups/:gname([A-Za-z_][A-Za-z0-9_-]*)/adduser', groups.addUser);
	router.post('/groups/:gname([A-Za-z_][A-Za-z0-9_-]*)/rmuser', groups.rmUser);

	router.use(function(req,res){
		res.sendStatus(404);
	});

	console.log('Asset server directory is', absoluteDataDir);
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
