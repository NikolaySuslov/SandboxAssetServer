var mime = require('mime'),
	libpath = require('path'),

	storage = require('./storage.js'),
	db = require('./db.js'),
	util = require('./util.js'),
	perms = require('./perms.js');


function getAsset(req,res,next)
{
	console.log('request by '+(req.session.username || '<anon>'));
	var id = parseInt(req.params.id, 16);
	perms.hasPerm(id, req.session.username, perms.READ, function(err,result)
	{
		if(err){
			console.error('Error getting permission:', err);
			res.sendStatus(500);
		}
		else if(!result){
			res.sendStatus(404);
		}
		else if( !result.permitted ){
			if(req.session.username)
				res.sendStatus(403);
			else
				res.sendStatus(401);
		}
		else
		{
			var path = util.formatId(id);

			// retrieve the file and serve
			storage.readFile(req.assetConfig, path, function(err, buffer)
			{
				if(err){
					console.error('Error reading file:', err);
					res.sendStatus(500);
				}
				else {
					// set mimetype from db
					res.set('Content-Type', result.type);
					res.send(buffer);
				}
			});
		}
	});
};

function overwriteAsset(req,res,next)
{
	var id = parseInt(req.params.id, 16);
	perms.hasPerm(id, req.session.username, perms.WRITE, function(err,result)
	{
		if(err){
			console.error('Error getting permission:', err);
			res.sendStatus(500);
		}
		else if(!result){
			res.sendStatus(404);
		}
		else if( !result.permitted ){
			if(req.session.username)
				res.sendStatus(403);
			else
				res.sendStatus(401);
		}
		else {
			db.queryNoResults('UPDATE Assets SET last_modified = CURRENT_TIMESTAMP WHERE id = ?', [id],
				function(err,results)
				{
					if(err){
						console.error('Failed to update asset:', err);
						res.sendStatus(500);
					}
					else
					{
						var path = util.formatId(id);
						storage.writeFile(req.assetConfig, path, req.body, function(err,written,string)
						{
							if(err){
								console.error('Failed to overwrite asset:', err);
								res.sendStatus(500);
							}
							else {
								res.sendStatus(200);
							}
						});
					}
				}
			);
		}
	});
}

function deleteAsset(req,res,next)
{
	var id = parseInt(req.params.id, 16);
	perms.hasPerm(id, req.session.username, perms.DELETE, function(err,result)
	{
		if(err){
			console.error('Error getting permission:', err);
			res.sendStatus(500);
		}
		else if( !result ){
			res.sendStatus(404);
		}
		else if( !result.permitted ){
			if(req.session.username)
				res.sendStatus(403);
			else
				res.sendStatus(401);
		}
		else
		{
			var path = util.formatId(id);
			storage.deleteFile(req.assetConfig, path, function(err){
				if(err){
					console.error('Failed to delete asset:', err);
					res.sendStatus(500);
				}
				else {
					res.sendStatus(204);
				}
			});
		}
	});
}

function newAsset(req,res,next)
{
	function doStuff(inc)
	{
		var id = Math.floor(Math.random() * 0x100000000);

		db.queryNoResults(
			'INSERT INTO Assets (id, type, perms, user_name) VALUES ($id, $type, $perms, $user)',
			{$id: id, $type: req.headers['content-type'], $perms: 0744, $user: req.session.username},
			function(err,result)
			{
				if(err){
					if(err.constraint && inc < 3){
						return doStuff(inc+1);
					}
					else {
						console.error('Failed to add asset to db:', err);
						res.sendStatus(500);
					}
				}
				else
				{
					var path = util.formatId(id);
					storage.writeFile(req.assetConfig, path, req.body, function(err,written,string)
					{
						if(err){
							console.error('Failed to write asset to disk:', err);
							res.sendStatus(500);
						}
						else {
							res.status(201).send( util.formatId(id, true) );
						}
					});
				}
			}
		);
	}

	if(req.session.username)
		doStuff(0);
	else
		res.sendStatus(401);
}

exports.getAsset = getAsset;
exports.overwriteAsset = overwriteAsset;
exports.deleteAsset = deleteAsset;
exports.newAsset = newAsset;
