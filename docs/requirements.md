So, it’s still too hard to get content into the Sandbox. The 3DR is a good start, but it’s built on older tech, and database operations are too slow.

Requirements
------------

Stage 1

* Be able to run as a standalone service, or as a module within Sandbox
* Allow anonymous download of any asset
* Require credentials for all uploads
	* Keep log of who uploads what
	* Have some SSO solution common with Sandbox
* Randomly generate UID for uploaded content
* Allow download by UID
* Return UID in response to upload HTTP request
* Keep mime type data for each file
	* should be specified during upload
	* should not depend on filename for info about type	
* Support CORS

Stage 2

* Expose some method to list all files uploaded by some user
* Enforce some max total disk space per user
* Expose some method to list by type
* Allow upload by URL - user sends url for server to fetch, then normal process
* Allow overwrite of file at given UID
	* enforce credentials - on original uploader can change

Stage 3

* Verify file contents vs defined type
* attach additional user specified metadata to assets
* search by this metadata
* include references between assets
	* models to textures
	* thumbnail for model
	* LOD of other asset
* convert content between types on demand

