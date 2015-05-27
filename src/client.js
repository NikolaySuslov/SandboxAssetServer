

function renderClient(config)
{
	return function(req,res,next)
	{
		console.log('Request for', req.url.slice(req.baseUrl.length));
		res.sendStatus(200);
	};
}

module.exports = renderClient;

