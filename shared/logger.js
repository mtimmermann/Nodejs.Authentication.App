var winston = require('winston'),
    logLevel = require('../config/application.config').logging.level;

//require('winston-riak').Riak;
require('winston-mongodb').Mongo;

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


var logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console({ level: logLevel }),
        //new winston.transports.File({ filename: 'logs/application.log', level: logLevel, maxsize: 20000 }),
        new winston.transports.DailyRotateFile({
            filename: 'logs/application.log',
            datePattern: '.yyyy-MM-dd',
            maxsize: 20000,
            maxFiles: 20,
            level: logLevel
        }),
        //new winston.transports.Couchdb({ 'host': 'localhost', 'db': 'logs' })
        //new winston.transports.Riak({ bucket: 'logs' })
        new winston.transports.MongoDB({ db: 'nodejsauthapp_logs', level: logLevel })
    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' })
    ]
});


module.exports = logger;
