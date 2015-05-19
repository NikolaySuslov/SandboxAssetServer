Database schema
===============

```sql
CREATE TABLE Assets (
	id INT UNSIGNED,
	perms SMALLINT UNSIGNED NOT NULL,
	owner VARCHAR(50) NOT NULL,
	group VARCHAR(50) NOT NULL,
	uploaded TIMESTAMP DEFAULT now,
	last_modified TIMESTAMP DEFAULT now,

	PRIMARY KEY(id)
);

CREATE TABLE Metadata (
	id INT UNSIGNED,
	key VARCHAR(50),
	value TEXT,
	asset INT UNSIGNED,

	PRIMARY KEY(id,key),
	FOREIGN KEY (asset) REFERENCES Assets(id) ON DELETE CASCADE
);

CREATE TABLE Groups (
	group VARCHAR(50),
	user VARCHAR(50),

	PRIMARY KEY(group,user)
);
```
