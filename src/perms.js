var db = require('./db.js');

var perms =
{
	USER_READ    : 0x100,
	USER_WRITE   : 0x080,
	USER_DELETE  : 0x040,
	
	GROUP_READ   : 0x020,
	GROUP_WRITE  : 0x010,
	GROUP_DELETE : 0x008,
	
	OTHER_READ   : 0x004
	OTHER_WRITE  : 0x002,
	OTHER_DELETE : 0x001,
	
	READ         : 0x124,
	WRITE        : 0x092,
	DELETE       : 0x049,

	USER         : 0x1c0,
	GROUP        : 0x038,
	OTHER        : 0x007,
};

function hasPerm(asset, user, requestedPerms, cb)
{
	db.queryFirstResult(
		'SELECT user_name = ? AS is_user, ('+
			'SELECT COUNT(*) FROM Groups INNER JOIN Assets ON Groups.group_name = Assets.group_name WHERE Assets.id = ? AND Groups.user_name = ?'+
		') = 1 AS is_group, '+
		'perms FROM Assets WHERE id = ?',
		[user, asset, user, asset],
		function(err, result)
		{
			if(err){
				console.error(err);
				cb(0);
			}
			else {
				var privilege = (result.is_user ? perms.USER : 0) | (result.is_group ? perms.GROUP : 0) | perms.OTHER;
				cb( result.perms & requestedPerms & privilege );
			}
		}
	);
}

exports.hasPerm = hasPerm;

// copy perms to exports
for(var i in perms){
	exports[i] = perms[i];
}
