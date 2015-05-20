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
		'SELECT perms, type, user_name = $user AS is_user, ('+
			'SELECT COUNT(*) FROM Groups INNER JOIN Assets ON Groups.group_name = Assets.group_name WHERE Assets.id = $asset AND Groups.user_name = $user'+
		') = 1 AS is_group, '+
		'FROM Assets WHERE id = $asset',
		{$user: user, $asset: asset},
		function(err, result)
		{
			if(err){
				cb(err);
			}
			else if(result){
				var privilege = (result.is_user ? perms.USER : 0) | (result.is_group ? perms.GROUP : 0) | perms.OTHER;
				result.permitted = result.perms & requestedPerms & privilege;
				cb( null, result );
			}
			else {
				cb();
			}
		}
	);
}

exports.hasPerm = hasPerm;

// copy perms to exports
for(var i in perms){
	exports[i] = perms[i];
}
