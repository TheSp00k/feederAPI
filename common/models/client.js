'use strict';
var moment = require('moment');
var schedule = require('node-schedule');
var gearmanode = require('gearmanode');
var Report = require('../../server/lib/report');
module.exports = (Client) => {

	Client.observe('access', (ctx, next) => {
		if (ctx.query.restriction == 'none') {
			delete ctx.query.restriction;
			return next();
		}
		if (!ctx.options.accessToken) {
			return next();
		}

		Client.app.models.appuser.findById(ctx.options.accessToken.userId, (err, userInstance) => {
			if (err) {
				return next(err);
			}
			console.log(userInstance);
			if (!userInstance || userInstance.length == 0) {
				let error = new Error();
				error.statusCode = 401;
				error.code = 401;
				error.message = 'Authorization Required';
				return next(error);
			}

			if (userInstance.feedbackadmin) {
				return next();
			}
			let where = {widgetemail: userInstance.email};
			if (ctx.query.requestfrom == 'adminpanel') {
				where = {email: userInstance.email};
			}
			Client.findOne({where: where}, (err, clientInstance) => {
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
	Client.observe('before save', (ctx, next) => {
		console.log(ctx.instance);
		console.log(ctx.data);
		if (ctx.instance.id) {
			Client.findById(ctx.instance.id, (err, clientInstance) => {
				if (err) {
					return next(err);
				}
				if (!clientInstance) {
					let error = new Error();
					error.code = 404;
					error.statusCode = 404;
					error.message = 'No client found';
					return next(error);
				}
				ctx.instance.appid = clientInstance.appid;
				next();
			})
		} else {
			next();
		}
	});
	Client.observe('after save', (ctx, next) => {
		let job = schedule.scheduledJobs['sendrequest' + ctx.instance.id];
		if (job) {
			var hours = moment(ctx.instance.requesttime).format('H');
			var minutes = moment(ctx.instance.requesttime).format('m');
			var rule = {hour: parseInt(hours), minute: parseInt(minutes)};
			job.reschedule(rule);
			return next();
		}
		let clientInstance = ctx.instance;
		var hours = moment(clientInstance.requesttime).format('H');
		var minutes = moment(clientInstance.requesttime).format('m');

		var rule = {hour: parseInt(hours), minute: parseInt(minutes)};
		// rule = '* * * * * *';
		schedule.scheduleJob('sendrequest' + clientInstance.id, rule, () => {
			console.log('clientid: ' + clientInstance.id + ' (' + clientInstance.name + ') on ' + clientInstance.requesttime + ' minute');
			Report.create(Client.app, 'send-requests-client-' + clientInstance.id, (err, report) => {
				if (err) {
					return err;
				}
				var gearmanClient = gearmanode.client({port: 4730});
				var gearmanJob = gearmanClient.submitJob('feedbackRequest',
					JSON.stringify({
						clientid: clientInstance.id,
						report: report
					}),
					{background: true, unique: 'rep-' + report.id});
				gearmanJob.on('submited', (data) => {
					gearmanClient.close();
					console.log('job submited');
					console.log('clientid: ' + clientInstance.id + ' (' + clientInstance.name + ') on ' + clientInstance.requesttime + ' minute');
				});
			});
		});
		next();
	});
	Client.beforeRemote('create', (ctx, unused, next) => {

		ctx.req.body.appid = Client.generateId();
		let clientUser = {
			email: ctx.req.body.email,
			password: Client.generateId()
			// clientid: ctx.req.body.id
		};
		let widgetUser = {
			email: `widget${ctx.req.body.email}`,
			password: Client.generateId()
			// clientid: ctx.req.body.id
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
			Client.app.models.appuser.create(widgetUser, (err, widgetUserInstance) => {
				if (err) {
					return next(err);
				}
				if (!widgetUserInstance) {
					let error = new Error();
					error.message = 'Something went wrong';
					return next(error);
				}
				
				next();
			});
		});
	});

	Client.afterRemote('create', (ctx, instance, next) => {
		Client.app.models.appuser.findOne({where: {email: instance.email}}, (err, userInstance) => {
			if (err) {
				return next(err);
			}
			if (!userInstance) {
				let error = new Error();
				error.message = 'Something went wrong';
				return next(error);
			}
			userInstance.clientid = instance.id;
			Client.app.models.appuser.upsert(userInstance, (err, userUpsertInstance) => {
				next(err);
			});
		});
	});

	Client.authAppId = (appid, domain, accesstoken, next) => {
		console.log(appid, domain);
		Client.findOne({
			where: {and: [{appid: appid}, {domain: domain}]},
			restriction: 'none'
		}, (err, clientInstance) => {
			if (err) {
				return next(err);
			}
			if (!clientInstance) {
				let error = new Error();
				error.statusCode = 404;
				error.code = 404;
				error.message = 'Access denied.';
				return next(error);
			}
			if (accesstoken) {
				Client.app.models.AccessToken.findById(accesstoken, (err, accessTokenInstance) => {
					if (err) {
						return next(err);
					}
					if (!accessTokenInstance) {
						newAuth(clientInstance, appid, (err, authInfo) => {
							return next(err, authInfo);
						});
					} else {
						const now = new Date();
						if (now.getTime() - accessTokenInstance.created.getTime() < accessTokenInstance.ttl) {
							accessTokenInstance.clientid = clientInstance.id;
							return next(null, accessTokenInstance);
						} else {
							accessTokenInstance.created = now;
							Client.app.models.AccessToken.upsert(accessTokenInstance, (err, accessTokenUpdated) => {
								if (err) {
									return next(err);
								}
								accessTokenUpdated.clientid = clientInstance.id;
								return next(null, accessTokenUpdated);
							});
						}
					}
				});
			} else {
				newAuth(clientInstance, appid, (err, authInfo) => {
					return next(err, authInfo);
				});
			}
		});
	};
	let newAuth = (clientInstance, appid, next) => {
		Client.app.models.appuser.login({
			email: clientInstance.widgetemail,
			password: appid
		}, (err, authInfo) => {
			if (err) {
				return next(err);
			}
			authInfo.clientid = clientInstance.id;
			return next(null, authInfo);
		});
	};
	Client.remoteMethod(
		'authAppId',
		{
			description: 'Checks if app Id is valid',
			http: {path: '/authappid', verb: 'get'},
			accepts: [
				{arg: 'appid', type: 'string', description: 'App id that is sent by the client'},
				{arg: 'domain', type: 'string', description: 'Domain sent by client for CORS security'},
				{arg: 'accesstoken', type: 'string', description: 'Access token for check if it is not expired'}
			],
			returns: {arg: 'data', type: 'any', root: true}
		}
	);
};
