Database schema
===============

```sql
CREATE TABLE IF NOT EXISTS Assets (
	id INT UNSIGNED,
	type VARCHAR(30) NOT NULL,
	perms SMALLINT UNSIGNED NOT NULL,
	owner_name VARCHAR(50) NOT NULL,
	group_name VARCHAR(50) NOT NULL,
	uploaded TIMESTAMP DEFAULT now,
	last_modified TIMESTAMP DEFAULT now,

	PRIMARY KEY(id)
)

CREATE TABLE IF NOT EXISTS Metadata (
	id INT UNSIGNED,
	key VARCHAR(50),
	value TEXT,
	asset INT UNSIGNED,

	PRIMARY KEY(id,key),
	FOREIGN KEY (asset) REFERENCES Assets(id) ON DELETE CASCADE
)

CREATE TABLE IF NOT EXISTS Groups (
	group_name VARCHAR(50) NOT NULL,
	user_name VARCHAR(50) NOT NULL,

	PRIMARY KEY(group_name,user_name)
)
```
