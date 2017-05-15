'use strict';
var async = require('async');
module.exports = (Feedback) => {
	Feedback.sendFeedback = function (data, next) {
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
				next(err, {code: 200, message: 'success'});
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
