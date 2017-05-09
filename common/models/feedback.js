'use strict';

module.exports = (Feedback) => {
	Feedback.sendFeedback = function (data, next) {
		console.log(data);
		next(null, 'hi');
	};
	Feedback.remoteMethod(
		'sendFeedback',
		{
			description: 'Creates or updates a product or a list of products',
			http: {path: '/sendfeedback', verb: 'post'},
			accepts: {
				arg: 'data',
				type: 'object',
				http: {source: 'body'},
				description: 'An object or array of objects'
			},
			returns: {arg: 'data', type: 'any', root: true}
		}
	);
};
