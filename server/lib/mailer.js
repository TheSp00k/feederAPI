var app = require('../server');
module.exports = {
    sendEmail: function (to, from, subject, html, next) {
        app.models.Email.send({to: to, from: from, subject: subject, html: html},
            (err) => {
                if (err) {
                    return next(err);
                }
            next(null, {status: 200, message: 'Email sent to: ' + to});
        });
    },
};
