'use strict';

module.exports = (ProductRequest) => {
	ProductRequest.import = function (data, callback) {
		var async = require('async');
		var response = [];
		data = data.constructor === Array ? data : [data];    // convert single object to array
		async.each(data, (item, cb) => {
			ProductRequest.upsert(item, (upsertError, upsertInstance) => {
				if (upsertError) {
					cb(upsertError);
				} else {
					response.push(upsertInstance);
					cb();
				}
			});
		}, (err) => {
			callback(err, response);
		});
	};
	ProductRequest.remoteMethod(
		'import',
		{
			description: 'Creates or updates a productrequest or a list of productrequests',
			http: { path: '/import', verb: 'put' },
			accepts: { arg: 'data', type: 'object', http: { source: 'body' }, description: 'An object or array of objects' },
			returns: { arg: 'data', type: 'any', root: true }
		}
	);
};
