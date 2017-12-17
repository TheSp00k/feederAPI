'use strict';

module.exports = (Product) => {
	Product.beforeRemote('totals', (context, unused, next) => {
		let path = context.req.headers.host;
		console.log(context.req.query);
		
		Product.app.models.client.findById(context.req.query.clientid, (err, clientInstance) => {
			if (err) {
				return next(err);
			}
			if (!clientInstance || !path.includes(clientInstance.domain)) {
				let error = new Error('Client not found');
				error.code = 404;
				return next(error);
			}
			next();
		});
	});
	Product.totals = (productid, clientid, productnumber, next) => {
		let where = {id: productid};
		if (productnumber && clientid) {
			where.and = [{clientid}, {productnumber}];
		}
		let filter = {
			where: where,
			include: {
				relation: 'feedbacks',
				scope: {
					where: {approved: true},
					include: 'ratings'
				}
			}
		};
		Product.findOne(filter, (err, product) => {
			if (err) {
				return next(err);
			}
			if (!product) {
				return next();
			}
			var totalStars = 0,
				totalFeedbackCount = 0,
				feedbacks = product.feedbacks(),
				critTotals = {},
				starTotals = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};

			for (var i = 0; i < feedbacks.length; i++) {
				totalStars += feedbacks[i].totalratingscore;
				let ratings = feedbacks[i].ratings();
				console.log(ratings);
				
				if (ratings) {
					for (var r = 0; r < ratings.length; r++) {
						if (critTotals[ratings[r].critid]) {
							critTotals[ratings[r].critid].count += 1;
							critTotals[ratings[r].critid].scoreTotal += ratings[r].score;
						} else {
							critTotals[ratings[r].critid] = {count: 1, scoreTotal: ratings[r].score};
						}
					}
				}
				console.log(critTotals);
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
				startotals: starTotals,
				crittotals: critTotals,
				totalFeedbackCount: totalFeedbackCount
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
				{arg: 'productid', type: 'number'},
				{arg: 'clientid', type: 'number'},
				{arg: 'productnumber', type: 'string'}
			],
			returns: {arg: 'feedbacktotals', root: true, type: 'object'}
		}
	);
};
