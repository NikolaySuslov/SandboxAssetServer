So, it’s still too hard to get content into the Sandbox. The 3DR is a good start, but it’s built on older tech, and database operations are too slow.

Requirements
------------

### Stage 1

* **DONE** Be able to run as a standalone service, or as a module within Sandbox
* **DONE** Allow anonymous download of any asset
* **DONE** Require credentials for all uploads
	* **DONE** Keep log of who uploads what
	* **DONE** Have some SSO solution common with Sandbox
* **DONE** Randomly generate UID for uploaded content
* **DONE** Allow download by UID
* **DONE** Return UID in response to upload HTTP request
* **DONE** Keep mime type data for each file
	* **DONE** should be specified during upload
	* **DONE** should not depend on filename for info about type	
* **DONE** Support CORS

### Stage 2

* **DONE** Expose some method to list all files uploaded by some user
* Enforce some max total disk space per user
* **DONE** Expose some method to list by type
* Allow upload by URL - user sends url for server to fetch, then normal process
* **DONE** Allow overwrite of file at given UID
	* **DONE** enforce credentials - on original uploader can change

### Stage 3

* Verify file contents vs defined type
* **DONE** attach additional user specified metadata to assets
* **DONE** search by this metadata
* **DONE** include references between assets
	* models to textures
	* thumbnail for model
	* LOD of other asset
* convert content between types on demand

