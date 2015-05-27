var mime = require('mime'),
	libpath = require('path'),

	storage = require('./storage.js'),
	db = require('./db.js'),
	util = require('./util.js'),
	perms = require('./perms.js');


function getAsset(req,res,next)
{
	var id = parseInt(req.params.id, 16);
	perms.hasPerm(id, req.session.username, perms.READ, function(err,result)
	{
		if(err){
			console.error('Error getting permission:', err);
			res.status(500).send('DB error');
		}
		else if(!result){
			res.status(404).send('No asset with this ID');
		}
		else if( !result.permitted ){
			if(req.session.username)
				res.status(403).send('Asset does not allow unprivileged access');
			else
				res.status(401).send('Asset does not allow anonymous access');
		}
		else
		{
			var path = util.formatId(id);

			// retrieve the file and serve
			storage.readFile(req.assetConfig, path, function(err, buffer)
			{
				if(err){
					console.error('Error reading file:', err);
					res.status(500).send('FS error');
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
	if( !req.headers['content-type'] ){
		res.status(400).send('Uploaded assets must have a Content-Type');
	}
	else
	{
		var id = parseInt(req.params.id, 16);
		perms.hasPerm(id, req.session.username, perms.WRITE, function(err,result)
		{
			if(err){
				console.error('Error getting permission:', err);
				res.status(500).send('DB error');
			}
			else if(!result){
				res.status(404).send('No asset with this ID');
			}
			else if( !result.permitted ){
				if(req.session.username)
					res.status(403).send('Asset does not allow unprivileged writes');
				else
					res.status(401).send('Asset does not allow anonymous writes');
			}
			else {
				db.queryNoResults('UPDATE Assets SET type = $type, last_modified = CURRENT_TIMESTAMP WHERE id = $id',
					{$type: req.headers['content-type'], $id: id},
					function(err,results)
					{
						if(err){
							console.error('Failed to update asset:', err);
							res.status(500).send('DB error');
						}
						else
						{
							var path = util.formatId(id);
							storage.writeFile(req.assetConfig, path, req.body, function(err,written,string)
							{
								if(err){
									console.error('Failed to overwrite asset:', err);
									res.status(500).send('FS error');
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
}

function deleteAsset(req,res,next)
{
	var id = parseInt(req.params.id, 16);
	perms.hasPerm(id, req.session.username, perms.DELETE, function(err,result)
	{
		if(err){
			console.error('Error getting permission:', err);
			res.status(500).send('DB error');
		}
		else if( !result ){
			res.status(404).send('No asset with this ID');
		}
		else if( !result.permitted ){
			if(req.session.username)
				res.status(403).send('Asset does not allow unprivileged deletion');
			else
				res.status(401).send('Asset does not allow anonymous deletion');
		}
		else
		{
			var path = util.formatId(id);
			storage.deleteFile(req.assetConfig, path, function(err){
				if(err){
					console.error('Failed to delete asset:', err);
					res.status(500).send('FS error');
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
			'INSERT INTO Assets (id, type, permissions, user_name) VALUES ($id, $type, $perms, $user)',
			{$id: id, $type: req.headers['content-type'], $perms: 0744, $user: req.session.username},
			function(err,result)
			{
				if(err){
					if(err.constraint && inc < 3){
						return doStuff(inc+1);
					}
					else {
						console.error('Failed to add asset to db:', err);
						res.status(500).send('DB error');
					}
				}
				else
				{
					var path = util.formatId(id);
					storage.writeFile(req.assetConfig, path, req.body, function(err,written,string)
					{
						if(err){
							console.error('Failed to write asset to disk:', err);
							db.queryNoResults('DELETE FROM Assets WHERE id = ?', id);
							res.status(500).send('FS error');
						}
						else {
							res.status(201).send( util.formatId(id, true) );
						}
					});
				}
			}
		);
	}

	if(!req.session.username)
		res.status(401).send('Cannot upload assets anonymously');
	else if(!req.headers['content-type'])
		res.status(400).send('Uploaded assets must have a Content-Type');
	else
		doStuff(0);
}


exports.getAsset = getAsset;
exports.overwriteAsset = overwriteAsset;
exports.deleteAsset = deleteAsset;
exports.newAsset = newAsset;
