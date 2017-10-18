'use strict';
var async = require('async');
module.exports = (Feedback) => {

	Feedback.afterRemote('sendFeedback', (context, instance, next) => {
		var res = context.res;
		if (context.args.type == 'json') {
			return next(null, context.result);
		} else {
			console.log(context.args.data.token);
			// let message = `<div style="width: 500px;
			// 	margin: 20% auto;
			// 	text-align: center;
			// 	padding: 20px;
			// 	background-color: #dff0d8;
			// 	border-radius: 10px;
			// 	font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;">Thank you for leaving a feedback</div>`;
			// res.send(message);
			res.writeHead(302, {Location: `${Feedback.app.get('adminUrl')}/#/request/${context.req.body.requestid}/${context.args.data.token}/1`});
			res.end();
			// return next();
		}
	});

	Feedback.beforeRemote('sendFeedback', (context, unused, next) => {
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
				if (context.req.query.type == 'json') {
					return next(err);
				}
				// let error = `<div style="width: 500px;
				// 	margin: 20% auto;
				// 	text-align: center;
				// 	padding: 20px;
				// 	background-color: #f2dede;
				// 	border-radius: 10px;
				// 	font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;">${err.message}</div>`;
				context.res.writeHead(302, {Location: `${Feedback.app.get('adminUrl')}/#/request/${context.req.body.requestid}/${context.args.data.token}`});
				context.res.end();
				return next();
			} else {
				return next();
			}
		});
	});

	Feedback.sendFeedback = (data, type, next) => {
		console.log(data);
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
				Feedback.app.models.product.findOne(
					{where: {and: [{clientid: data.clientid}, {productnumber: data.productnumber}]}},
					(err, productInstance) => {
						if (err) {
							return nextFeedback(err);
						}
						if (productInstance.id) {
							feedback.productid = productInstance.id;
						}
						Feedback.upsert(feedback, (err, feedbackInstance) => {
							if (err) {
								return nextFeedback(err);
							}
							nextFeedback();
						})
					}
				);
			}, (err) => {
				console.log(err);
				if (err) {
					return next(err);
				}
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
						if (err) {
							return next(err);
						}
						next(null, {code: 200, clientInfo: clientInstance, message: 'Thank you for leaving a feedback'});
						//
						// Feedback.app.models.AccessToken.deleteById(data.token, (err, info) => {
						// 	next(err, {code: 200, message: 'success'});
						// });
					});
				});
			});
		});
	};

	Feedback.sendFeedbackFromWidget = (data, next) => {
		if (!data.clientid) {
			return next({errorCode: 'CLIENT_NOT_FOUND', statusCode: 404});
		}
		if (!data.productnumber) {
			return next({errorCode: 'PRODUCT_NOT_FOUND', statusCode: 404});
		}
		let productInfo = {
			clientid: data.clientid,
			productnumber: data.productnumber,
			name: data.name,
			photourl: data.photourl,
			sendrequests: true,
			showfeedbacks: true
		};
		console.log(data, productInfo);
		Feedback.app.models.product.findOne(
			{where: {and: [{clientid: data.clientid}, {productnumber: data.productnumber}]}},
			(err, productInstance) => {
				if (err) {
					return next(err);
				}
				if (productInstance && productInstance.id) {
					productInfo.id = productInstance.id;
				}
				Feedback.app.models.product.upsert(productInfo, (err, productInstance) => {
					if (err) {
						return next(err);
					}
					let feedbackInfo = {
						productid: productInstance.id,
						commentcontent: data.commentcontent,
						totalratingscore: data.totalratingscore,
						clientid: data.clientid,
						purchased: false
					};
					let customerInfo = {
						clientid: data.clientid,
						email: data.customer.email,
						secretemail: Feedback.app.models.customer.hideEmail(data.customer.email)
					};
					Feedback.app.models.customer.findOne(
						{where: {and: [{clientid: data.clientid}, {email: data.customer.email}]}},
						(err, customerInstance) => {
							if (err) {
								return next(err);
							}
							if (customerInstance && customerInstance.id) {
								feedbackInfo.customerid = customerInstance.id;
								customerInfo.id = customerInstance.id;
							}
							Feedback.app.models.customer.upsert(customerInfo, (err, customerInstance) => {
								if (err) {
									return next(err);
								}
								feedbackInfo.customerid = customerInstance.id;
								Feedback.upsert(feedbackInfo, (err, feedbackInstance) => {
									return next(err, feedbackInstance);
								})
							})
						}
					);
				});
			});
	};

	Feedback.remoteMethod(
		'sendFeedbackFromWidget',
		{
			description: 'Send feedback from widget with customer and product information',
			http: {path: '/sendfeedbackfromwidget', verb: 'post'},
			accepts: [{
				arg: 'data',
				type: 'object',
				http: {source: 'body'},
				description: 'An object'
			}],
			returns: {arg: 'data', type: 'any', root: true}
		}
	);

	Feedback.remoteMethod(
		'sendFeedback',
		{
			description: 'Creates or updates a product or a list of products',
			http: {path: '/sendfeedback', verb: 'post'},
			accepts: [{
				arg: 'data',
				type: 'object',
				http: {source: 'body'},
				description: 'An object or array of objects'
			},
			{
				arg: 'type',
				type: 'string',
				description: 'For returning json'
			}],
			returns: {arg: 'data', type: 'any', root: true}
		}
	);
};
