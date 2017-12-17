'use strict';

module.exports = (Ratingcrit) => {
    Ratingcrit.import = function (data, callback) {
		var async = require('async');
		var response = [];
		data = data.constructor === Array ? data : [data];    // convert single object to array
		async.each(data, (item, cb) => {
            Ratingcrit.upsert(item, (upsertError, upsertInstance) => {
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
	Ratingcrit.remoteMethod(
		'import',
		{
			description: 'Creates or updates a rating criteria or a list of rating criterias',
			http: {path: '/import', verb: 'put'},
			accepts: {arg: 'data', type: 'any', http: {source: 'body'}, description: 'An object or array of objects'},
			returns: {arg: 'data', type: 'any', root: true}
		}
	);
};
