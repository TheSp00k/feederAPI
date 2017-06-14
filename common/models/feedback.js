'use strict';
var async = require('async');
module.exports = (Feedback) => {

	Feedback.afterRemote('sendFeedback', (context, instance, next) => {
		var res = context.res; //this is the same response object you get in Express
		console.log(instance);
		res.send('hello world');
	});

	Feedback.beforeRemote('sendFeedback', (context, next) => {
		console.log(context.req.body);
		Feedback.app.models.request.findById(context.req.body.requestid, (err, requestInstance) => {
			if (err) {
				return next(err);
			}
			if (!requestInstance) {
				err = new Error();
				err.code = 500;
				err.message = 'Something went wrong.';
			}

			if (requestInstance.status === 'sent') {
				err = new Error();
				err.code = 404;
				err.message = 'You have already left a feedback.';
			}

			if (err) {
				// return next(err);
				context.res.send('<h1>not working</h1>');
			}
		});
	});

	Feedback.sendFeedback = (data, next) => {
		Feedback.app.models.client.findById(data.clientid, (err, clientInstance) => {
			if (err) {
				return next(err);
			}
			if (!clientInstance) {
				var error = new Error();
				error.message = 'Client not found';
				error.code = 404;
				return next(error);
			}
			async.each(data.feedbacks, (feedback, nextFeedback) => {
				feedback.clientid = data.clientid;
				feedback.customerid = data.customerid;
				feedback.purchased = true;
				Feedback.upsert(feedback, (err, feedbackInstance) => {
					if (err) {
						return nextFeedback(err);
					}
					nextFeedback();
				})
			}, (err) => {
				Feedback.app.models.request.findById(data.requestid, (err, requestInstance) => {
					if (err) {
						return next(err);
					}
					if (!requestInstance) {
						err = new Error();
						err.code = 500;
						err.message = 'Something went wrong.';
					}

					if (requestInstance.status === 'sent') {
						err = new Error();
						err.code = 404;
						err.message = 'You have already left a feedback.';
					}

					if (err) {
						return next(err);
					}

					requestInstance.status = 'sent';

					Feedback.app.models.request.upsert(requestInstance, (err, upsertRequest) => {
						next(err, {code: 200, message: 'success'});
					});
				});
			});
		});
	};
	Feedback.remoteMethod(
		'sendFeedback',
		{
			description: 'Creates or updates a product or a list of products',
			http: {path: '/sendfeedback', verb: 'post'},
			accepts: {
				arg: 'data',
				type: 'object',
				http: {source: 'body'},
				description: 'An object or array of objects'
			},
			returns: {arg: 'data', type: 'any', root: true}
		}
	);
};
