Asset Server APIs
=================

Configuration
-------------

### /session-header-name

Since this asset server does not authenticate, it relies on client systems to authenticate users. Clients must send a signed and encrypted session string with all `POST` and `DELETE` requests to this server. The session must have been encrypted with the same name and secret as supplied in `config.json` (`sessionCookieName` and `sessionSecret` respectively), preferably using the Node.js middleware [node-client-sessions](https://github.com/mozilla/node-client-sessions). The session data can be supplied either with a header (identified by this endpoint) or a cookie (given in `config.json`).

* `GET` - Returns the name of the header to be used for client session data.


Asset Management
----------------

### /assets/new \[?*meta*=*data*\]

Upload a new asset of the type specified in the `Content-Type` request header. Requires an authenticated user.

If desired, you can set metadata on the new asset by supplying some in the query argument of the URL. E.g. `POST /assets/new?group_name=devteam&permissions=764&name=some_asset`.

* `POST` - Upload a file to the server as a new asset. Returns the asset ID of the upload.

Returns:

* `201` - Asset successfully created.
* `400` - Uploaded assets must have a Content-Type.
* `401` - Cannot upload assets anonymously.


### /assets/*asset_id*

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


Metadata Management
-------------------

### /assets/*asset_id*/meta \[?permFormat=json\]

Manage arbitrary metadata about an asset. This endpoint exposes several pieces of protected read-only metadata: `type`, `permissions`, `user_name`, `group_name`, `created`, `last_modified`, and `size`.

If the value of a field is of the form `asset:<8 hex digits>`, it is considered to be an asset reference. See below for details.

* `GET` - Returns a JSON object containing all the metadata about the asset, including protected fields. The format of the `permissions` field can be chosen with the query argument `permFormat`, as documented below.
* `POST` - Accepts a JSON object. Merge the old set of metadata with the given object, keeping protected fields unchanged. Returns status code only.
* `DELETE` - Deletes all non-protected metadata for the given asset. Returns status code only.

Returns:

* `200/204` - Request successful.
* `400` - (`POST` only) Request body is not a valid JSON object.
* `401` - Asset does not allow anonymous access/writes.
* `403` - Asset does not allow unprivileged access/writes.
* `404` - No asset with this ID.


### /assets/*asset_id*/meta/*key* \[+*key*\] \[?raw=true\] \[?permFormat=json\]

Manage a particular piece of metadata about the asset identified by *key*. This endpoint exposes several pieces of protected read-only metadata: `type`, `user_name`, `created`, `last_modified`, and `size`. Unlike the en masse metadata endpoint, this one can set the protected fields `permissions` and `group_name`. See below for more information.

If the value of the given piece of metadata is of the form `asset:<8 hex digits>`, it is considered to be an asset reference. `GET` requests to metadata referencing an asset will redirect to that asset unless the `raw` query argument is truthy. For example, if you set a piece of metadata to the string `asset:deadbeef`, and `GET` it, the request will be 302 redirected to `/assets/deadbeef` without the `raw` argument, and will just return the string `asset:deadbeef` with it.

You can retrieve multiple pieces of metadata at once by making a `GET` request and specifying multiple metadata keys separated by a `+` (e.g. `GET /assets/deadbeef/meta/name+description`).

* `GET` - Returns a particular piece of metadata about the asset.
* `POST` - Update a particular piece of metadata. Returns status code only.
* `DELETE` - Delete the given piece of metadata for the given asset. Returns status code only.

Returns:

* `200/204` - Request successful.
* `400` - (`POST` only) New metadata value not specified, or of the incorrect format.
* `401` - Asset does not allow anonymous access/writes/deletion.
* `403` - Asset does not allow unprivileged access/writes/deletion, or else the specified field is protected.
* `404` - No asset with this ID.


### /assets/*asset_id*/meta/permissions \[?permFormat=json\]

Manage an asset's permissions. This endpoint accepts/returns a UNIX-style octal integer permission representation, or alternatively a JSON representation of the asset's permission set if the query argument `permFormat` is set to `json`. See the permissions module [here](../src/perms.js#L5) and [here](../src/perms.js#L56) for details on how the two representations are converted.

* `GET` - Returns the asset's permissions in the specified format.
* `POST` - Sets the permissions on the asset to the given permission set. If a sparse JSON object (i.e. does not have every permission) is POSTed, it will be merged with the current permission set. Note that only the asset uploader and members of a write-permitted group can set permissions.


### /assets/*asset_id*/meta/group

Manage an asset's assigned group.

* `GET` - Returns the name of the group assigned to this asset.
* `POST` - Assigns a group to this asset. Only the asset uploader and members of a write-permitted group can set an asset's group.
* `DELETE` - Clears the group assigned to this asset. Equivalent to a `POST` to this endpoint with an empty body.


Search
------

### /assets/by-user/*user_name*

Retrieve a list of assets owned by a particular user. This is functionally identical to `/assets/by-meta/all-of?user_name=<user_name>`.

* `GET` - Returns a JSON object containing the user name (`user_name`) and an object (`assets`) mapping asset IDs to other objects containing a minimum set of asset metadata. An asset is described here by its metadata `id`, `type`, `permissions`, `user_name`, `group_name`, `created`, `last_update`, and `size`.

Returns:

* `200` - Request successful.


### /assets/by-meta/any-of, all-of \[?query_args\]

Retrieve a list of assets whose protected and user-defined metadata satisfies any of, or all of, a set of criteria. Each query argument describes a single criterion according to the following syntax:

	criterion ::= meta_name ["!" comparison_operator ["!" ignored] ] "=" meta_value ;
	comparison_operator ::= "equal" | "notEqual" | "greaterThan" | "greaterEqual"
		| "lessThan" | "lessEqual" | "like" | "hasPerms" ;

If a comparison operator is not specified, the default operator is `equal`, and criteria with invalid operators are discarded. Additional `ignored` text can be added if you need to make the query argument name unique, as required by the query string standard. Asset references can be specified using the usual `asset:id` format. Date/time formats are flexible, and anything parsable by [Date.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse) is acceptable, but ISO-8601 dates are recommended.

When querying the `permissions` metadata field, the special operator `hasPerms` is available, accepting an octal permission set. An asset will pass the `permissions!hasPerms` criterion if its permissions are at least as permissive as those given, i.e. `asset.permissions & query != 0`. For all other metadata, the `hasPerms` operator is invalid.

So for example, if you wanted all JPEG assets from a particular user, you could query it like so (except URL-encoded):

	GET /assets/by-meta/all-of?type!equal=image/jpeg&user_name=user

You can also search for assets that match at least one criterion instead of all of them by using the `any-of` endpoint:

	GET /assets/by-meta/any-of?type!equal!0=image/jpeg&type!equal!1=image/png

This query will return any JPEG or PNG assets (though it would be more practical in this case to say `?type!like=image/%`).

* `GET` - Returns a JSON object containing the input query (`query`), and the matching assets (`matches`) as an object. This object is of identical structure to that returned by the `by-user` endpoint.

Returns:

* `200` - Request successful.
* `400` - Must supply at least one valid query argument.


Group Management
----------------

### /groups/new

Create a new permission group.

* `POST` - Create a new group whose only member is the creator.

Returns:

* `201` - Group created.
* `400` - No group name specified.
* `401` - Anonymous clients cannot create groups.
* `403` - There is already a group by that name.


### /groups/*group_name*

* `GET` - Returns a JSON object containing the group name (`group_name`) and the group membership list (`members`).

Returns:

* `200` - Request successful.
* `404` - No such group. Still returns an empty membership JSON object though.


### /groups/*group_name*/adduser

* `POST` - Adds the user specified in the body of the request to the group. Can only be done by a current member of the group.

Returns:

* `200` - Request successful.
* `304` - The given user is already a member of that group.
* `400` - No user specified to add to the group.
* `401` - Anonymous users cannot modify groups.
* `403` - Only group members can add new members.
* `404` - No such group.


### /groups/*group_name*/rmuser

* `POST` - Removes the user specified in the body of the request from the group. Can only be done by a current member of the group (including the user to be removed).

Returns:

* `204` - User successfully removed from group.
* `304` - Given user is not a member of this group.
* `400` - No user specified.
* `401` - Anonymous users cannot modify groups.
* `403` - The authenticated user is not a member of the group, cannot change membership.
* `404` - No such group.


### /groups/by-user/*user_name*

* `GET` - Returns a JSON object containing the user name (`user_name`) and the list of groups the user is a part of (`membership`).

Returns:

* `200` - Request successful.
