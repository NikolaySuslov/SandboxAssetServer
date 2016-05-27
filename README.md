Sandbox Asset Server
====================

A simple set of CRUD services to manage Sandbox assets, plus basic permissions and metadata management. See the [API documentation](docs/api.md) for details.

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


Running As A Standalone Server
------------------------------

Clone the git repository and install its dependencies:

```bash
~ $ git clone https://github.com/adlnet/SandboxAssetServer.git
~ $ cd SandboxAssetServer
~/SandboxAssetServer $ npm install
```

Configure the new server:

```bash
~/SandboxAssetServer $ cp config.sample.json config.json
~/SandboxAssetServer $ nano config.json
```

Run the server:
```bash
~/SandboxAssetServer $ node src/app.js
```


Running As A Node Module
------------------------

Install the server as a dependency:

```bash
$ npm install --save adlnet/SandboxAssetServer.git#v1.0.0
```

Add it to your Express app:

```javascript
var SAS = require('SandboxAssetServer');
app.use('/my/basepath', SAS({
	'dataDir': libpath.resolve(__datadir, 'asset_data'),
	'sessionCookieName': 'session',
	'sessionHeader': 'X-Session-Cookie',
	'sessionSecret': 'unsecure cookie secret'
}));
```


Configuration Options
---------------------

* `dataDir` - The directory where all assets will be stored, relative to the project root. Recommend using an absolute path for module includes.
* `sessionCookieName` - The name of the cookie to contain the encrypted client session. Used for decryption, even if passed in the headers.
* `sessionHeader` - The name of the header to contain the encrypted client session in case cookies are not viable.
* `sessionSecret` - The encryption key for the client session.
* `port` - STANDALONE ONLY. The port for the server to listen on.
* `urlBasePath` - STANDALONE ONLY. Set as prefix to all API endpoints. E.g. setting this value to `/adl/sandbox/` will yield the API endpoint `/adl/sandbox/assets/new`.
 
## License
   Copyright &copy;2016 Advanced Distributed Learning

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
