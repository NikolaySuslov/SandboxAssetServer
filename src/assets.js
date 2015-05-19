var mime = require('mime'),
	libpath = require('path'),

	storage = require('./storage.js'),
	db = require('./db.js'),
	util = require('./util.js');


function getAsset(req,res,next)
{
	console.log('request by '+(req.session.username || '<anon>'));
	
	// given the id, get the filename (eventual db call)
	var path = req.params.id.toLowerCase();
	path = libpath.join(path.slice(0,2), path.slice(2));

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
	// generate random id
	var id = Math.floor( Math.random() * 0x100000000 );
	console.log(util.formatId(id));

	// save file to datadir. first two characters of id are subfolder
	
	// update database
	
	// return status
	res.sendStatus(200);
}

exports.getAsset = getAsset;
exports.newAsset = newAsset;
