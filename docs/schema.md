Database schema
===============

```sql
CREATE TABLE Assets (
	id INT UNSIGNED,
	perms SMALLINT UNSIGNED,
	owner VARCHAR(50),
	group VARCHAR(50),
	uploaded TIMESTAMP,
	last_modified TIMESTAMP,

	PRIMARY KEY(id)
);

CREATE TABLE Metadata (
	id INT UNSIGNED,
	key VARCHAR(50),
	value TEXT,
	asset INT UNSIGNED,

	PRIMARY KEY(id,key),
	FOREIGN KEY (asset) REFERENCES Assets(id)
);

CREATE TABLE Groups (
	group VARCHAR(50),
	user VARCHAR(50),

	PRIMARY KEY(group,user)
);
```
