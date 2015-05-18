Database schema
===============

table Assets (
	id INT UNSIGNED,
	perms INT UNSIGNED,
	owner VARCHAR(50),
	group VARCHAR(50),
	uploaded TIMESTAMP,
	last_modified TIMESTAMP,

	PRIMARY KEY(id)
)

table Metadata (
	id INT UNSIGNED,
	key VARCHAR(50),
	value TEXT,

	PRIMARY KEY(id,key)
)

table Groups (
	group VARCHAR(50),
	user VARCHAR(50),

	PRIMARY KEY(group,user)
)
