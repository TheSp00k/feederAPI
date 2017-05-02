'use strict';
var schedule = require('node-schedule');
var moment = require('moment');

module.exports = function (app) {
	app.models.client.find({where: {sendrequests: 1}}, (err, clientListInstance) => {
		if (clientListInstance.length > 0) {
			for (let i = 0; i < clientListInstance.length; i++) {
				if (clientListInstance[i].requesttime) {
					var hours = moment(clientListInstance[i].requesttime).format('H');
					var minutes = moment(clientListInstance[i].requesttime).format('m');
				}
				var job = schedule.scheduleJob({hour: parseInt(hours), minute: parseInt(minutes)}, function () {
					//TODO register job (payload: {clientid,})
					console.log('clientid: ' + clientListInstance[i].id + ' (' + clientListInstance[i].name + ') on ' + clientListInstance[i].requesttime + ' minute');
				});
				console.log('clientid: ' + clientListInstance[i].id + ' (' + clientListInstance[i].name + ') on ' + clientListInstance[i].requesttime + ' minute');
			}
		}
	});
};
