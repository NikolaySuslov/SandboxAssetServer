var liburl = require('url'),

	util = require('./util.js'),
	db = require('./db.js'),
	perms = require('./perms.js');


function getAllMetadata(req,res,next)
{
	res.sendStatus(501);

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
		else if( ['type','permissions','user_name','group_name','uploaded','last_modified'].indexOf(req.params.field) > -1 )
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
						var origPath = liburl.parse( req.originalUrl ).pathname;
						var newPath = origPath.replace( new RegExp('[0-9A-Fa-f]{8}\/meta\/'+req.params.field+'$'), result.asset.toString(16) );
						console.log('Redirecting to', newPath);
						res.redirect(newPath);
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
	res.sendStatus(501);
	
}

function setSomeMetadata(req,res,next)
{
	res.sendStatus(501);
	
}

function deleteAllMetadata(req,res,next)
{
	res.sendStatus(501);
	
}

function deleteSomeMetadata(req,res,next)
{
	res.sendStatus(501);
	
}

exports.getAllMetadata = getAllMetadata;
exports.getSomeMetadata = getSomeMetadata;
exports.setAllMetadata = setAllMetadata;
exports.setSomeMetadata = setSomeMetadata;
exports.deleteAllMetadata = deleteAllMetadata;
exports.deleteSomeMetadata = deleteSomeMetadata;

