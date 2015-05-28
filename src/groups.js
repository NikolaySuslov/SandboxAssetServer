var db = require('./db.js');

function getGroupMembership(req,res,next)
{
	db.queryAllResults('SELECT user_name FROM Groups WHERE group_name = ?', [req.params.gname], function(err,rows)
	{
		if(err){
			console.error('Failed to query group info:', err);
			res.status(500).send('DB error');
		}
		else
		{
			if(rows.length === 0){
				res.status(404).json({'group_name': req.params.gname, 'members':[]});
			}
			else
			{
				res.json({
					'group_name': req.params.gname,
					'members': rows.reduce(function(sum,cur){return sum.concat(cur.user_name);}, [])
				});
			}
		}
	});
}

function getUserMembership(req,res,next)
{
	db.queryAllResults('SELECT group_name FROM Groups WHERE user_name = ?', [req.params.user],
		function(err,rows)
		{
			if(err){
				console.error('Failed to get user membership:', err);
				res.status(500).send('DB error');
			}
			else {
				res.json({
					'user_name': req.params.user,
					'membership': rows.reduce(function(sum,cur){return sum.concat(cur.group_name);}, [])
				});
			}
		}
	);
}

function newGroup(req,res,next)
{
	if( req.body.length === 0 ){
		return res.status(400).send('No group name specified');
	}
	else if( !req.session.username ){
		return res.status(401).send('Anonymous clients cannot create groups');
	}
	else
	{
		db.queryFirstResult('SELECT COUNT(*) = 0 AS allowed FROM Groups WHERE group_name = $group',
			{$group: req.body.toString()},
			function(err,result)
			{
				if(err){
					console.error('Failed to check group membership:', err);
					res.status(500).send('DB error');
				}
				else if( !result.allowed ){
					res.status(403).send('Group already exists');
				}
				else
				{
					db.queryNoResults('INSERT INTO Groups (group_name, user_name) VALUES($group, $user)',
						{$group: req.body.toString(), $user: req.session.username},
						function(err)
						{
							if(err){
								console.error('Failed to add to group', err);
								res.status(500).send('DB error');
							}
							else {
								res.sendStatus(201);
							}
						}
					);
				}
			}
		);
	}
}

function addUser(req,res,next)
{
	if( !req.session.username ){
		res.status(401).send('Anonymous clients cannot modify groups');
	}
	else if( req.body.length === 0 ){
		res.status(400).send('No user specified to add to the group');
	}
	else
	{
		db.queryFirstResult('SELECT COUNT(*) = 1 AS allowed FROM Groups WHERE user_name = $requester AND group_name = $group',
			{$group: req.params.gname, $requester: req.session.username},
			function(err,result)
			{
				if(err){
					console.error('Failed to check group membership:', err);
					res.status(500).send('DB error');
				}
				else if( !result ){
					res.status(404).send('No such group');
				}
				else if( !result.allowed ){
					res.status(403).send('Only group members can add new members');
				}
				else
				{
					db.queryNoResults(
						'INSERT INTO Groups (group_name, user_name) VALUES ($group, $user)',
						{$group: req.params.gname, $user: req.body.toString()},
						function(err)
						{
							if(err){
								if(err.constraint){
									res.status(304).send('The given user is already a member of this group');
								}
								else {
									console.error('Failed to add member to group:', err);
									res.status(500).send('DB error');
								}
							}
							else {
								res.sendStatus(200);
							}
						}
					);
				}
			}
		);
	}
}

function rmUser(req,res,next)
{
	/*
	 	A much more efficient query that can't provide the same feedback:

		DELETE FROM Groups WHERE user_name = $user AND group_name = $group AND (
			SELECT COUNT(*) FROM Groups WHERE user_name = $requester AND group_name = $group
		)
	*/

	if( !req.session.username ){
		res.status(401).send('Anonymous clients cannot modify groups');
	}
	else if( req.body.length === 0 ){
		res.status(400).send('No user specified to remove from the group');
	}
	else
	{
		db.queryFirstResult('SELECT '+
			'(SELECT COUNT(*) FROM Groups WHERE group_name = $group) > 0 AS group_exists, '+
			'(SELECT COUNT(*) FROM Groups WHERE group_name = $group AND user_name = $requester) = 1 AS group_member',
			{$group: req.params.gname, $requester: req.session.username},
			function(err,result)
			{
				if(err){
					console.error('Failed to determine group membership:', err);
					res.status(500).send('DB error');
				}
				else if( !result.group_exists ){
					res.status(404).send('No group with this name');
				}
				else if( !result.group_member ){
					res.status(403).send('Only group members can remove other members');
				}
				else
				{
					db.queryNoResults(
						'DELETE FROM Groups WHERE user_name = $user AND group_name = $group',
						{$group: req.params.gname, $user: req.body.toString()},
						function(err,result)
						{
							if(err){
								console.error('Failed to remove user from group:', err);
								res.status(500).send('DB error');
							}
							else if(result.changes === 0){
								res.status(304).send('The given user is already not a member of the group');
							}
							else {
								res.sendStatus(204);
							}
						}
					);

				}
			}
		);
	}

}

exports.getGroupMembership = getGroupMembership;
exports.getUserMembership = getUserMembership;
exports.newGroup = newGroup;
exports.addUser = addUser;
exports.rmUser = rmUser;
