var libpath = require('path'),
	sqlite = require('sqlite3');

function initializeDatabase(path)
{
	function handleError(err){
		if(err)
			console.error(err);
		else
			console.log(this);
	}

	var db = new sqlite.Database(path);
	db.run(
		'CREATE TABLE IF NOT EXISTS Assets ('+
		'	id INT UNSIGNED,'+
		'	perms SMALLINT UNSIGNED NOT NULL,'+
		'	owner VARCHAR(50) NOT NULL,'+
		'	group VARCHAR(50) NOT NULL,'+
		'	uploaded TIMESTAMP DEFAULT now,'+
		'	last_modified TIMESTAMP DEFAULT now,'+

		'	PRIMARY KEY(id)'+
		')', handleError)

	.run(
		'CREATE TABLE IF NOT EXISTS Metadata ('+
		'	id INT UNSIGNED,'+
		'	key VARCHAR(50),'+
		'	value TEXT,'+
		'	asset INT UNSIGNED,'+

		'	PRIMARY KEY(id,key),'+
		'	FOREIGN KEY (asset) REFERENCES Assets(id) ON DELETE CASCADE'+
		')', handleError)

	.run(
		'CREATE TABLE IF NOT EXISTS Groups ('+
		'	group VARCHAR(50) NOT NULL,'+
		'	user VARCHAR(50) NOT NULL,'+

		'	PRIMARY KEY(group,user)'+
		')', handleError)

	.close();
}

exports.initialize = initializeDatabase;
