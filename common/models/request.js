'use strict';

module.exports = (Request) => {
	Request.sendFeedbackRequest = (info, next) => {
		const apiUrl = Request.app.get('apiUrl');
		const adminUrl = Request.app.get('adminUrl');
		Request.app.models.client.findById(info.client.id, (err, clientInstance) => {
			if (err) {
				return next(err);
			}
			if (!clientInstance.id) {
				let err = new Error();
				err.code = 404;
				err.message = `Client(${info.client.id}) not found`;
				return next(err);
			}

			Request.app.models.appuser.login({
				email: 'mailer@reviewslight.com',
				password: 'tempMailerReviewsLight'
			}, (err, authInfo) => {
				if (err) {
					return next(err);
				}
				let mailer = require('../../server/lib/mailer');
				let emailContent = `Sveiki, ${clientInstance.name} kviečia palikti atsiliepimą.`;

				let productsStr = '';
				let formProductsFields = '';
				let rating = '';

				for (let i = 0; i < info.products.length; i++) {
					if (info.products[i].name) {
						rating = `
						<td style="text-align: left">
							<input type="radio" id="rating-${info.products[i].id}-1" name="feedbacks[${info.products[i].id}][totalratingscore]" value="1">
							<label for="rating-${info.products[i].id}-1" style="font-size: 1.3em; color: #eed034;">★</label>
						</td>
						<td>
							<input type="radio" id="rating-${info.products[i].id}-2" name="feedbacks[${info.products[i].id}][totalratingscore]" value="2">
							<label for="rating-${info.products[i].id}-2" style="font-size: 1.3em; color: #eed034;">★★</label>
						</td>
						<td>
							<input type="radio" id="rating-${info.products[i].id}-3" name="feedbacks[${info.products[i].id}][totalratingscore]" value="3">
							<label for="rating-${info.products[i].id}-3" style="font-size: 1.3em; color: #eed034;">★★★</label>
						</td>
						<td>
							<input type="radio" id="rating-${info.products[i].id}-4" name="feedbacks[${info.products[i].id}][totalratingscore]" value="4">
							<label for="rating-${info.products[i].id}-4" style="font-size: 1.3em; color: #eed034;">★★★★</label>
						</td>
						<td>
							<input type="radio" id="rating-${info.products[i].id}-5" name="feedbacks[${info.products[i].id}][totalratingscore]" value="5">
							<label for="rating-${info.products[i].id}-5" style="font-size: 1.3em; color: #eed034;">★★★★★</label>
						</td>`;
						formProductsFields += `
					<tr>
						<td style="color: #9b999a; font-weight: 600; line-height: 25px; font-size: 16px; padding-top: 25px;" colspan="5">${info.products[i].name}</td>
					</tr>
					<tr style="text-align: left">
						<td colspan="5"><label style="color: #9b999a; font-weight: 600; display: inline-block; padding-top: 15px;" for="title-${info.products[i].id}">Įvertinimas:</label></td>
					</tr>
					<tr>
						${rating}
					</tr>
					
					
					<tr style="text-align: left">
						<td colspan="5"><label style="color: #9b999a; font-weight: 600; display: inline-block; padding-top: 15px;" for="title-${info.products[i].id}">Komentaras:</label></td>
					</tr>
					<tr style="text-align: left">
						<td colspan="5">
							<textarea style="-webkit-box-sizing: border-box; -moz-box-sizing: border-box; box-sizing: border-box; border: 1px solid #d7d7d7;padding: 5px 10px;line-height: 30px;width: 100%; max-width: 95%;" name="feedbacks[${info.products[i].id}][commentcontent]" id="comment-${info.products[i].id}" rows="5">
							</textarea>
							<input type="hidden" name="feedbacks[${info.products[i].id}][productid]" value="${info.products[i].id}">
						</td>
					</tr>
					<tr>
						<td colspan="5"><hr style="display: block; height: 1px; border: 0; border-top: 1px solid #fff; margin: 1em; padding: 0;"></td>
					</tr>`;

						productsStr += `${info.products[i].name}`;
						if ((i + 1) < info.products.length && info.products.length > 1) {
							productsStr = productsStr + ',';
						}
					}
				}

				/*
				*
				* disabled header
				* ${clientInstance.showheader ?
				 `<tr style="text-align: left">
				 <td colspan="5"><label style="color: #9b999a; font-weight: 600; display: inline-block; padding-top: 15px;" for="title-${info.products[i].id}">Antraštė:</label></td>
				 </tr>
				 <tr style="text-align: left">
				 <td colspan="5"><input style="-webkit-box-sizing: border-box; -moz-box-sizing: border-box; box-sizing: border-box; border: 1px solid #d7d7d7;padding: 5px 10px;line-height: 30px;width: 100%;max-width: 95%;" name="feedbacks[${info.products[i].id}][commentheader]" id="title-${info.products[i].id}" type="text"></td>
				 </tr>`
				 : ''}
				*
				*
				* */

				var formStr = `
					<form action="${apiUrl}/feedbacks/sendfeedback" method="post">
						<input type="hidden" name="clientid" value="${info.client.id}">
						<input type="hidden" name="requestid" value="${info.requestid}">
						<input type="hidden" name="customerid" value="${info.customer.id}">
						<input type="hidden" name="token" value="${authInfo.id}">
						<table style="text-align: center; width: 95%">
							<tr class="logo"><td style="text-align: center; text-align: -moz-center; text-align: -webkit-center;" colspan="5"><img style="display: block;" width="200" height="150" title="logo" alt="logo" src="${clientInstance.logourl}"></td></tr>	
							<tr class="content"><td style="color: #9b999a; font-weight: 600; line-height: 25px;" colspan="5">${emailContent}</td></tr>
							${formProductsFields}
							<tr>
								<td colspan="5"><input style="-webkit-border-radius: 5px;-moz-border-radius: 5px;border-radius: 5px; border: none;padding: 15px 30px; background-color: ${clientInstance.themecolor ? clientInstance.themecolor : '#fa7e28'}; color: white; font-size: 16px; font-weight: 600; letter-spacing: 1.8px;" type="submit" value="Palikti atsiliepimą/-us"></td>
							</tr>
							<tr>
								<td style="padding-top: 15px;" colspan="5"><a style="color: #9b999a; font-weight: 600;" href="${adminUrl}/#/request/${info.requestid}/${authInfo.id}">Jei nematote formos, spauskite čia</a></td>
							</tr>
						</table>
					</form>`;
				var body = `
					<body class="main-wrapper" style="margin-top: 0;margin-bottom: 0;margin-left: 0;margin-right: 0;padding-top: 30px;padding-bottom: 0;padding-left: 0;padding-right: 0;min-width: 100%;background-color: #f5f5f5">
						<div style="padding: 25px 10px; width: 90%; max-width: 600px; border-collapse: separate;border-spacing: 0;margin-left: auto;margin-right: auto; border: 1px solid #EAEAEA; border-radius: 4px; -webkit-border-radius: 4px; -moz-border-radius: 4px; background-color: #ffffff; overflow: hidden;">
							${formStr}
						</div>
					</body>`;
				var html = `
					<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
					<html>
						${body}
					</html>`;
				// console.log(html);
				mailer.sendEmail(info.customer.email, Request.app.get('emailSendFrom'), 'labas', html, clientInstance.mailconfig, (err) => {
					next(err, {message: 'success!', code: 200});
				});
			});
		});
	};
	Request.getForFeedback = (requestid, token, next) => {
		console.log(requestid, token);
		Request.app.models.AccessToken.findById(token, (err, authInfo) => {
			console.log(err);
			console.log(authInfo);
			if (err) {
				return next(err);
			}
			if (!authInfo) {
				let error = new Error();
				error.statusCode = 401;
				error.name = 'Error';
				error.message = 'Authorization Required';
				return next(error);
			}
			const query = {include: ['products', 'customer', 'client']};
			Request.findById(requestid, query, (err, requestInfo) => {
				if (err) {
					return next(err);
				}
				if (!requestInfo) {
					let error = new Error();
					error.statusCode = 404;
					error.message = 'Request not found';
					return next(error);
				}
				if (requestInfo.status != 'sent') {
					let error = new Error();
					error.statusCode = 400;
					error.message = 'Feedback already left';
					error.messageCode = 'FEEDBACK_LEFT';
					error.clientInfo = requestInfo.client();
					console.log(JSON.stringify(error));
					return next(null, error);
				}

				next(null, requestInfo);

				// TODO delete only after feedback submit
				// Request.app.models.AccessToken.deleteById(token, (err, info) => {
				// 	next(err, requestInfo);
				// });
			})
		});
	};

	Request.remoteMethod(
		'getForFeedback',
		{
			http: {path: '/getforfeedback', verb: 'get'},
			// accepts: {},
			returns: {arg: 'requestInfo', root: true, type: 'object'},
			accepts: [
				{arg: 'requestid', type: 'string'},
				{arg: 'token', type: 'string'}
			]
			// returns: { arg: 'totalscore', root: true, type: 'number' }
		}
	);

	Request.remoteMethod(
		'sendFeedbackRequest',
		{
			http: {path: '/sendfeedbackrequest', verb: 'post'},
			// accepts: {},
			returns: {arg: 'message', root: true, type: 'object'},
			accepts: [
				{arg: 'info', type: 'object', http: {source: 'body'}}
			]
			// returns: { arg: 'totalscore', root: true, type: 'number' }
		}
	);
};
