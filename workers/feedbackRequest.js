var gearmanode = require('gearmanode');
var moment = require('moment');
var worker = gearmanode.worker({port: 4730});
var app = require('../server/server');
var Report = require('../server/lib/report');
var mailer = require('../server/lib/mailer');
var client = gearmanode.client({port: 4730});
var async = require('async');

var jobsDoneCount = 0;
var restartAfterJobs = 10;

worker.addFunction('feedbackRequest', (job) => {
	// console.log(job.payload.toString());

	//data.report
	//data.clientid
	//data.requestdelay

	var data = JSON.parse(job.payload.toString());
// console.log(data);
	Report.working(app, data.report);
	var Request = app.models.request;
	app.models.client.findById(data.clientid, (err, clientInstance) => {
		console.log(clientInstance.requestdelay);
		var delay = moment().subtract(clientInstance.requestdelay, 'days');
		// var delay = moment();
		console.log(delay);
		// console.log(data.requestdelay);

		var requestQuery = {
			include: ['products', 'customer'],
			where: {
				and: [
					{type: 'request'},
					{status: 'created'},
					{clientid: data.clientid},
					{created: {lte: delay}}
				]
			}
		};

		async.waterfall([
			(nextStep) => {
				console.log(JSON.stringify(requestQuery));
				Request.find(requestQuery, (err, requestInstances) => {
					if (err) {
						Report.failed(app, data.report, JSON.stringify(err));
						return nextStep(job.reportError('failed'));
					}
					console.log(!requestInstances || requestInstances.length == 0);
					let error = null;
					if (!requestInstances || requestInstances.length == 0) {
						error = new Error();
						error.code = 404;
						error.statusCode = 404;
						error.message = 'There are no products and client';
					}
					nextStep(error, requestInstances);
				})
			},
			(requestInstances, nextStep) => {
				let itemsErrors = [];
				async.each(requestInstances, (request, nextRequest) => {
					console.log('each');
					if (!request.products || request.products.length == 0) {
						let error = new Error();
						error.code = 404;
						error.statusCode = 404;
						error.message = 'There are no products';
						itemsErrors.push(error);
						return nextRequest();
					} else if (!request.customer) {
						let error = new Error();
						error.code = 404;
						error.statusCode = 404;
						error.message = 'There is no customer';
						itemsErrors.push(error);
						return nextRequest();
					} else {
						var products = request.products();
						var customer = request.customer();
						for (var p = 0; p < products.length; p++) {
							if (!products[p].sendrequests) {
								products.splice(p, 1);
							}
						}
						if (products.length == 0) {
							return nextRequest();
						}
						console.log(customer);
						var mailInfo = {
							client: {
								id: request.clientid
							},
							requestid: request.id,
							products: products,
							customer: customer
						};
						console.log('send');
						Request.sendFeedbackRequest(mailInfo, (err, response) => {
							console.log(err);
							console.log(response);
							if (err) {
								return nextRequest(err);
							}

							request.status = 'sent';
							Request.upsert(request, (err, requestInstance) => {
								if (err) {
									return nextRequest(err);
								}
								nextRequest();
							});

						});
					}
				}, (err) => {
					// if (err) {
					// 	nextStep(err);
					// } else {
					nextStep();
					// }
				});
			}

		], (result, err) => {
			if (err) {
				console.log('cia');
				Report.failed(app, data.report, JSON.stringify(err));
				return job.reportError('failed');
			}
			Report.done(app, data.report, (err) => {
				if (err)
					return console.log('feedbackRequest: can not change report status to finished:', err);
				job.workComplete('completed');
				jobsDoneCount++;
				if ((jobsDoneCount - restartAfterJobs) >= 0) {
					setImmediate(() => {
						process.exit(0);
					});
				}
			});
		});
	});
	// now - 3d >= request.created


	// Request.find(requestQuery, (err, requestInstance) => {
	// 	if (err) {
	// 		Report.failed(app, data.report, err);
	// 		return job.reportError('failed');
	// 	}
	// 	if (!requestInstance || requestInstance.length == 0) {
	// 		let error = new Error();
	// 		error.code = 404;
	// 		error.statusCode = 404;
	// 		error.message = 'There are no products and client';
	// 		Report.failed(app, data.report, error);
	// 		return job.reportError('failed');
	// 	}
	// 	if (!requestInstance.products || requestInstance.products.length == 0) {
	// 		let error = new Error();
	// 		error.code = 404;
	// 		error.statusCode = 404;
	// 		error.message = 'There are no products';
	// 		Report.failed(app, data.report, error);
	// 		return job.reportError('failed');
	// 	}
	// 	if (!requestInstance.customer) {
	// 		let error = new Error();
	// 		error.code = 404;
	// 		error.statusCode = 404;
	// 		error.message = 'There is no customer';
	// 		Report.failed(app, data.report, error);
	// 		return job.reportError('failed');
	// 	}
	// 	console.log(requestInstance);
	// 	var products = requestInstance.products();
	// 	var customer = requestInstance.customer;
	// 	for (var p = 0; p < products.length; p++) {
	// 		if (!products[p].sendrequests) {
	// 			products.splice(p, 1);
	// 		}
	// 	}
	// 	var mailInfo = {
	// 		client: {
	// 			id: requestInstance.clientid
	// 		},
	// 		products: products,
	// 		customer: customer
	// 	};
	// 	Request.sendFeedbackRequest(mailInfo, (err, response) => {
	// 		if (err) {
	// 			Report.failed(app, data.report, err);
	// 			return job.reportError('failed');
	// 		}
	// 		Report.done(app, data.report, (err) => {
	// 			if (err)
	// 				return console.log('importOrder: can not change report status to finished:', err);
	// 			job.workComplete('completed');
	// 			jobsDoneCount++;
	// 			if ((jobsDoneCount - restartAfterJobs) >= 0) {
	// 				setImmediate(() => {
	// 					process.exit(0);
	// 				});
	// 			}
	// 		});
	// 	});
	// var emailHtml = 'Hi,<br><br>' +
	// 	'Your request for exporting clients has been processed.<br>' +
	// 	'You can download clients in tuu format from';
	// var subject = 'Your request for exporting clients has been processed';
	// mailer.sendEmail(currentUser.email, app.get('emailSendFrom'), subject, emailHtml, (err, success) => {
	// 	if (err)
	// 		console.log(err);
	// 	return job.workComplete('complete');
	// });
	// request.products = requestProductsInstance;
	// console.log(request.products);
	// nextRequest();

	// console.log(JSON.stringify(requestInstance));
	// async.each(requestInstance, (request, nextRequest) => {
	// 	Request.__get__products({id: request.id}, (err, requestProductsInstance) => {
	//
	// 		if (err) {
	// 			return nextRequest(err);
	// 		}
	// 		request.products = requestProductsInstance;
	// 		console.log(request.products);
	// 		nextRequest();
	// 	})
	// }, (err) => {
	// 	if (err) {
	// 		Report.failed(app, data.report, err);
	// 		return job.reportError('failed');
	// 	}
	// });

	// for (var i = 0; i < requestInstance.length; i++) {
	//
	// }
	// });

	// function sendFeedback(item) {
	// 	if (item) {
	//
	//
	// 		return Feedback.upsert(item, (err, upsertInstance) => {
	// 			if (err) {
	// 				Report.failed(app, data.report, err);
	// 				return job.reportError('failed');
	// 			}
	// 			importItem(data.items.shift());
	// 		});
	// 	}
	//
	// 	j.on('error', (err) => {
	// 		console.log(err);
	// 		job.reportError(err);
	// 	});
	//
	// }

	// sendFeedback(data.items.shift());
});
