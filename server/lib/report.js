module.exports = {
	// Creates new report for given object
	create: function (app, object, callback) {
		app.models.report.create({
			status: 1,
			object: object,
			created: new Date(),
			// userid: app.models.appuser.getCurrentUser().id,
		}, callback);
	},
	// Sets report to status WORKING
	working: function (app, report, callback) {
		report.status = 2;
		report.updated = new Date();
		app.models.report.upsert(report, callback);
	},
	done: function (app, report, callback) {
		report.status = 3;
		report.updated = new Date();
		app.models.report.upsert(report, callback);
	},
	failed: function (app, report, error, callback) {
		report.status = 4;
		report.error = error;
		report.updated = new Date();
		app.models.report.upsert(report, callback);
	},
};
