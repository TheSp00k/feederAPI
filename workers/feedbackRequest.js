var gearmanode = require('gearmanode');
var worker = gearmanode.worker({port: 4730});
var app = require('../server/server');
var client = gearmanode.client({port: 4730});

var jobsDoneCount = 0;
var restartAfterJobs = 10;

worker.addFunction('sendFeedback', (job) => {
	console.log(job.payload.toString());
	
	var data = JSON.parse(job.payload.toString());
	var feedbackRequest = app.models.feedback;


	// Report.working(app, data.report);
	// function sendFeedback(item) {
	// 	if (item) {
	// 		return Client.upsert(item, (err, upsertInstance) => {
	// 			if (err) {
	// 				Report.failed(app, data.report, err);
	// 				return job.reportError('failed');
	// 			}
	// 			importItem(data.items.shift());
	// 		});
	// 	}

	// 	j.on('error', (err) => {
	// 		console.log(err);
	// 		job.reportError(err);
	// 	});

	// }

	// sendFeedback(data.items.shift());
});
