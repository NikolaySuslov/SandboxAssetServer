var fs = require('fs'),
	libpath = require('path');

function readFile(config, path, cb)
{
	fs.readFile( libpath.join(config.dataDir, path), cb );
}

function writeFile(config, path, data, cb)
{
	fs.mkdir( libpath.join(config.dataDir, path.slice(0,2)), function(err)
	{
		if(err){
			console.error('Cannot write to datadir!', err);
			cb(err);
		}
		else {
			fs.open( libpath.join(config.dataDir, path), 'w', function(err,fd)
			{
				if(err){
					console.error('Cannot write to datadir!', err);
					cb(err);
				}
				else {
					fs.write(fd, data, 0, data.length, 0, function(err,written,string)
					{
						cb(err,written,string);
						fs.close(fd);
					});
				}
			});
		}
	});
}

exports.readFile = readFile;
exports.writeFile = writeFile;
