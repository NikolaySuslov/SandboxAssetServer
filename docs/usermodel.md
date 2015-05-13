User and Permissions Model
==========================

Users are identified by the server via encrypted and signed client sessions, but are not authenticated. That job is for a front-end system.

Users can create a new group containing himself.

A member of a group can add or remove other members to that group.

A member of a group can remove himself from the group.

A group is only deleted when the last member is removed.

Assets have an owner and a group, and three different permission sets: owner permissions, group permissions, and other permissions.

Permissions: read (4), update/replace (2), and delete (1)

Permissions on uploaded models are 744 by default.

Only the owner of an asset can change an asset's permissions.
