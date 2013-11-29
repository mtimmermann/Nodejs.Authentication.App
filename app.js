// Mongo or Redis session storage
// http://blog.modulus.io/nodejs-and-express-sessions

// MVC w/ node & express
// http://timstermatic.github.io/blog/2013/08/17/a-simple-mvc-framework-with-node-and-express/

/**
 * External Module Dependencies 
 */
var express = require('express'),
    http = require('http'),
    path = require('path'),
    mongoose = require('mongoose'),
    MongoSessionStore = require('connect-mongo')(express),
    fs = require('fs');

/**
 * Internal Module Dependencies 
 */
var settings = require('./config/application.config').application,
    logger = require('./shared/logger');


var app = express();

mongoose.connect(settings.db.url);


/**
 * Middlewares and configurations 
 */
app.configure(function () {
    app.use(express.bodyParser());
    app.use(express.cookieParser('Contacts App'));
    app.use(express.session({
        store: new MongoSessionStore({
            url: settings.db.url
        }),
        secret: '1234567890QWERTY'
    }));

    // app.use(express.static(path.join(__dirname, 'public')));
    // app.set('views', __dirname + '/views');
    // app.set('view engine', 'jade');
});

app.use(function (req, res, next) {
    var err = req.session.error,
        msg = req.session.success;
    delete req.session.error;
    delete req.session.success;
    res.locals.message = '';
    if (err) res.locals.message = err;
    if (msg) res.locals.message = msg;
    next();
});


/**
 * Dynamically include controller routes
 */
fs.readdirSync('./controllers').forEach(function (file) {
    if (file.substr(-3) === '.js') {
        route = require('./controllers/'+ file);
        route.controllers(app);
    }
});


logger.log('info', 'Starting server on port: '+ settings.port);

http.createServer(app).listen(settings.port);
