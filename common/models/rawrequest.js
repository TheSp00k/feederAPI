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
					next(err);
				});
			});
		});
	})
};
