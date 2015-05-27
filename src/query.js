var mysql = require('mysql'),

	db = require('./db.js');

function listAssetsByUser(req,res,next)
{
	db.queryAllResults(
		'SELECT PRINTF("%x",id) AS id, type, PRINTF("%o",permissions) AS permissions, user_name, group_name, '+
		'strftime("%Y-%m-%dT%H:%M:%SZ",created) AS created, strftime("%Y-%m-%dT%H:%M:%SZ",last_modified) AS last_modified '+
		'FROM Assets WHERE user_name = ?',
		[req.params.user],
		function(err,rows)
		{
			if(err){
				console.error('Failed to get by-owner index:', err);
				res.status(500).send('DB error');
			}
			else
			{
				var ret = {
					'user_name': req.params.user,
					'assets': {}
				};

				for(var i=0; i<rows.length; i++){
					ret.assets[ rows[i].id ] = rows[i];
				}

				res.json(ret);
			}
		}
	);
}


function listAssetsByMeta(req,res,next)
{
	var sqlEscapeVal = mysql.escape, sqlEscapeKey = mysql.escapeId;

	var whereClause = Object.keys(req.query).length > 0 ? 'WHERE ' : '';

	for(var i in req.query.filter)
	{
		var key = i, val = req.query.filter[i];
		if( ['type','permissions','user_name','group_name','created','last_modified'].indexOf(key) > -1 ){
			var wherePhrase = sqlEscapeKey('Assets.'+key) + ' = ' + sqlEscapeVal(val);
			whereClause = whereClause + wherePhrase;
		}
	}


	db.queryAllResults(
		'SELECT DISTINCT '+
			'PRINTF("%x",Assets.id) AS id, Assets.type AS type, PRINTF("%o",Assets.permissions) AS permissions, Assets.user_name AS user_name, Assets.group_name AS group_name, '+
			'strftime("%Y-%m-%dT%H:%M:%SZ",Assets.created) AS created, strftime("%Y-%m-%dT%H:%M:%SZ",Assets.last_modified) AS last_modified '+
		'FROM Assets JOIN Metadata USING (id) '+ whereClause,
		null,
		function(err,rows){
			if(err){
				console.error('Failed to search by metadata:', err);
				res.status(500).send('DB error');
			}
			else {
				console.log(rows);
				res.sendStatus(200);
			}
		}
	);
}

exports.listAssetsByUser = listAssetsByUser;
exports.listAssetsByMeta = listAssetsByMeta;

