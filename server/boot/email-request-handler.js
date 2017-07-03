'use strict';
var schedule = require('node-schedule');
var moment = require('moment');

var gearmanode = require('gearmanode');
var Report = require('../lib/report');

module.exports = function (app) {
	app.models.client.find({ where: { sendrequests: 1 }, restriction: 'none'}, (err, clientListInstance) => {
		if (clientListInstance.length > 0) {
			for (let i = 0; i < clientListInstance.length; i++) {
				if (clientListInstance[i].requesttime) {
					var hours = moment(clientListInstance[i].requesttime).format('H');
					var minutes = moment(clientListInstance[i].requesttime).format('m');
				}
				var rule = { hour: parseInt(hours), minute: parseInt(minutes) };
				// rule = '* * * * * *';
				schedule.scheduleJob('sendrequest' + clientListInstance[i].id, rule, () => {
					console.log('clientid: ' + clientListInstance[i].id + ' (' + clientListInstance[i].name + ') on ' + clientListInstance[i].requesttime + ' minute');
					Report.create(app, 'send-requests-client-' + clientListInstance[i].id, (err, report) => {
						if (err) {
							return err;
						}
						var gearmanClient = gearmanode.client({ port: 4730 });
						var gearmanJob = gearmanClient.submitJob('feedbackRequest',
							JSON.stringify({ clientid: clientListInstance[i].id, requestdelay: clientListInstance[i].requestdelay, report: report }),
							{ background: true, unique: 'rep-' + report.id });
						gearmanJob.on('submited', (data) => {
							gearmanClient.close();
							console.log('job submited');
							console.log('clientid: ' + clientListInstance[i].id + ' (' + clientListInstance[i].name + ') on ' + clientListInstance[i].requesttime + ' minute');
						});
					});
				});
			}
		}
	});
};
