var fs = require('fs'),
	libpath = require('path');

function readFile(config, path, cb)
{
	fs.readFile( libpath.join(config.dataDir, path), cb );
}

exports.readFile = readFile;

