var assert = require('assert'),

	db = require('./db.js');

var perms =
{
	USER_READ    : 0400,
	USER_WRITE   : 0200,
	USER_DELETE  : 0100,
	
	GROUP_READ   : 0040,
	GROUP_WRITE  : 0020,
	GROUP_DELETE : 0010,
	
	OTHER_READ   : 0004,
	OTHER_WRITE  : 0002,
	OTHER_DELETE : 0001,
	
	READ         : 0444,
	WRITE        : 0222,
	DELETE       : 0111,

	USER         : 0700,
	GROUP        : 0070,
	OTHER        : 0007
};

function hasPerm(asset, user, requestedPerms, cb)
{
	db.queryFirstResult(
		'SELECT permissions, type, user_name, group_name, '+
		'strftime("%Y-%m-%dT%H:%M:%SZ",created) AS created, strftime("%Y-%m-%dT%H:%M:%SZ",last_modified) AS last_modified, '+
		'user_name = $user AS is_user, ('+
			'SELECT COUNT(*) FROM Groups INNER JOIN Assets ON Groups.group_name = Assets.group_name WHERE Assets.id = $asset AND Groups.user_name = $user'+
		') = 1 AS is_group '+
		'FROM Assets WHERE id = $asset',
		{$user: user, $asset: asset},
		function(err, result)
		{
			if(err){
				cb(err);
			}
			else if(result){
				result.requestedPerms = requestedPerms;
				var privilege = result.is_user * perms.USER | result.is_group * perms.GROUP | perms.OTHER;
				result.permitted = result.permissions & requestedPerms & privilege;
				cb( null, result );
			}
			else {
				cb();
			}
		}
	);
}

function unpackPerms(permInt)
{
	return {
		user: {
			read:   !!(permInt & perms.USER_READ),
			write:  !!(permInt & perms.USER_WRITE),
			delete: !!(permInt & perms.USER_DELETE) },
		group: {
			read:   !!(permInt & perms.GROUP_READ),
			write:  !!(permInt & perms.GROUP_WRITE),
			delete: !!(permInt & perms.GROUP_DELETE) },
		other: {
			read:   !!(permInt & perms.OTHER_READ),
			write:  !!(permInt & perms.OTHER_WRITE),
			delete: !!(permInt & perms.OTHER_DELETE) } };
}

function packPerms(permObj)
{
	return {
		newPerms: 
			(!!permObj.user ? (
				!!permObj.user.read    * perms.USER_READ |
				!!permObj.user.write   * perms.USER_WRITE |
				!!permObj.user.delete  * perms.USER_DELETE
			) : 0) |

			(!!permObj.group ? (
				!!permObj.group.read   * perms.GROUP_READ |
				!!permObj.group.write  * perms.GROUP_WRITE |
				!!permObj.group.delete * perms.GROUP_DELETE
			) : 0) |

			(!!permObj.other ? (
				!!permObj.other.read   * perms.OTHER_READ |
				!!permObj.other.write  * perms.OTHER_WRITE |
				!!permObj.other.delete * perms.OTHER_DELETE
			) : 0)
		,

		given:
			(permObj.user ? (
				(permObj.user.read    !== undefined) * perms.USER_READ |
				(permObj.user.write   !== undefined) * perms.USER_WRITE |
				(permObj.user.delete  !== undefined) * perms.USER_DELETE
			) : 0) |

			(permObj.group ? (
				(permObj.group.read   !== undefined) * perms.GROUP_READ |
				(permObj.group.write  !== undefined) * perms.GROUP_WRITE |
				(permObj.group.delete !== undefined) * perms.GROUP_DELETE
			) : 0) |

			(permObj.other ? (
				(permObj.other.read   !== undefined) * perms.OTHER_READ |
				(permObj.other.write  !== undefined) * perms.OTHER_WRITE |
				(permObj.other.delete !== undefined) * perms.OTHER_DELETE
			) : 0)
	};
}

function setPerms(req,res,next)
{
	var id = parseInt(req.params.id, 16);
	var requestPerms;
	if( req.query.permFormat !== 'json' )
	{
		requestPerms = parseInt(req.body.toString(), 8);
		if( isNaN(requestPerms) ){
			return res.status(400).send('Requested permissions not in the correct format');
		}
	}
	else
	{
		try {
			requestPerms = JSON.parse( req.body.toString() );
		}
		catch(e){
			return res.status(400).send('Requested permissions not in the correct format');
		}

		requestPerms = packPerms(requestPerms);
		if( !requestPerms.given ){
			return res.status(400).send('No permissions given');
		}
	}

	hasPerm(id, req.session.username, perms.USER | perms.GROUP_WRITE, function(err,result)
	{
		if(err){
			console.error('Failed to check permissions:', err);
			res.status(500).send('DB error');
		}
		else if(!result){
			res.status(404).send('No asset with this ID');
		}
		else
		{
			var privilege = result.is_user * perms.USER | result.is_group * perms.GROUP | perms.OTHER;
			var permitted = result.requestedPerms & privilege;
			if( !permitted ){
				if(req.session.username)
					res.status(403).send('Only the owner of an asset can set its permissions');
				else
					res.status(401).send('Anonymous clients cannot set permissions');
			}
			else
			{
				var params = {$id: id};
				if(req.query.permFormat === 'json'){
					var n = requestPerms.newPerms, s = requestPerms.given, o = result.permissions;
					params.$perm = n&(o|s) | o&~n&~s;
				}
				else
					params.$perm = requestPerms;

				db.queryNoResults('UPDATE Assets SET permissions = $perm WHERE id = $id', params,
					function(err){
						if(err){
							console.error('Failed to update perms:', err);
							res.status(500).send('DB error');
						}
						else {
							res.sendStatus(200);
						}
					}
				);
			}
		}
	});
}

function setGroup(req,res,next)
{
	var id = parseInt(req.params.id, 16);
	hasPerm(id, req.session.username, perms.USER | perms.GROUP_WRITE, function(err,result)
	{
		if(err){
			console.error('Failed to check permissions:', err);
			res.status(500).send('DB error');
		}
		else if(!result){
			res.status(404).send('No asset with this ID');
		}
		else
		{
			var privilege = result.is_user * perms.USER | result.is_group * perms.GROUP | perms.OTHER;
			var permitted = result.requestedPerms & privilege;
			if( !permitted ){
				if(req.session.username)
					res.status(403).send('Asset does not allow unprivileged writes');
				else
					res.status(401).send('Asset does not allow anonymous writes');
			}
			else {
				db.queryNoResults('UPDATE Assets SET group_name = $group WHERE id = $id', 
					{$group: req.method === 'POST' ? req.body.toString() : null, $id: id},
					function(err){
						if(err){
							console.error('Failed to update perms:', err);
							res.status(500).send('DB error');
						}
						else {
							res.sendStatus( req.method === 'POST' ? 200 : 204);
						}
					}
				);
			}
		}
	});

}

exports.hasPerm = hasPerm;
exports.setPerms = setPerms;
exports.setGroup = setGroup;

exports.packPerms = packPerms;
exports.unpackPerms = unpackPerms;

// copy perms to exports
for(var i in perms){
	exports[i] = perms[i];
}
