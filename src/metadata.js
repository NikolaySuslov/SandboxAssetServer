var liburl = require('url'),
	sql_escape = require('mysql').escape,
	util = require('./util.js'),
	db = require('./db.js'),
	perms = require('./perms.js');


function getAllMetadata(req,res,next)
{
	var id = parseInt(req.params.id, 16);
	perms.hasPerm(id, req.session.user, perms.READ, function(err,result)
	{
		if(err){
			console.error('Failed to check permissions:', err);
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
			db.queryAllResults('SELECT key, value, asset FROM Metadata WHERE id = $id', {$id: id},
				function(err,rows){
					if(err){
						console.error('Failed to fetch metadata:', err);
						res.status(500).send('DB error');
					}
					else
					{
						var meta = {
							'type': result.type,
							'permissions': req.query.octal ? result.permissions.toString(8) : perms.unpackPerms(result.permissions),
							'user_name': result.user_name,
							'group_name': result.group_name,
							'created': result.created,
							'last_modified': result.last_modified
						};

						for(var i=0; i<rows.length; i++){
							meta[rows[i].key] = rows[i].value || 'asset:'+rows[i].asset.toString(16);
						}

						res.json(meta);
					}
				}
			);
		}
	});
}

function getSomeMetadata(req,res,next)
{
	var id = parseInt(req.params.id, 16);
	perms.hasPerm(id, req.session.user, perms.READ, function(err,result)
	{
		if(err){
			console.error('Failed to check permissions:', err);
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
		else if( ['type','permissions','user_name','group_name','created','last_modified'].indexOf(req.params.field) > -1 )
		{
			if( req.params.field === 'permissions' ){
				if( !req.query.octal ){
					res.json( perms.unpackPerms(result.permissions) );
				}
				else {
					res.set('Content-Type', 'text/plain');
					res.send( result.permissions.toString(8) );
				}
			}
			else {
				res.set('Content-Type', 'text/plain');
				res.status( result[req.params.field] ? 200 : 404 ).send( result[req.params.field] );
			}
		}
		else
		{
			db.queryFirstResult('SELECT value, asset FROM Metadata WHERE id = $id AND key = $key', {$id: id, $key: req.params.field},
				function(err,result)
				{
					if(err){
						console.error('Failed to get metadata:', err);
						res.status(500).send('DB error');
					}
					else if(!result){
						res.status(404).send('No metadata for this asset by that name');
					}
					else if( result.asset ){
						if( !req.query.raw ){
							var origPath = liburl.parse( req.originalUrl ).pathname;
							var newPath = origPath.replace( new RegExp('[0-9A-Fa-f]{8}\/meta\/'+req.params.field+'$'), result.asset.toString(16) );
							res.redirect(newPath);
						}
						else {
							res.set('Content-Type', 'text/plain');
							res.send( 'asset:'+result.asset.toString(16) );
						}
					}
					else {
						res.set('Content-Type', 'text/plain');
						res.send( result.value );
					}
				}
			);
		}
	});

	
}

function setAllMetadata(req,res,next)
{
	var id = parseInt(req.params.id, 16);

	try {
		req.body = JSON.parse(req.body.toString());
	}
	catch(e){
		return res.status(400).send('Request body is malformed JSON');
	}

	perms.hasPerm(id, req.session.username, perms.WRITE, function(err,result)
	{
		if(err){
			console.error('Failed to check permissions:', err);
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
		else
		{
			delete req.body.type;
			delete req.body.permissions;
			delete req.body.user_name;
			delete req.body.group_name;
			delete req.body.created;
			delete req.body.last_modified;

			var inserts = [];
			for(var i in req.body){
				var isAsset = /^asset:([A-Fa-f0-9]{8})$/.exec( req.body[i] );
				var assetId = isAsset ? parseInt(isAsset[1], 16) : null;
				inserts.push( [id, i, isAsset ? null : req.body[i], assetId ] );
			}

			db.queryNoResults('INSERT OR REPLACE INTO Metadata (id, key, value, asset) VALUES '+sql_escape(inserts), null,
				function(err,result)
				{
					if(err){
						console.error('Failed to set metadata:', err);
						res.status(500).send('DB error');
					}
					else {
						res.sendStatus(200);
					}
				}
			);
		}
	});

}

function setSomeMetadata(req,res,next)
{
	var id = parseInt(req.params.id, 16);
	var isAsset = /^asset:([A-Fa-f0-9]{8})$/.exec(req.body.toString());

	if( ['permissions','group_name','type','user_name','created','last_modified'].indexOf(req.params.field) > -1 ){
		res.status(403).send('Cannot directly modify protected field');
	}
	else if( req.body.length === 0 ){
		res.status(400).send('New metadata value not specified');
	}
	else
	{
		perms.hasPerm(id, req.session.username, perms.WRITE, function(err,result)
		{
			if(err){
				console.error('Failed to check permissions:', err);
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
			else
			{
				db.queryNoResults('INSERT OR REPLACE INTO Metadata (id, key, value, asset) VALUES ($id, $key, $value, $asset)',
					{
						$id: id,
						$key: req.params.field,
						$value: isAsset ? null : req.body.toString(),
						$asset: isAsset ? parseInt(isAsset[1], 16) : null
					},
					function(err,result)
					{
						if(err){
							console.error('Failed to set metadata:', err);
							res.status(500).send('DB error');
						}
						else {
							res.sendStatus(200);
						}
					}
				);
			}
		});
	}
}

function deleteAllMetadata(req,res,next)
{
	res.sendStatus(501);
	
}

function deleteSomeMetadata(req,res,next)
{
	var id = parseInt(req.params.id, 16);
	if( ['permissions','group_name','type','user_name','created','last_modified'].indexOf(req.params.field) > -1 ){
		res.status(403).send('Cannot clear protected field');
	}
	else
	{
		perms.hasPerm(id, req.session.username, perms.WRITE, function(err,result)
		{
			if(err){
				console.error('Failed to check permissions:', err);
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
			else
			{
				db.queryNoResults('DELETE FROM Metadata WHERE id = $id AND key = $key', {$id: id, $key: req.params.field },
					function(err,result)
					{
						if(err){
							console.error('Failed to clear metadata:', err);
							res.status(500).send('DB error');
						}
						else if( result.changes === 0 ){
							res.status(404).send('No metadata for this asset with that name');
						}
						else {
							res.sendStatus(204);
						}
					}
				);
			}
		});
	}

}

exports.getAllMetadata = getAllMetadata;
exports.getSomeMetadata = getSomeMetadata;
exports.setAllMetadata = setAllMetadata;
exports.setSomeMetadata = setSomeMetadata;
exports.deleteAllMetadata = deleteAllMetadata;
exports.deleteSomeMetadata = deleteSomeMetadata;

