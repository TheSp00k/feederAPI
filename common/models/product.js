'use strict';

module.exports = (Product) => {
	Product.totals = (productid, next) => {
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
				feedbacks = product.feedbacks(),
				starTotals = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};

			for (var i = 0; i < feedbacks.length; i++) {
				totalStars += feedbacks[i].totalratingscore;
				if ((Math.round(feedbacks[i].totalratingscore * 10) / 10) == 1) {
					starTotals[1] += 1;
				}
				if ((Math.round(feedbacks[i].totalratingscore * 10) / 10) == 2) {
					starTotals[2] += 1;
				}
				if ((Math.round(feedbacks[i].totalratingscore * 10) / 10) == 3) {
					starTotals[3] += 1;
				}
				if ((Math.round(feedbacks[i].totalratingscore * 10) / 10) == 4) {
					starTotals[4] += 1;
				}
				if ((Math.round(feedbacks[i].totalratingscore * 10) / 10) == 5) {
					starTotals[5] += 1;
				}
				if (feedbacks[i].totalratingscore) {
					totalFeedbackCount += 1;
				}
			}
			var totalProductScore = totalStars / totalFeedbackCount;

			var result = {
				totalratingscore: Math.round(totalProductScore * 10) / 10,
				startotals: starTotals
			};

			next(err, result);
		})
	};

	Product.import = function (data, callback) {
		var async = require('async');
		var response = [];
		data = data.constructor === Array ? data : [data];    // convert single object to array
		async.each(data, (item, cb) => {
			Product.findOne({where: {and: [{clientid: item.clientid}, {productnumber: item.productnumber}]}}, (err, productInstance) => {
				if (productInstance) {
					delete item.clientid;
					delete item.productnumber;
					item.id = productInstance.id;
				}
				Product.upsert(item, (upsertError, upsertInstance) => {
					if (upsertError) {
						cb(upsertError);
					} else {
						response.push(upsertInstance);
						cb();
					}
				});
			});
		}, (err) => {
			callback(err, response);
		});
	};
	Product.remoteMethod(
		'import',
		{
			description: 'Creates or updates a product or a list of products',
			http: {path: '/import', verb: 'put'},
			accepts: {arg: 'data', type: 'any', http: {source: 'body'}, description: 'An object or array of objects'},
			returns: {arg: 'data', type: 'any', root: true}
		}
	);
	Product.remoteMethod(
		'totals',
		{
			http: {path: '/totals', verb: 'get'},
			accepts: [
				{arg: 'productid', type: 'number'}
			],
			returns: {arg: 'feedbacktotals', root: true, type: 'object'}
		}
	);
};
