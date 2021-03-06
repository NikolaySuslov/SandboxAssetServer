var util = require('./util.js'),
	db = require('./db.js'),
	perms = require('./perms.js');

function getSelectFromCSV(csv)
{
	var sqlEscapeVal = util.escapeValue, sqlEscapeKey = util.escapeKey;

	/*
	 * Craft 'select' part of statement based on 'returns' query arg
	 */
	var returns = csv && csv.split(',') || 
		['id', 'permissions', 'type', 'user_name', 'group_name', 'size', 'created', 'last_modified'];

	// query api doesn't work if id isn't selected
	if(returns.indexOf('id') === -1)
		returns.splice(0, 0, 'id');

	var select = [];

	for(var i=0; i<returns.length; i++)
	{
		var field = returns[i];
		switch(field)
		{
		case 'id':
			select.push('PRINTF("%08x",Assets.id) AS id');
			break;
		case 'permissions':
			select.push('PRINTF("%o",Assets.permissions) AS permissions');
			break;
		case 'created':
		case 'last_modified':
			select.push('strftime("%Y-%m-%dT%H:%M:%SZ",Assets.'+field+') AS '+field);
			break;
		case 'type':
		case 'user_name':
		case 'group_name':
		case 'size':
			select.push('Assets.'+field+' as '+field);
			break;
		default:
			select.push(
				'(SELECT CASE WHEN asset IS NOT NULL THEN PRINTF("asset:%08x",asset) ELSE value END '+
				'FROM Metadata WHERE id = Assets.id AND key = '+sqlEscapeVal(field)+') AS '+sqlEscapeKey(field)
			);
		};
	}

	return select.join(', ');
}

function listAssetsByUser(req,res,next)
{
	var select = getSelectFromCSV(req.query.returns);

	db.queryAllResults(
		'SELECT '+select+' FROM Assets WHERE user_name = ?',
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
					if(rows[i].permissions && req.query.permFormat === 'json')
						rows[i].permissions = perms.unpackPerms(parseInt(rows[i].permissions,8));
					ret.assets[ rows[i].id ] = rows[i];
				}

				res.json(ret);
			}
		}
	);
}


function listAssetsByMeta(req,res,next)
{
	var sqlEscapeVal = util.escapeValue, sqlEscapeKey = util.escapeKey;

	var whereClause = '';

	for(var i in req.query)
	{
		// ignore 'returns' and 'permFormat' query args for where clause
		if( i === 'returns' || i === 'permFormat' ) continue;

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
			case 'hasPerms':     /* special case */   break;

			default: delete req.query[i]; continue;
		}

		// parse value, if it requires parsing
		if( /^asset:[A-Fa-f0-9]{8}$/.test(val) ){
			var isAsset = true;
			val = parseInt(val.slice(6), 16);
		}
		else if( operator === 'hasPerms' ){
			if( key === 'permissions' || /^[0-7]+$/.test(req.query[i]) ){
				val = parseInt(val, 8);
			}
			else {
				delete req.query[i];
				continue;
			}
		}
		else if( /^[0-9]+$/.test(val) ){
			val = parseInt(val);
		}
		else if( !isNaN( Date.parse(val) ) ){
			val = new Date(val);
		}

		// create an SQL phrase describing the current key/value filter
		if( ['type','permissions','user_name','group_name','created','last_modified','size'].indexOf(key) > -1 )
		{
			if( key === 'permissions' && operator === 'hasPerms' ){
				wherePhrase = sqlEscapeKey('Assets.permissions') +' & '+ val +' != 0';
			}
			else {
				wherePhrase = sqlEscapeKey('Assets.'+key) + operator + sqlEscapeVal(val);
			}
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

	var select = getSelectFromCSV(req.query.returns);

	db.queryAllResults(
		'SELECT DISTINCT '+select+
		' FROM Assets LEFT JOIN Metadata ON Metadata.id = Assets.id '+ whereClause,
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
					matches: rows.reduce(function(acc,cur){
						if(cur.permissions && req.query.permFormat === 'json')
							cur.permissions = perms.unpackPerms(parseInt(cur.permissions,8));
						acc[cur.id] = cur;
						return acc;
					}, {})
				};

				res.json(ret);
			}
		}
	);
}

exports.listAssetsByUser = listAssetsByUser;
exports.listAssetsByMeta = listAssetsByMeta;

