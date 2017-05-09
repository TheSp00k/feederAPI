'use strict';

module.exports = (Request) => {
	Request.sendFeedbackRequest = (info, next) => {

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
			let mailer = require('../../server/lib/mailer');
			let emailContent = `Ačiū, kad pirkote ${clientInstance.name} parduotuvėje šiuos produktus: `;


			let css = `
		<style type="text/css">
			* [lang~="x-star-wrapper"]:hover *[lang~="x-star-number"]{
				color: #119da2 !important;
				border-color: #119da2 !important;
			}
		
			* [lang~="x-star-wrapper"]:hover *[lang~="x-full-star"],
			* [lang~="x-star-wrapper"]:hover ~ *[lang~="x-star-wrapper"] *[lang~="x-full-star"] {
			  display : block !important;
			  width : auto !important;
			  overflow : visible !important;
			  float : none !important;
			  margin-top: -1px !important;
			}
		
			* [lang~="x-star-wrapper"]:hover *[lang~="x-empty-star"],
			* [lang~="x-star-wrapper"]:hover ~ *[lang~="x-star-wrapper"] *[lang~="x-empty-star"] {
			  display : block !important;
			  width : 0 !important;
			  overflow : hidden !important;
			  float : left !important;
			  height: 0 !important;
			}
		</style>
		`;

			let css2 = `
		<style type="text/css">
			@-ms-viewport {
				width: device-width;
			}
			body {
				margin: 0;
				padding: 0;
				min-width: 100%;
			}
			table {
				border-collapse: collapse;
				border-spacing: 0;
			}
			td {
				vertical-align: top;
			}
			img {
				border: 0;
				-ms-interpolation-mode: bicubic;
				max-width: 100% !important;
				height: auto;
			}
			a {
				text-decoration: none;
				color: #119da2;
			}
			a:hover {
				text-decoration: underline;
			}
		
			*[class=main-wrapper],
			*[class=main-content]{
				min-width: 0 !important;
				width: 600px !important;
				margin: 0 auto !important;
			}
			*[class=rating] {
			  unicode-bidi: bidi-override;
			  direction: rtl;
			}
			*[class=rating] > *[class=star] {
			  display: inline-block;
			  position: relative;
			  text-decoration: none;
			}
		
			@media (max-width: 621px) {
				* {
					box-sizing: border-box;
					-moz-box-sizing: border-box;
					-webkit-box-sizing: border-box;
					-o-box-sizing: border-box;
				}
				table {
					min-width: 0 !important;
					width: 100% !important;
				}
				*[class=body-copy] {
					padding: 0 10px !important;
				}
				*[class=main-wrapper],
				*[class=main-content]{
					min-width: 0 !important;
					width: 320px !important;
					margin: 0 auto !important;
				}
				*[class=ms-sixhundred-table] {
					width: 100% !important;
					display: block !important;
					float: left !important;
					clear: both !important;
				}
				*[class=content-padding] {
					padding-left: 10px !important;
					padding-right: 10px !important;
				}
				*[class=bottom-padding]{
					margin-bottom: 15px !important;
					font-size: 0 !important;
					line-height: 0 !important;
				}
				*[class=top-padding] {
					display: none !important;
				}
				*[class=hide-mobile] {
					display: none !important;
				}
				
		
				/* Prevent hover effects so double click issue doesn't happen on mobile devices */
				* [lang~="x-star-wrapper"]:hover *[lang~="x-star-number"]{
					color: #AEAEAE !important;
					border-color: #FFFFFF !important;
				}
				* [lang~="x-star-wrapper"]{
					pointer-events: none !important;
				}
				* [lang~="x-star-divbox"]{
					pointer-events: auto !important;
				}
				*[class=rating] *[class="star-wrapper"] a div:nth-child(2),
				*[class=rating] *[class="star-wrapper"]:hover a div:nth-child(2),
				*[class=rating] *[class="star-wrapper"] ~ *[class="star-wrapper"] a div:nth-child(2){
				  display : none !important;
				  width : 0 !important;
				  height: 0 !important;
				  overflow : hidden !important;
				  float : left !important;
				}
				*[class=rating] *[class="star-wrapper"] a div:nth-child(1),
				*[class=rating] *[class="star-wrapper"]:hover a div:nth-child(1),
				*[class=rating] *[class="star-wrapper"] ~ *[class="star-wrapper"] a div:nth-child(1){
				  display : block !important;
				  width : auto !important;
				  overflow : visible !important;
				  float : none !important;
				}
			}
		</style>`;
			let header = `${css} ${css2}`;
			let productsStr = '';
			let formProductsFields = '';
			let rating = '';

			for (let i = 0; i < info.products.length; i++) {
				if (info.products[i].name) {
					rating = `
	<table style="border-collapse: collapse;border-spacing: 0;display: table;table-layout: fixed; margin: 0 auto; -webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;text-rendering: optimizeLegibility;background-color: #f5f5f5; width: 100%;">
        <tbody>
            <tr>
                <td style="padding: 0;vertical-align: top; width: 100%;" class="">
                    <center>
					<!--[if gte mso 11]>
					 <center>
					 <table><tr><td class="ms-sixhundred-table" width="600">
					<![endif]-->

                        <table class="main-content" style="background-color: #ffffff;" width="600">
                            <tbody>
                                <tr>
                                    <td style="padding: 0;vertical-align: top;">
                                        <table class="main-content" style="border-collapse: collapse;border-spacing: 0;margin-left: auto;margin-right: auto;width: 100%; max-width: 600px;">
                                            <tbody>
                                                <tr>
                                                    <td style="padding: 0;vertical-align: top;text-align: left">
                                                        <table class="contents" style="border-collapse: collapse;border-spacing: 0;width: 100%;">
                                                            <tbody>
                                                                <tr>
                                                                    <td class="content-padding" style="padding: 0;vertical-align: top">
                                                                        <div style="margin-bottom: 0px; line-height: 30px; font-size: 30px;">&nbsp;</div>
                                                                        <div class="body-copy" style="margin: 0;">

                                                                            <div style="margin: 0;color: #60666d;font-size: 50px;font-family: sans-serif;line-height: 20px; text-align: left;">
                                                                                <div class="bottom-padding" style="margin-bottom: 0px; line-height: 15px; font-size: 15px;">&nbsp;</div>
                                                                                <div style="text-align: center; margin: 0; font-size: 10px;  text-transform: uppercase; letter-spacing: .5px;">Rating (select a star amount):</div>
                                                                                <div class="bottom-padding" style="margin-bottom: 0px; line-height: 7px; font-size: 7px;">&nbsp;</div>
                                                                                <div style="width: 100%; text-align: center; float: left;">
                                                                                    <div class="rating" style="text-align: center; margin: 0; font-size: 50px; width: 275px; margin: 0 auto; margin-top: 10px;">
                                                                                        <table style="border-collapse: collapse;border-spacing: 0;width: 275px; margin: 0 auto; font-size: 50px; direction: rtl;" dir="rtl">
                                                                                            <tbody><tr>
                                                                                                <td style="padding: 0;vertical-align: top;" width="55" class="star-wrapper" lang="x-star-wrapper">
                                                                                                    <label for="rating-${info.products[i].id}-5" style="display: block; text-align: center; float: left;width: 55px;overflow: hidden;line-height: 60px;">
                                                                                                        <div class="star" target="_blank" lang="x-star-divbox" style="cursor: pointer; color: #FFCC00; text-decoration: none; display: inline-block;height: 50px;width: 55px;overflow: hidden;line-height: 60px;" tabindex="1">
                                                                                                            <div lang="x-empty-star" style="margin: 0;display: inline-block;">☆</div>
                                                                                                            <div lang="x-full-star" style="margin: 0;display: inline-block; width:0; overflow:hidden;float:left; display:none; height: 0; max-height: 0;">★</div>
                                                                                                        </div>
                                                                                                        <input type="radio" id="rating-${info.products[i].id}-5" name="ratings[${info.products[i].id}]" value="5">
                                                                                                        <div class="star-number" target="_blank" lang="x-star-number" style="cursor: pointer; font-family: sans-serif;color: #AEAEAE; font-size: 14px; line-height: 14px; text-decoration: none; display: block;height: 50px;width: 55px;overflow: hidden;line-height: 60px;border-bottom: 3px solid #FFFFFF; text-align: center;">5</div>
                                                                                                    </label>
                                                                                                </td>
                                                                                                <td style="padding: 0;vertical-align: top" width="55" class="star-wrapper" lang="x-star-wrapper">
                                                                                                    <label for="rating-${info.products[i].id}-4" style="display: block; text-align: center; float: left;width: 55px;overflow: hidden;line-height: 60px;">
                                                                                                        <div class="star" target="_blank" lang="x-star-divbox" style="cursor: pointer; color: #FFCC00; text-decoration: none; display: inline-block;height: 50px;width: 55px;overflow: hidden;line-height: 60px;" tabindex="2">
                                                                                                            <div lang="x-empty-star" style="margin: 0;display: inline-block;">☆</div>
                                                                                                            <div lang="x-full-star" style="margin: 0;display: inline-block; width:0; overflow:hidden;float:left; display:none; height: 0; max-height: 0;">★</div>
                                                                                                        </div>
                                                                                                        <input type="radio" id="rating-${info.products[i].id}-4" name="ratings[${info.products[i].id}]" value="4">
                                                                                                        <div class="star-number" target="_blank" lang="x-star-number" style="cursor: pointer; font-family: sans-serif;color: #AEAEAE; font-size: 14px; line-height: 14px; text-decoration: none; display: block;height: 50px;width: 55px;overflow: hidden;line-height: 60px;border-bottom: 3px solid #FFFFFF; text-align: center;">4</div>
                                                                                                    </label>
                                                                                                </td>
                                                                                                <td style="padding: 0;vertical-align: top" width="55" class="star-wrapper" lang="x-star-wrapper">
                                                                                                    <label for="rating-${info.products[i].id}-3" style="display: block; text-align: center; float: left;width: 55px;overflow: hidden;line-height: 60px;">
                                                                                                        <div class="star" target="_blank" lang="x-star-divbox" style="cursor: pointer; color: #FFCC00; text-decoration: none; display: inline-block;height: 50px;width: 55px;overflow: hidden;line-height: 60px;" tabindex="3">
                                                                                                            <div lang="x-empty-star" style="margin: 0;display: inline-block;">☆</div>
                                                                                                            <div lang="x-full-star" style="margin: 0;display: inline-block; width:0; overflow:hidden;float:left; display:none; height: 0; max-height: 0;">★</div>
                                                                                                        </div>
                                                                                                        <input type="radio" id="rating-${info.products[i].id}-3" name="ratings[${info.products[i].id}]" value="3">
                                                                                                        <div class="star-number" target="_blank" lang="x-star-number" style="cursor: pointer; font-family: sans-serif;color: #AEAEAE; font-size: 14px; line-height: 14px; text-decoration: none; display: block;height: 50px;width: 55px;overflow: hidden;line-height: 60px;border-bottom: 3px solid #FFFFFF; text-align: center;">3</div>
                                                                                                    </label>
                                                                                                </td>
                                                                                                <td style="padding: 0;vertical-align: top" width="55" class="star-wrapper" lang="x-star-wrapper">
                                                                                                    <label for="rating-${info.products[i].id}-2" style="display: block; text-align: center; float: left;width: 55px;overflow: hidden;line-height: 60px;">
                                                                                                        <div class="star" target="_blank" lang="x-star-divbox" style="cursor: pointer; color: #FFCC00; text-decoration: none; display: inline-block;height: 50px;width: 55px;overflow: hidden;line-height: 60px;" tabindex="4">
                                                                                                            <div lang="x-empty-star" style="margin: 0;display: inline-block;">☆</div>
                                                                                                            <div lang="x-full-star" style="margin: 0;display: inline-block; width:0; overflow:hidden;float:left; display:none; height: 0; max-height: 0;">★</div>
                                                                                                        </div>
                                                                                                        <input type="radio" id="rating-${info.products[i].id}-2" name="ratings[${info.products[i].id}]" value="2">
                                                                                                        <div class="star-number" target="_blank" lang="x-star-number" style="cursor: pointer; font-family: sans-serif;color: #AEAEAE; font-size: 14px; line-height: 14px; text-decoration: none; display: block;height: 50px;width: 55px;overflow: hidden;line-height: 60px;border-bottom: 3px solid #FFFFFF; text-align: center;">2</div>
                                                                                                    </label>
                                                                                                </td>
                                                                                                <td style="padding: 0;vertical-align: top" width="55" class="star-wrapper" lang="x-star-wrapper">
                                                                                                    <label for="rating-${info.products[i].id}-1" style="display: block; text-align: center; float: left;width: 55px;overflow: hidden;line-height: 60px;">
                                                                                                        <div class="star" target="_blank" lang="x-star-divbox" style="color: #FFCC00; cursor: pointer; text-decoration: none; display: inline-block;height: 50px;width: 55px;overflow: hidden;line-height: 60px;" tabindex="5">
                                                                                                            <div lang="x-empty-star" style="margin: 0;display: inline-block;">☆</div>
                                                                                                            <div lang="x-full-star" style="margin: 0;display: inline-block; width:0; overflow:hidden;float:left; display:none; height: 0; max-height: 0;">★</div>
                                                                                                        </div>
                                                                                                        <input type="radio" id="rating-${info.products[i].id}-1" name="ratings[${info.products[i].id}]" value="1">
                                                                                                        <div class="star-number" target="_blank" lang="x-star-number" style="cursor: pointer; font-family: sans-serif;color: #AEAEAE; font-size: 14px; line-height: 14px; text-decoration: none; display: block;height: 50px;width: 55px;overflow: hidden;line-height: 60px;border-bottom: 3px solid #FFFFFF; text-align: center;">1</div>
                                                                                                    </label>
                                                                                                </td>
                                                                                            </tr>
                                                                                        </tbody></table>
                                                                                    </div>
                                                                                </div>
                                                                                <div style="margin-bottom: 0px; line-height: 30px; font-size: 30px;">&nbsp;</div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                        <!--[if gte mso 11]>
						 </td></tr></table>
						 </center>
						<![endif]-->
                    </center>
                </td>
            </tr>
        </tbody>
    </table>
				`;
					formProductsFields += `
					<div>
						${rating}
					</div>
					<div>
						<label for="title-${info.products[i].id}">Antraštė</label>
						<input name="title-${info.products[i].id}" id="title-${info.products[i].id}" type="text">
					</div>
					<div>
						<label for="comment-${info.products[i].id}">Komentaras</label>
						<textarea name="comment-${info.products[i].id}" id="comment-${info.products[i].id}" cols="30" rows="10"></textarea>
					</div>
					<hr style="display: block; height: 1px; border: 0; border-top: 1px solid #ccc; margin: 2em 1em 0 1em; padding: 0;">`;
					productsStr += `${info.products[i].name}`;
					if ((i + 1) < info.products.length && info.products.length > 1) {
						productsStr = productsStr + ',';
					}
				}
			}
			var formStr = `<form action="http://localhost:3000/api/feedbacks/sendfeedback" method="post">
			<input type="hidden" name="clientid" value="${info.client.id}">
			<input type="hidden" name="customerid" value="${info.customer.id}">
			${formProductsFields}
			<input type="submit" value="Siūsti">
			</form>`;
			var body = `
		<body class="main-wrapper" style="margin-top: 0;margin-bottom: 0;margin-left: 0;margin-right: 0;padding-top: 0;padding-bottom: 0;padding-left: 0;padding-right: 0;min-width: 100%;background-color: #f5f5f5">
			<div style="width: 100%; max-width: 600px; border-collapse: separate;border-spacing: 0;margin-left: auto;margin-right: auto; border: 1px solid #EAEAEA; border-radius: 4px; -webkit-border-radius: 4px; -moz-border-radius: 4px; background-color: #ffffff; overflow: hidden;">
				${emailContent}
				${formStr}
			</div>

		</body>`;
			var html = `
		<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
		<html>
		${header}
		${body}
		</html>
		`;
			// console.log(html);
			mailer.sendEmail('kiesha192@gmail.com', Request.app.get('emailSendFrom'), 'labas', html, (err) => {
				next(err, {message: 'success!', code: 200});
			});
		});
	};
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
