'use strict';

module.exports = (Client) => {

	Client.observe('access', (ctx, next) => {
		console.log(ctx.query);
		if (ctx.query.restriction == 'none') {
			delete ctx.query.restriction;
			return next();
		}
		console.log(ctx.options);
		if (!ctx.options.accessToken) {
			return next();
		}
		Client.app.models.appuser.findById(ctx.options.accessToken.userId, (err, userInstance) => {
			if (err) {
				return next(err);
			}
			if (!userInstance || userInstance.length == 0) {
				let error = new Error();
				error.statusCode = 401;
				error.code = 401;
				error.message = 'Authorization Required';
				return next(error);
			}
			Client.findOne({where: {email: userInstance.email}}, (err, clientInstance) => {
				if (err) {
					return next(err);
				}
				if (!clientInstance) {
					let error = new Error();
					error.statusCode = 401;
					error.code = 401;
					error.message = 'Authorization Required';
					return next(error);
				}
				console.log(ctx.query.where, 'last');
				if (ctx.query.where) {
					ctx.query.where.id = clientInstance.id;
				} else {
					ctx.query.where = {
						id: clientInstance.id
					};
				}
				next();
			});
		});
	});

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
		ctx.req.body.appid = Client.generateId();
		let clientUser = {
			email: ctx.req.body.email,
			password: ctx.req.body.appid
		};
		Client.app.models.appuser.create(clientUser, (err, userInstance) => {
			if (err) {
				return next(err);
			}
			if (!userInstance) {
				let error = new Error();
				error.message = 'Something went wrong';
				return next(error);
			}
			next();
		});

	});
	Client.authAppId = (appid, domain, next) => {
		Client.findOne({where: {and: [{appid: appid}, {domain: domain}]}, restriction: 'none'}, (err, clientInstance) => {
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
				{arg: 'domain', type: 'string', description: 'Domain sent by client for CORS security'}
			],
			returns: { arg: 'data', type: 'any', root: true }
		}
	);
};
