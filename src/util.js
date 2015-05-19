var decode = require('client-sessions').util.decode;


function headerSessions(req,res,next)
{
	var config = req.assetConfig;
	req.session = {'username': null};

	if( config.sessionHeader && req.headers[config.sessionHeader.toLowerCase()] )
	{
		var result = decode(
			{'cookieName': config.sessionCookieName, 'secret': config.sessionSecret},
			req.headers[config.sessionHeader.toLowerCase()]
		);
		result = result ? result.content : null;

		if( result && result.passport && result.passport.user )
			req.session.username = result.passport.user.UID;
	}

	/*
	 * should expose an object like this:
	 * { passport: 
	 *    { user: 
	 *       { sessionId: '19b10f0b-8843-43fe-990b-e4a2cc68c660',
	 *         UID: 'vergenzs',
	 *         Password: 'f20a93eb270de747fe57e8423f9f67897f7275358fdb5fd9027ca6d725b66921',
	 *         loginTime: '2015-05-14T17:45:55.493Z',
	 *         clients: {},
	 *         lastUpdate: '2015-05-14T17:45:55.493Z',
	 *         id: 'vergenzs',
	 *         Username: 'vergenzs' } } }
	 * from a header like this:
	 * kbQyaNN5mv3GRHLiPKZ1mA.pa3a_RhZvdOsYyxcb_YLbAIjpkk0N8Hf4lyyXhpD14spz8spUKLWJgGSa4ySafWrOEzWcr48cfqEKFRuJZ5x3wT-mVUbu8saQsZt7G2_qtdwy1z5BUbAV6UCAGfuVpmpX5FFnRJnpmZcVvabYwvDDBs3FiuF138vzSd-qXzbhWjLpGnKuUGmDvepfI-SLtrZMMgomb1NB0UxCqFOyLHHc4PzwYAqdbKTzyCjUwpLEcyGbIJtePMri3hZU97Bo8vkYg-EYFwTsbCO29MnMu-I_3aQ6nN3gwIaJEDcjgAzYXGSJUHvUWXr60JRtf75VqZ3d_grfY39WIokqZ-ad8zI3QdaRsk6QqKS-q7WJE3zUdMR4D1t4xbU_HuqwnlvnExoeIeQ53Y9Wn7HtAtoDfspoXl9FOXYbHkX8_w0eXYV6wQ.1431625543724.86400000.g4nTKaFwSBNJDJKjoJl1Q-e53Q0Gj4fekOcOmgwx8vk
	 */

	return next();
}

function formatId(int){
	return ('0000000'+int.toString(16)).slice(-8);
}

exports.headerSessions = headerSessions;
exports.formatId = formatId;
