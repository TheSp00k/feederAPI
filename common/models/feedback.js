'use strict';
var async = require('async');
module.exports = (Feedback) => {

	Feedback.afterRemote('sendFeedback', (context, instance, next) => {
		var res = context.res; //this is the same response object you get in Express
		let message = `<div style="width: 500px;
			margin: 20% auto;
			text-align: center;
			padding: 20px;
			background-color: #dff0d8;
			border-radius: 10px;
			font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;">Thank you for leaving a feedback</div>`;
		res.send(message);
	});

	Feedback.beforeRemote('sendFeedback', (context, unused, next) => {
		console.log(context.req.body);
		Feedback.app.models.request.findById(context.req.body.requestid, (err, requestInstance) => {
			if (err) {
				return next(err);
			}
			if (!requestInstance) {
				err = new Error();
				err.code = 500;
				err.message = 'Something went wrong.';
			}else if (requestInstance.status === 'replied') {
				err = new Error();
				err.code = 404;
				err.message = 'You have already left a feedback.';
			}

			if (err) {
				let error = `<div style="width: 500px;
					margin: 20% auto;
					text-align: center;
					padding: 20px;
					background-color: #f2dede;
					border-radius: 10px;
					font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;">${err.message}</div>`;
				context.res.send(error);
			} else {
				next();
			}
		});
	});

	Feedback.sendFeedback = (data, next) => {
		console.log('asdasdsa');
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
				console.log(err);
				Feedback.app.models.request.findById(data.requestid, (err, requestInstance) => {
					if (err) {
						return next(err);
					}
					if (!requestInstance) {
						err = new Error();
						err.code = 500;
						err.message = 'Something went wrong.';
					}

					requestInstance.status = 'replied';

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
