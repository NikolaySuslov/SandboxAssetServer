Asset Server APIs
=================

/assets/new
-----------

Upload a new asset of the type specified in the `Content-Type` request header. Requires a login.

* `POST` - Upload a file to the server as a new asset. Returns the asset ID of the upload.

Returns:

* `201` - Asset successfully created.
* `401` - Cannot upload assets anonymously.

/assets/*asset_id*
------------------

Manage a particular asset.

* `GET` - Retrieves the asset. Requires read permissions on the asset.
* `POST` - Upload a file to the server to overwrite an existing asset. Requires write permissions on the asset.
* `DELETE` - Destroys the asset, and all related metadata. Requires delete permissions on the asset.

Returns:

* `200/204` - Request successful.
* `401` - Asset does not allow anonymous access/writes/deletion.
* `403` - Asset does not allow unprivileged access/writes/deletion.
* `404` - No asset with this ID.

/assets/*asset_id*/meta/permissions
-----------------------------------

Manage an asset's permissions. This endpoint can accept/return either a JSON representation of the asset's permission set, or a UNIX-style octal integer representation, as determined by the truthiness of the query argument `octal`. See the [permissions](../src/perms.js#L5) [module](../src/perms.js#L54) for details on how this value is de/constructed.

* `GET` - Returns the asset's permissions.
* `POST` - Sets the permissions on the asset to the given permission set. Note that only the asset uploader and members of a write-permitted group can set permissions.

Returns:

* `200` - Request successful.
* `400` - (`POST` only) Request body is not a valid permission specifier.
* `401` - Anonymous clients cannot set permissions.
* `403` - Only the owner of an asset can set its permissions.
* `404` - No asset with this ID.

/assets/*asset_id*/meta/group
-----------------------------

* `GET` - Returns the name of the group assigned to this asset.
* `POST` - Assigns a group to the given asset. Only the asset uploader and members of a write-permitted group can set an asset's group.

/groups/new
-----------

* `POST` - Create a new group whose only member is the creator.

/groups/*group_name*
--------------------

* `GET` - Returns a JSON object containing the group name (`group`) and the group membership list (`members`).

/groups/*group_name*/adduser
----------------------------

* `POST` - Adds the user specified in the body of the request to the group. Can only be done by a current member of the group.

/groups/*group_name*/rmuser
----------------------------

* `POST` - Removes the user specified in the body of the request from the group. Can only be done by a current member of the group (including the user to be removed).

/groups/by-user/*user_name*
---------------------------

* `GET` - Returns a JSON object containing the user name (`user`) and the list of groups the user is a part of (`membership`).


Planned APIs
============

/assets/*asset_id*/meta
-------------------------

* `GET` - Returns a JSON object containing all the metadata about the asset.
* `POST` - Accepts a JSON object. Merge the old set of metadata with the given object, keeping protected fields unchanged. Returns the updated metadata.
* `DELETE` - Delete all user-set metadata for the given asset. Returns status code only.

/assets/*asset_id*/meta/*key*
-----------------------------

* `GET` - Returns a particular piece or pieces of metadata about the asset, e.g. owner, upload date, format, etc.
* `POST` - Update a particular piece of metadata. Returns the new value.
* `DELETE` - Delete the given piece of metadata for the given asset. Returns status code only.

/assets/by-user/*user_name*
---------------------------

* `GET` - Returns a JSON array of URLs to assets uploaded by the given user.
