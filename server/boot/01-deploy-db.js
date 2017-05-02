/**
 * Updates DB schema to latest on Server start. Update SQL scripts resides in <root>/server/db directory.
 * To create new schema update, just create SQL file in "<root>/server/db" naming it like this:
 * <version>-<description>.sql
 *
 * More info: https://github.com/fixiecoder/node-mysql-script-deploy
 */
module.exports = function (app) {
    var path = require('path');

    var scriptDeploy = require('mysql-script-deploy');
    var db = app.dataSources.api.settings;

    var options = {
        host: db.host,
        port: db.port,
        user: db.user,
        password: db.password,
        database: db.database,
        schemaLocation: path.join(__dirname, '../db'),
        routinesLocation: path.join(__dirname, '../db/routines'),
        disableLocking: false,
    };

    scriptDeploy(options, (err) => {
        if (err) throw err;
    });
};
