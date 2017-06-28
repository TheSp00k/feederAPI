'use strict';

module.exports = (Client) => {

	Client.generateId = () => {
		var d = new Date().getTime();
		var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			var r = (d + Math.random() * 16) % 16 | 0;
			d = Math.floor(d / 16);
			return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
		});
		return uuid;
	};
	Client.beforeRemote('create', (ctx, unused, next) => {
		console.log(ctx.req.body);

		ctx.req.body.appid = Client.generateId();
		next();
	});
	Client.authAppId = (appid, domain, next) => {
		console.log(appid, domain);
		
		Client.findOne({where: {and: [{appid: appid}, {domain: domain}]}}, (err, clientInstance) => {
			if (err) {
				return next(err);
			}
			if (!clientInstance) {
				let error = new Error();
				error.statusCode = 404;
				error.code = 404;
				error.message = 'App id is invalid';
				return next(error);
			}
			Client.app.models.appuser.login({email: clientInstance.email, password: appid, ttl: 900000}, (err, authInfo) => {
				if (err) {
					return next(err);
				}
				if (authInfo.id) {
					clientInstance.token = authInfo.id;
				}
				next(null, clientInstance);
			});
		});
	};
	Client.remoteMethod(
		'authAppId',
		{
			description: 'Checks if app Id is valid',
			http: { path: '/authappid', verb: 'get' },
			accepts: [
				{arg: 'appid', type: 'string', description: 'App id that is sent by the client'},
				{arg: 'domain', type: 'string', description: 'Domain sent by client for CORS security'},
			],
			returns: { arg: 'data', type: 'any', root: true },
		}
	);
};
