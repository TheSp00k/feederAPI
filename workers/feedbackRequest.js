var gearmanode = require('gearmanode');
var moment = require('moment');
var worker = gearmanode.worker({port: 4730});
var app = require('../server/server');
var Report = require('../server/lib/report');
var mailer = require('../server/lib/mailer');
var client = gearmanode.client({port: 4730});

var jobsDoneCount = 0;
var restartAfterJobs = 10;

worker.addFunction('feedbackRequest', (job) => {
	console.log(job.payload.toString());

	//data.report
	//data.clientid
	//data.requestdelay

	var data = JSON.parse(job.payload.toString());

	Report.working(app, data.report);
	var Request = app.models.request;

	// now - 3d >= request.created
	// var delay = moment().subtract(data.requestdelay, 'days');
	var delay = moment();


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
	Request.find(requestQuery, (err, requestInstance) => {
		if (err) {
			Report.failed(app, data.report, err);
			return job.reportError('failed');
		}
		var emailHtml = 'Hi,<br><br>' +
			'Your request for exporting clients has been processed.<br>' +
			'You can download clients in ' + type + ' format from <a href="' + url + '">here</a>';
		var subject = 'Your request for exporting clients has been processed';
		mailer.sendEmail(currentUser.email, app.get('emailSendFrom'), subject, emailHtml, (err, success) => {
			if (err)
				console.log(err);
			return job.workComplete('complete');
		});
			// request.products = requestProductsInstance;
			// console.log(request.products);
			// nextRequest();

		console.log(requestInstance);
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
	});

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
