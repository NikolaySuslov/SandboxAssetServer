Asset Server APIs
=================

/assets/new
-----------

Upload a new asset of the type specified in the `Content-Type` request header. Requires a login.

* `POST` - Upload a file to the server as a new asset. Returns the asset ID of the upload.

Returns:

* `201` - Asset successfully created.
* `400` - Uploaded assets must have a Content-Type.
* `401` - Cannot upload assets anonymously.

/assets/*asset_id*
------------------

Manage a particular asset.

* `GET` - Retrieves the asset. Requires read permissions on the asset.
* `POST` - Upload a file to the server to overwrite an existing asset. Requires write permissions on the asset.
* `DELETE` - Destroys the asset, and all related metadata. Requires delete permissions on the asset.

Returns:

* `200/204` - Request successful.
* `400` - Uploaded assets must have a Content-Type.
* `401` - Asset does not allow anonymous access/writes/deletion.
* `403` - Asset does not allow unprivileged access/writes/deletion.
* `404` - No asset with this ID.


/assets/*asset_id*/meta \[?octal=true\]
---------------------------------------

Manage arbitrary metadata about an asset. This endpoint exposes several pieces of protected read-only metadata: `type`, `permissions`, `user_name`, `group_name`, `created`, and `last_modified`.

If the value of a field is of the form `asset:<8 hex digits>`, it is considered to be an asset reference. See below for details.

* `GET` - Returns a JSON object containing all the metadata about the asset, including protected fields. The format of the `permissions` field can be chosen with the query argument `octal`, as documented below.
* `POST` - Accepts a JSON object. Merge the old set of metadata with the given object, keeping protected fields unchanged. Returns status code only.
* `DELETE` - Deletes all non-protected metadata for the given asset. Returns status code only.

Returns:

* `200/204` - Request successful.
* `400` - (`POST` only) Request body is not a valid JSON object.
* `401` - Asset does not allow anonymous access/writes.
* `403` - Asset does not allow unprivileged access/writes.
* `404` - No asset with this ID.


/assets/*asset_id*/meta/*key* \[?raw=true\]
-------------------------------------------

Manage a particular piece of metadata about the asset identified by *key*. This endpoint exposes several pieces of protected read-only metadata: `type`, `user_name`, `created`, and `last_modified`. Unlike the en masse metadata endpoint, this one can set the protected fields `permissions` and `group_name`. See below for more information.

If the value of the given piece of metadata is of the form `asset:<8 hex digits>`, it is considered to be an asset reference. `GET` requests to metadata referencing an asset will redirect to that asset unless the `raw` query argument is truthy.

For example, if you set a piece of metadata to the string `asset:deadbeef`, and `GET` it, the request will be 302 redirected to `/assets/deadbeef` without the `raw` argument, and will just return `asset:deadbeef` with it.

* `GET` - Returns a particular piece of metadata about the asset.
* `POST` - Update a particular piece of metadata. Returns status code only.
* `DELETE` - Delete the given piece of metadata for the given asset. Returns status code only.

Returns:

* `200/204` - Request successful.
* `400` - (`POST` only) New metadata value not specified, or of the incorrect format.
* `401` - Asset does not allow anonymous access/writes/deletion.
* `403` - Asset does not allow unprivileged access/writes/deletion, or else the specified field is protected.
* `404` - No asset with this ID.


/assets/*asset_id*/meta/permissions \[?octal=true\]
---------------------------------------------------

Manage an asset's permissions. This endpoint can accept/return either a JSON representation of the asset's permission set, or a UNIX-style octal integer representation, as determined by the truthiness of the query argument `octal`. See the permissions module [here](../src/perms.js#L5) and [here](../src/perms.js#L56) for details on how this value is de/constructed.

* `GET` - Returns the asset's permissions.
* `POST` - Sets the permissions on the asset to the given permission set. Note that only the asset uploader and members of a write-permitted group can set permissions.


/assets/*asset_id*/meta/group
-----------------------------

Manage an asset's assigned group.

* `GET` - Returns the name of the group assigned to this asset.
* `POST` - Assigns a group to this asset. Only the asset uploader and members of a write-permitted group can set an asset's group.
* `DELETE` - Clears the group assigned to this asset. Equivalent to a `POST` to this endpoint with an empty body.


/groups/new
-----------

Create a new permission group.

* `POST` - Create a new group whose only member is the creator.

Returns:

* `201` - Group created.
* `400` - No group name specified.
* `401` - Anonymous clients cannot create groups.
* `403` - There is already a group by that name.

/groups/*group_name*
--------------------

* `GET` - Returns a JSON object containing the group name (`group`) and the group membership list (`members`).

Returns:

* `200` - Request successful.
* `404` - No such group. Still returns an empty membership JSON object though.

/groups/*group_name*/adduser
----------------------------

* `POST` - Adds the user specified in the body of the request to the group. Can only be done by a current member of the group.

Returns:

* `200` - Request successful.
* `304` - The given user is already a member of that group.
* `400` - No user specified to add to the group.
* `401` - Anonymous users cannot modify groups.
* `403` - Only group members can add new members.
* `404` - No such group.

/groups/*group_name*/rmuser
----------------------------

* `POST` - Removes the user specified in the body of the request from the group. Can only be done by a current member of the group (including the user to be removed).

Returns:

* `204` - User successfully removed from group.
* `304` - Given user is not a member of this group.
* `400` - No user specified.
* `401` - Anonymous users cannot modify groups.
* `403` - The authenticated user is not a member of the group, cannot change membership.
* `404` - No such group.

/groups/by-user/*user_name*
---------------------------

* `GET` - Returns a JSON object containing the user name (`user`) and the list of groups the user is a part of (`membership`).

Returns:

* `200` - Request successful.

Planned APIs
============

/assets/by-user/*user_name*
---------------------------

* `GET` - Returns a JSON array of URLs to assets uploaded by the given user.
