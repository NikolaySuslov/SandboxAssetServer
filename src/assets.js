var mime = require('mime'),
	libpath = require('path'),

	storage = require('./storage.js'),
	db = require('./db.js'),
	util = require('./util.js'),
	perms = require('./perms.js');


function getAsset(req,res,next)
{
	console.log('request by '+(req.session.username || '<anon>'));
	
	var path = util.formatId( parseInt(req.params.id) );

	// retrieve the file and serve
	storage.readFile(req.assetConfig, path, function(err, buffer)
	{
		if(err){
			console.error(err);
			res.sendStatus(404);
		}
		else {
			// set mimetype from db
			res.set('content-type', 'text/plain');
			res.status(200).send(buffer);
		}
	});
};

function newAsset(req,res,next)
{
	function doStuff(inc)
	{
		var id = Math.floor(Math.random() * 0x100000000);

		db.queryNoResults(
			'INSERT INTO Assets (id, type, perms, user_name, group_name) VALUES ($id, $type, $perms, $user, $user)',
			{$id: id, $type: req.headers['content-type'], $perms: 0744, $user: req.session.username},
			function(err,result)
			{
				if(err){
					if(err.constraint && inc < 3){
						return doStuff(inc+1);
					}
					else {
						console.error(err);
						res.sendStatus(500);
					}
				}
				else
				{
					var path = util.formatId(id);
					storage.writeFile(req.assetConfig, path, req.body, function(err,written,string)
					{
						if(err){
							console.error(err);
							res.sendStatus(500);
						}
						else {
							res.status(200).send( util.formatId(id, true) );
						}
					});
				}
			}
		);
	}

	doStuff(0);
}

exports.getAsset = getAsset;
exports.newAsset = newAsset;
