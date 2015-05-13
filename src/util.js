var decode = require('client-sessions').util.decode;

function headerSessions(config)
{
	return function(req,res,next)
	{
		if( config.sessionHeader && req.headers[config.sessionHeader] )
		{
			var result = decode(
				{'secret': config.sessionSecret},
				req.headers[config.sessionHeader]
			).content;
			req.session = result;
		}

		return next();
	};
}

exports.headerSessions = headerSessions;
