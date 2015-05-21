Asset Server APIs
=================

/assets/new
-----------

* `POST` - Upload a file to the server as a new asset of the type specified in the `Content-Type` header. Returns the asset ID of the upload.

/assets/*asset_id*
------------------

* `GET` - Retrieves the asset. Requires read permissions on the asset.
* `POST` - Upload a file to the server to overwrite an existing asset. Requires write permissions on the asset.
* `DELETE` - Destroys the asset, and all related metadata. Requires delete permissions on the asset.

/assets/*asset_id*/meta/permissions
-----------------------------------

* `GET` - Returns a JSON enumeration of the asset's permissions. If the query argument `octal=true` is specified, will return a single integer in octal representing the same set of permissions.
* `POST` - Sets the permissions on the asset based on the given JSON enumeration of permissions, like the `GET` method returns. If the query argument `octal=true` is specified, will expect an octal integer representation instead. Note that only the asset uploader and members of a write-permitted group can set permissions.

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
