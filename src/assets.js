var mime = require('mime'),
	libpath = require('path'),

	storage = require('./storage.js'),
	db = require('./db.js'),
	util = require('./util.js'),
	perms = require('./perms.js'),
	metadata = require('./metadata.js');


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
					sendRanges(buffer, req.ranges, res);
				}
			});
		}
	});
};

function sendRanges(buf, ranges, res)
{
	if( !ranges ){
		return res.send(buf);
	}
	else
	{
		// assemble output
		var outputLength = 0;
		var output = [];

		var i = 0;
		//for(var i=0; i<ranges.length; i++){

			var startValid = ranges[i].start >= 0 && ranges[i].start < buf.length;
			var endValid = ranges[i].end >= ranges[i].start && ranges[i].end < buf.length;
			var suffixValid = ranges[i].suffix < 0 && ranges[i].suffix > -buf.length;

			if( ranges[i].start && ranges[i].end && startValid && endValid )
			{
				ranges[i].actualStart = ranges[i].start;
				ranges[i].actualEnd = ranges[i].end;

				outputLength += ranges[i].end - ranges[i].start + 1;
				output.push( buf.slice(ranges[i].start, ranges[i].end+1) );
			}
			else if( ranges[i].end && !endValid )
			{
				// syntactically invalid rule
				return res.send(buf);
			}
			else if( ranges[i].start && startValid && !ranges[i].end )
			{
				ranges[i].actualStart = ranges[i].start;
				ranges[i].actualEnd = buf.length-1;

				outputLength += buf.length - ranges[i].start;
				output.push( buf.slice(ranges[i].start) );
			}
			else if( ranges[i].suffix && suffixValid )
			{
				ranges[i].actualStart = buf.length + ranges[i].suffix;
				ranges[i].actualEnd = buf.length-1;

				outputLength += -ranges[i].suffix;
				output.push( buf.slice(ranges[i].suffix) );
			}
		//}

		// unsatisfiable
		if( outputLength === 0 ){
			res.set('Content-Range', 'bytes */'+buf.length);
			res.sendStatus(416);
		}
		else {
			var r = 'bytes '+ranges[0].actualStart+'-'+ranges[0].actualEnd+'/'+buf.length;
			res.set('Content-Range', r);
			res.status(206).send( Buffer.concat(output, outputLength) );
		}
	}
}

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
				db.queryNoResults('UPDATE Assets SET type = $type, size = $size, last_modified = CURRENT_TIMESTAMP WHERE id = $id',
					{$type: req.headers['content-type'], $size: req.body.length, $id: id},
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
			db.queryNoResults('DELETE FROM Assets WHERE id = ?', [id], function(err,result)
			{
				if(err){
					console.error('Failed to delete asset:', err);
					res.status(500).send('DB error');
				}
				else {
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
	});
}

function newAsset(req,res,next)
{
	function doStuff(inc)
	{
		var id = Math.floor(Math.random() * 0x100000000);

		db.queryNoResults(
			'INSERT INTO Assets (id, type, permissions, user_name, group_name, size) VALUES ($id, $type, $perms, $user, $group, $size)', {
				$id: id, 
				$type: req.headers['content-type'], 
				$perms: parseInt(req.query.permissions,8) || 0744, 
				$user: req.session.username,
				$group: req.query.group_name || null,
				$size: req.body.length
			},
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
						else
						{
							for(var i in req.query){
								if( req.query[i] === ':self' )
									req.query[i] = 'asset:'+util.formatId(id, true);
							}

							metadata.setMetadata(id, req.query, function(err){
								if(err) console.error('Failed to set metadata:', err);
							});
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
