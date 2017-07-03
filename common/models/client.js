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
						requestdelay: clientInstance.requestdelay,
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
			password: ctx.req.body.appid,
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
			next();
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

	Client.authAppId = (appid, domain, next) => {
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
				error.message = 'App id is invalid';
				return next(error);
			}
			Client.app.models.appuser.login({
				email: clientInstance.email,
				password: appid,
				ttl: 900000
			}, (err, authInfo) => {
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
			http: {path: '/authappid', verb: 'get'},
			accepts: [
				{arg: 'appid', type: 'string', description: 'App id that is sent by the client'},
				{arg: 'domain', type: 'string', description: 'Domain sent by client for CORS security'}
			],
			returns: {arg: 'data', type: 'any', root: true}
		}
	);
};
