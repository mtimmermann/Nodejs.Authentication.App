var winston = require('winston');

// https://github.com/flatiron/winston
// http://docs.nodejitsu.com/articles/intermediate/how-to-log

// Log levels
// https://github.com/flatiron/winston/blob/master/lib/winston/config/npm-config.js
// npmConfig.levels = {
//   silly: 0,
//   debug: 1,
//   verbose: 2,
//   info: 3,
//   warn: 4,
//   error: 5
// };

//require('winston-riak').Riak;
//require('winston-mongo').Mongo;

var logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console({ level: 'info' }),
        new winston.transports.File({ filename: 'logs/application.log', level: 'info' })
        //new winston.transports.Couchdb({ 'host': 'localhost', 'db': 'logs' })
        //new winston.transports.Riak({ bucket: 'logs' })
        //new winston.transports.MongoDB({ db: 'nodejsauthapp_logs', level: 'info'})
    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' })
    ]
});

module.exports = logger;
