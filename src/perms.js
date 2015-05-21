var db = require('./db.js');

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
		'SELECT perms, type, user_name, group_name, user_name = $user AS is_user, ('+
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
				result.permitted = result.perms & requestedPerms & privilege;
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
	return permObj.user.read   * perms.USER_READ
		| permObj.user.write   * perms.USER_WRITE
		| permObj.user.delete  * perms.USER_DELETE

		| permObj.group.read   * perms.GROUP_READ
		| permObj.group.write  * perms.GROUP_WRITE
		| permObj.group.delete * perms.GROUP_DELETE

		| permObj.other.read   * perms.OTHER_READ
		| permObj.other.write  * perms.OTHER_WRITE
		| permObj.other.delete * perms.OTHER_DELETE;
}

function getPerms(req,res,next)
{
	var id = parseInt(req.params.id, 16);
	hasPerm(id, req.session.user, perms.READ, function(err,result)
	{
		if(err){
			console.error('Failed to check permissions:', err);
			res.sendStatus(500);
		}
		else if(!result){
			res.sendStatus(404);
		}
		else if( !result.permitted ){
			if(req.session.username)
				res.sendStatus(403);
			else
				res.sendStatus(401);
		}
		else {
			if(req.query.octal)
				res.send( result.perms.toString(8) );
			else
				res.json( unpackPerms(result.perms) );
		}
	});
}

function setPerms(req,res,next)
{
	var id = parseInt(req.params.id, 16);
	var requestPerms;
	if( req.query.octal ){
		requestPerms = parseInt(req.body.toString(), 8);
		if( isNaN(requestPerms) ){
			return res.sendStatus(400);
		}
	}
	else {
		try {
			requestPerms = JSON.parse( req.body.toString() );
		}
		catch(e){
			return res.sendStatus(400);
		}

		for(var i in requestPerms){
			for(var j in requestPerms[i]){
				requestPerms[i][j] = !!requestPerms[i][j];
			}
		}
	}

	hasPerm(id, req.session.username, perms.USER | perms.GROUP_WRITE, function(err,result)
	{
		if(err){
			console.error('Failed to check permissions:', err);
			res.sendStatus(500);
		}
		else if(!result){
			res.sendStatus(404);
		}
		else
		{
			var privilege = result.is_user * perms.USER | result.is_group * perms.GROUP | perms.OTHER;
			var permitted = result.requestedPerms & privilege;
			if( !permitted ){
				if(req.session.username)
					res.sendStatus(403);
				else
					res.sendStatus(401);
			}
			else {
				db.queryNoResults('UPDATE Assets SET perms = $perm WHERE id = $id',
					{$perm: req.query.octal ? requestPerms : packPerms(requestPerms), $id: id},
					function(err){
						if(err){
							console.error('Failed to update perms:', err);
							res.sendStatus(500);
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

function getGroup(req,res,next)
{
	var id = parseInt(req.params.id, 16);
	hasPerm(id, req.session.user, perms.READ, function(err,result)
	{
		if(err){
			console.error('Failed to check permissions:', err);
			res.sendStatus(500);
		}
		else if(!result){
			res.sendStatus(404);
		}
		else if( !result.permitted ){
			if(req.session.username)
				res.sendStatus(403);
			else
				res.sendStatus(401);
		}
		else {
			res.set('Content-Type', 'text/plain');
			res.send(result.group_name);
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
			res.sendStatus(500);
		}
		else if(!result){
			res.sendStatus(404);
		}
		else
		{
			var privilege = result.is_user * perms.USER | result.is_group * perms.GROUP | perms.OTHER;
			var permitted = result.requestedPerms & privilege;
			if( !permitted ){
				if(req.session.username)
					res.sendStatus(403);
				else
					res.sendStatus(401);
			}
			else {
				db.queryNoResults('UPDATE Assets SET group_name = $group WHERE id = $id', 
					{$group: req.method === 'POST' ? req.body.toString() : null, $id: id},
					function(err){
						if(err){
							console.error('Failed to update perms:', err);
							res.sendStatus(500);
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

exports.hasPerm = hasPerm;
exports.getPerms = getPerms;
exports.setPerms = setPerms;
exports.getGroup = getGroup;
exports.setGroup = setGroup;

// copy perms to exports
for(var i in perms){
	exports[i] = perms[i];
}
