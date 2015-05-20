var libpath = require('path'),
	sqlite = require('sqlite3');

var dbPath = null;

function initializeDatabase(path)
{
	dbPath = path;

	function handleError(msg){
		return function(err){
			if(err){
				console.error(msg);
				console.error(err);
			}
		}
	}

	var db = new sqlite.Database(dbPath);
	db.run(
		'CREATE TABLE IF NOT EXISTS Assets ('+
		'	id INT UNSIGNED,'+
		'	type VARCHAR(30) NOT NULL,'+
		'	perms SMALLINT UNSIGNED NOT NULL,'+
		'	user_name VARCHAR(50) NOT NULL,'+
		'	group_name VARCHAR(50),'+
		'	uploaded TIMESTAMP DEFAULT CURRENT_TIMESTAMP,'+
		'	last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,'+

		'	PRIMARY KEY(id)'+
		')', handleError('Failed to create assets table'))

	.run(
		'CREATE TABLE IF NOT EXISTS Metadata ('+
		'	id INT UNSIGNED,'+
		'	key VARCHAR(50),'+
		'	value TEXT,'+
		'	asset INT UNSIGNED,'+

		'	PRIMARY KEY(id,key),'+
		'	FOREIGN KEY (asset) REFERENCES Assets(id) ON DELETE CASCADE'+
		')', handleError('Failed to create metadata table'))

	.run(
		'CREATE TABLE IF NOT EXISTS Groups ('+
		'	group_name VARCHAR(50) NOT NULL,'+
		'	user_name VARCHAR(50) NOT NULL,'+

		'	PRIMARY KEY(group_name,user_name)'+
		')', handleError('Failed to create groups table'))

	.close();
}

var db = null;
var refs = 0;

function queryCurry(method)
{
	return function(query, params, cb)
	{
		if(!db){
			db = new sqlite.Database(dbPath);
		}

		refs++;
		db[method](query,params,function(err,rows)
		{
			if(err && err.code === 'SQLITE_CONSTRAINT')
				err.constraint = true;

			cb(err, method==='run' ? this : rows);
			refs--;
			if( refs === 0 ){		
				db.close();
				db = null;
			}
		});
	};
}


exports.initialize = initializeDatabase;
exports.queryNoResults = queryCurry('run');
exports.queryFirstResult = queryCurry('get');
exports.queryAllResults = queryCurry('all');

