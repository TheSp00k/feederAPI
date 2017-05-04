'use strict';

module.exports = (Product) => {
	Product.totalRatingScore = (productid, next) => {
		var filter = {
			include: {
				relation: 'feedbacks',
				scope: {
					where: {approved: true}
				}
			}
		};
		Product.findById(productid, filter, (err, product) => {
			var totalStars = 0,
				totalFeedbackCount = 0,
				feedbacks = product.feedbacks();

			for (var i = 0; i < feedbacks.length; i++) {
				totalStars += feedbacks[i].totalratingscore;
				if (feedbacks[i].totalratingscore) {
					totalFeedbackCount += 1;
				}
			}
			var totalProductScore = totalStars / totalFeedbackCount;
			next(err, Math.round( totalProductScore * 10 ) / 10);
		})
	};

	Product.import = function (data, callback) {
		var async = require('async');
		var response = [];
		data = data.constructor === Array ? data : [data];    // convert single object to array
		async.each(data, (item, cb) => {
			Product.upsert(item, (upsertError, upsertInstance) => {
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
	Product.remoteMethod(
		'import',
		{
			description: 'Creates or updates a product or a list of products',
			http: { path: '/import', verb: 'put' },
			accepts: { arg: 'data', type: 'object', http: { source: 'body' }, description: 'An object or array of objects' },
			returns: { arg: 'data', type: 'any', root: true }
		}
	);
	Product.remoteMethod(
		'totalRatingScore',
		{
			http: { path: '/totalratingscore', verb: 'get' },
			accepts: [
				{ arg: 'productid', type: 'number' }
			],
			returns: { arg: 'totalscore', root: true, type: 'number' }
		}
	);
};
