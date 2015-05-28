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

	var whereClause = '';

	for(var i in req.query)
	{
		var val = req.query[i];
		var wherePhrase;

		// parse the operator, if one is provided
		var parts = i.split('!');
		var key = parts[0], operator = parts[1];
		switch(operator)
		{
			case undefined:
			case 'equal':        operator = ' = ';    break;
			case 'notEqual':     operator = ' != ';   break;
			case 'greaterThan':  operator = ' > ';    break;
			case 'lessThan':     operator = ' < ';    break;
			case 'greaterEqual': operator = ' >= ';   break;
			case 'lessEqual':    operator = ' <= ';   break;
			case 'like':         operator = ' LIKE '; break;

			default: delete req.query[i]; continue;
		}

		// parse value, if it requires parsing
		var isAsset = /^asset:([A-Fa-f0-9]{8})$/.exec(val);
		if(isAsset){
			val = parseInt(isAsset[1], 16);
		}
		else if( !isNaN( Date.parse(val) ) ){
			val = new Date(val);
		}


		// create an SQL phrase describing the current key/value filter
		if( ['type','permissions','user_name','group_name','created','last_modified'].indexOf(key) > -1 )
		{
			wherePhrase = sqlEscapeKey('Assets.'+key) + operator + sqlEscapeVal(val);
		}
		else {
			if(isAsset && (operator === ' = ' || operator === ' != ')){
				wherePhrase = '(Metadata.key = '+ sqlEscapeVal(key) +' AND Metadata.asset' + operator + sqlEscapeVal(val)+')';
			}
			else {
				wherePhrase = '(Metadata.key = '+ sqlEscapeVal(key) +' AND Metadata.value' + operator + sqlEscapeVal(val)+')';
			}
		}

		whereClause = (whereClause ? whereClause + (req.params.conj==='any'?' OR ':' AND ') : 'WHERE ') + wherePhrase;
	}

	if(!whereClause){
		return res.status(400).send('Must supply at least one valid query argument');
	}

	db.queryAllResults(
		'SELECT DISTINCT '+
			'PRINTF("%x",Assets.id) AS id, Assets.type AS type, PRINTF("%o",Assets.permissions) AS permissions, Assets.user_name AS user_name, Assets.group_name AS group_name, '+
			'strftime("%Y-%m-%dT%H:%M:%SZ",Assets.created) AS created, strftime("%Y-%m-%dT%H:%M:%SZ",Assets.last_modified) AS last_modified '+
		'FROM Assets LEFT JOIN Metadata ON Metadata.id = Assets.id '+ whereClause,
		[],
		function(err,rows){
			if(err){
				console.error('Failed to search by metadata:', err);
				res.status(500).send('DB error');
			}
			else
			{
				var ret = {
					query: req.query,
					matches: rows.reduce(function(acc,cur){ acc[cur.id] = cur; return acc; }, {})
				};

				res.json(ret);
			}
		}
	);
}

exports.listAssetsByUser = listAssetsByUser;
exports.listAssetsByMeta = listAssetsByMeta;

