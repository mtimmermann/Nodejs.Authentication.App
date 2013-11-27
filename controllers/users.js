var User = require('../models/User'),
    ControllerAuth = require('../shared/controllerauth'),
    hash = require('../shared/pass').hash;

module.exports.controllers = function(app, mongoose) {

    app.get('/user', ControllerAuth.requiredAuthentication, function(req, res) {
        return User.findById(req.session.user._id, function(err, doc) {
            if (err) throw err;
            var result = doc.toObject();
            result.id = doc._id;
            delete result._id;
            delete result.salt;
            delete result.hash;
            res.send(JSON.stringify(result));
        });
    });

    app.post("/register", userExist, function (req, res) {
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


    // Helper methods
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

}