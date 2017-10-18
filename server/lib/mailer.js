var app = require('../server');
module.exports = {
    sendEmail: function (to, from, subject, html, mailSource, next) {
        app.models.Email.attachTo(app.dataSources[mailSource]);
        app.models.Email.send({to: to, from: from, subject: subject, html: html}, (err) => {
            next(err, {status: 200, message: 'Email sent to: ' + to});
        });
    }
};
