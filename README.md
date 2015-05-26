Sandbox Asset Server
====================

A simple set of CRUD services to manage Sandbox assets, plus basic permissions and metadata management. See the [API documentation](docs/api.md) for details.

Running As A Standalone Server
------------------------------

Clone the git repository and install its dependencies:

	~ $ git clone https://github.com/adlnet/SandboxAssetServer.git
	~ $ cd SandboxAssetServer
	~/SandboxAssetServer $ npm install

Configure the new server:

	~/SandboxAssetServer $ cp config.sample.json config.json
	~/SandboxAssetServer $ nano config.json

Run the server:

	~/SandboxAssetServer $ node src/app.js


Running As A Node Module
------------------------

(TBD)


Configuration Options
---------------------

* `dataDir` - The directory where all assets will be stored, relative to the project root.
* `sessionCookieName` - The name of the cookie to contain the encrypted client session. Used for decryption, even if passed in the headers.
* `sessionHeader` - The name of the header to contain the encrypted client session in case cookies are not viable.
* `sessionSecret` - The encryption key for the client session.
* `port` - STANDALONE ONLY. The port for the server to listen on.
* `urlBasePath` - STANDALONE ONLY. Set as prefix to all API endpoints. E.g. setting this value to `/adl/sandbox/` will yield the API endpoint `/adl/sandbox/assets/new`.
