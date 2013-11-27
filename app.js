// Mongo or Redis session storage
// http://blog.modulus.io/nodejs-and-express-sessions

/*
Module Dependencies 
*/
var express = require('express'),
    http = require('http'),
    path = require('path'),
    mongoose = require('mongoose'),
    hash = require('./pass').hash,
    $ = require('jquery');

var app = express();

/*
Database and Models
*/
mongoose.connect("mongodb://localhost/nodejsauthapp");
var UserSchema = new mongoose.Schema({
    email: String,
    username: String,
    password: String,
    deleted: Boolean,
    salt: String,
    hash: String
});
var User = mongoose.model('users', UserSchema);

var ContactSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email1: String,
    email1_note: String,
    phone1: String,
    phone1_note: String,
    city: String,
    region: String,
    country: String,
    picture: String,
    description: String
});
var Contact = mongoose.model('contacts', ContactSchema);

/*
Middlewares and configurations 
*/
app.configure(function () {
    app.use(express.bodyParser());
    app.use(express.cookieParser('Authentication Tutorial '));
    app.use(express.session());
    app.use(express.static(path.join(__dirname, 'public')));
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
});

app.use(function (req, res, next) {
    var err = req.session.error,
        msg = req.session.success;
    delete req.session.error;
    delete req.session.success;
    res.locals.message = '';
    if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
    if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';
    next();
});
/*
Helper Functions
*/
function authenticate(name, pass, fn) {
    //if (!module.parent) console.log('authenticating %s:%s', name, pass);

    User.findOne({
        username: name
    },

    function (err, user) {
        if (user) {
            if (err) return fn(new Error('cannot find user'));
            hash(pass, user.salt, function (err, hash) {
                if (err) return fn(err);
                if (hash == user.hash) return fn(null, user);
                fn(new Error('invalid password'));
            });
        } else {
            return fn(new Error('cannot find user'));
        }
    });

}

function requiredAuthentication(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        var errorDescription = 'Access denied';
        req.session.error = errorDescription;
        res.statusCode = 403;
        return res.send(JSON.stringify({
            code: res.statusCode,
            message: 'Not Authorized',
            description: errorDescription }));
        //res.redirect('/login');
    }
}

function userExist(req, res, next) {
    User.count({
        username: req.body.username
    }, function (err, count) {
        if (count === 0) {
            next();
        } else {
            req.session.error = "User Exist"
            res.redirect("/signup");
        }
    });
}

/*
Routes
*/
// app.get("/", function (req, res) {

//     if (req.session.user) {
//         res.send("Welcome " + req.session.user.username + "<br>" + "<a href='/logout'>logout</a>");
//     } else {
//         res.send("<a href='/login'> Login</a>" + "<br>" + "<a href='/signup'> Sign Up</a>");
//     }
// });

// app.get("/signup", function (req, res) {
//     if (req.session.user) {
//         res.redirect("/");
//     } else {
//         res.render("signup");
//     }
// });

app.post("/registration", userExist, function (req, res) {
    var password = req.body.password;
    var username = req.body.username;

    hash(password, function (err, salt, hash) {
        if (err) throw err;
        var user = new User({
            username: username,
            deleted: false,
            salt: salt,
            hash: hash,
        }).save(function (err, newUser) {
            if (err) throw err;
            authenticate(newUser.username, password, function(err, user) {
                if(user) {
                    req.session.regenerate(function(){
                        req.session.user = user;
                        req.session.success = 'Authenticated as ' + user.username;// + ' click to <a href="/logout">logout</a>. ' + ' You may now access <a href="/restricted">/restricted</a>.';
                        //res.redirect('/');
                        return res.send(JSON.stringify({
                            IsSuccess: true }));
                    });
                }
            });
        });
    });
});

// app.get("/login", function (req, res) {
//     res.render("login");
// });

app.post("/login", function (req, res) {
    authenticate(req.body.username, req.body.password, function (err, user) {
        if (user) {
            req.session.regenerate(function () {
                req.session.user = user;
                req.session.success = 'Authenticated as ' + user.username;// + ' click to <a href="/logout">logout</a>. ' + ' You may now access <a href="/restricted">/restricted</a>.';
                //res.redirect('/');
                return res.send(JSON.stringify({ IsSuccess: true }));
            });
        } else {
            var errorDescription = 'Authentication failed, please check your username and password.';
            req.session.error = errorDescription;
            res.statusCode = 401;
            return res.send(JSON.stringify({
                code: res.statusCode,
                message: 'Not Authorized',
                description: errorDescription }));

            //req.session.error = 'Authentication failed, please check your ' + ' username and password.';
            //res.redirect('/login');
        }
    });
});

app.get('/logout', function (req, res) {
    req.session.destroy(function () {
        //res.redirect('/');
        return res.send(JSON.stringify({ IsSuccess: true }));
    });
});

//app.get('/contacts', function(req, res) {
app.get('/contacts', requiredAuthentication, function(req, res) {
    res.send(JSON.stringify({
        totalRecords: 0,
        data: []
    }));
});

//app.post('/contacts', function(req, res) {
app.post('/contacts', requiredAuthentication, function(req, res) {
    var contactObj = req.body;
    delete contactObj.id;

    var contact = new Contact(contactObj).save(function (err, doc) {
        if (err) throw err;
        contactObj = $.extend(contactObj, { id: doc._id });
        return res.send(JSON.stringify(contactObj));
    });
});


// app.get('/profile', requiredAuthentication, function (req, res) {
//     res.send('Profile page of '+ req.session.user.username +'<br>'+' click to <a href="/logout">logout</a>');
// });


//http.createServer(app).listen(3000);
http.createServer(app).listen(8003);