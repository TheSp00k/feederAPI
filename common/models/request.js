'use strict';

module.exports = (Request) => {
	Request.sendFeedbackRequest = (next) => {
		var mailer = require('../../server/lib/mailer');
		var emailHtml =
			`<h1>labas</h1>
			<form action="http://localhost:3000/api/feedbacks" method="post">
				<div>
					<label for="title">Antraštė</label>
					<input name="commentheader" id="title" type="text">
				</div>
				<div>
					<label for="comment">Komentaras</label>
					<textarea name="commentcontent" id="comment" cols="30" rows="10"></textarea>
				</div>
				<input type="hidden" name="id" value="0">
				<div>
					<input type="submit" value="Siųsti">
				</div>
			</form>`;
		mailer.sendEmail('kiesha192@gmail.com', Feedback.app.get('emailSendFrom'), 'labas', emailHtml, (err) => {
			next(err, {message: 'success!', code: 200});
		});
	};
	Request.remoteMethod(
		'sendFeedbackRequest',
		{
			http: {path: '/sendfeedbackrequest', verb: 'get'},
			// accepts: {},
			returns: {arg: 'message', root: true, type: 'object'}
			// accepts: [
			// 	{ arg: 'productid', type: 'string' }
			// ],
			// returns: { arg: 'totalscore', root: true, type: 'number' }
		}
	);
};
