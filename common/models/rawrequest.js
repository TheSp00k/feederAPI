'use strict';

module.exports = (RawRequest) => {
	RawRequest.observe('before save', (ctx, next) => {
		let customer, products, request, error;

		if (!ctx.instance.clientid) {
			error = new Error();
			error.code = 400;
			error.message = 'client id not found';
		}
		if (ctx.instance.customer) {
			customer = ctx.instance.customer;
			customer.clientid = ctx.instance.clientid;
		} else {
			error = new Error();
			error.code = 400;
			error.message = 'customer not found';
		}
		if (ctx.instance.products && ctx.instance.products.length > 0) {
			products = ctx.instance.products;
			for (let i = 0; i < products.length; i++) {
				products[i].clientid = ctx.instance.clientid;
			}
		} else {
			error = new Error();
			error.code = 400;
			error.message = 'products not found';
		}
		if (error) {
			return next(error);
		}


		RawRequest.app.models.customer.findOne({where: {and: [{email: customer.email}, {clientid: ctx.instance.clientid}]}}, (err, customerInstance) => {
			if (err) {
				return next(err);
			}
			if (customerInstance) {
				customer.id = customerInstance.id;
			}
			RawRequest.app.models.customer.upsert(customer, (err, customerInstance) => {
				if (err) {
					return next(err);
				}
				request = {
					type: 'request',
					status: 'created',
					clientid: ctx.instance.clientid,
					customerid: customerInstance.id
				};
				RawRequest.app.models.request.upsert(request, (err, requestInstance) => {
					if (err) {
						return next(err);
					}
					RawRequest.app.models.product.import(products, (err, productInstance) => {
						if (err) {
							return next(err);
						}
						let productRequests = [];
						for (let i = 0; i < products.length; i++) {
							productRequests.push({requestid: requestInstance.id, productid: products[i].id});
						}
						RawRequest.app.models.productrequest.import(productRequests, (err, productInstance) => {
							next(err);
						});
					});
				});
			});
		});
	})
};
