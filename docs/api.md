Asset Server Planned APIs
=========================


Access
------

### GET *root*/assets/by-id/\[id\] (planned)

Returns the binary asset with the given id.

### GET *root*/assets/by-id/\[id\]/meta (planned)

Returns a JSON object containing metadata about the asset.

### GET *root*/assets/by-id/\[id\]/meta/\[key\]+ (planned)

Returns a particular piece or pieces of metadata about the asset, e.g. owner, upload date, format, etc.

### GET *root*/assets/by-id/\[id\]/v/\[revision\] (planned)

Returns an old version of the asset.


Index
-----

### GET *root*/assets/by-owner/\[username\] (planned)

Returns a JSON array of URLs to assets uploaded by the given user.

### GET *root*/assets/by-tag/\[tag\]+ (planned)

Returns a JSON array of URLs to assets tagged with any of the given pipe-delineated tags.


Create
------

### POST *root*/assets/new (planned)

Create a new asset on the server with the body of the request. Returns a URL to the newly uploaded asset.


Update
------

### POST *root*/assets/by-id/\[id\] (planned)

Overwrite the model at the given id, and optionally save the old version. Returns status code only.

### POST *root*/assets/by-id/\[id\]/meta (planned)

Accepts a JSON object. Merge the old set of metadata with the given object, keeping protected fields unchanged. Returns the updated metadata.

### POST *root*/assets/by-id/\[id\]/meta/\[key\] (planned)

Update a particular piece of metadata. Returns the new value.


Delete
------

### DELETE *root*/assets/by-id/\[id\] (planned)

Destroy the asset at the given id, and all previous versions. Returns status code only.

### DELETE *root*/assets/by-id/\[id\]/meta (planned)

Delete all user-set metadata for the given asset. Returns status code only.

### DELETE *root*/assets/by-id/\[id\]/meta/\[key\]+ (planned)

Delete the given piece of metadata for the given asset. Returns status code only.


Group Management
----------------

### GET *root*/groups/\[groupname\]

Returns a JSON object containing the group name and member list.

### POST *root*/groups/\[groupname\]/adduser

Add a member to the given group. Request body is a user or list of users. Returns status code only.

### POST *root*/groups/\[groupname\]/rmuser

Remove a member from the given group. Request body is a user or list of users. Returns status code only.

### POST *root*/groups/new

Create a new group containing the requesting user. Request body should be the name of the group to be created. Returns URL of the resulting group.
