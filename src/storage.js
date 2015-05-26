var fs = require('fs'),
	libpath = require('path');

function readFile(config, path, cb)
{
	fs.readFile( libpath.join(config.absoluteDataDir, path), cb );
}

function writeFile(config, path, data, cb)
{
	fs.mkdir( libpath.join(config.absoluteDataDir, path.slice(0,2)), function(err)
	{
		fs.open( libpath.join(config.absoluteDataDir, path), 'w', function(err,fd)
		{
			if(err){
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
	});
}

function deleteFile(config, path, cb)
{
	fs.unlink( libpath.join(config.absoluteDataDir,path), cb );
}

exports.readFile = readFile;
exports.writeFile = writeFile;
exports.deleteFile = deleteFile;
