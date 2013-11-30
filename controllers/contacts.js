var Contact = require('../models/Contact'),
    ControllerAuth = require('../shared/controller_auth'),
    errorHandler = require('../shared/controller_error_handler').errorHandler,
    fs = require('fs'),
    $ = require('jquery');

module.exports.controllers = function(app) {

    app.get('/contacts', ControllerAuth.authorize, function(req, res) {

        var page = getIntParam(req.query.page);
        var pageSize = getIntParam(req.query.pageSize)
        var search = req.query.search;

        if (search) {
            Contact.find(
                {
                    ownerId: req.session.user._id,
                    '$or':[
                        {'firstName':{'$regex':search, '$options':'i'}},
                        {'lastName':{'$regex':search, '$options':'i'}}]
                },
                function(err, docs) {
                    if (err) { return errorHandler(req, res, err); }
                    res.send(JSON.stringify({ data: docs }));
            });
        } else {
            $.when(getCountFunctionDefered(req.session.user._id)).done(function(count) {

                var sortBy = req.query.sort_by ? req.query.sort_by : 'lastName';
                var argOrder = req.query.order ? req.query.order : 'asc';
                var sortOrder = argOrder === 'desc' ? -1 : 1;
                var sortObj = {};
                sortObj[sortBy] = sortOrder;

                if (page && pageSize) {
                    var top = (page -1) * pageSize;
                    var start = top - pageSize;
                    if (start < count) {

                        // Note, the following sytax is used w/ Mongojs
                        // TODO: Determine how to ingore case with sort
                        // return db.contacts.find().sort(sortObj).skip((page-1) * pageSize).limit(pageSize, function(err, docs) {
                        //     res.send(JSON.stringify({ totalRecords: count, page: page, data: docs }));
                        // });

                        // TODO: Determine how to ingore case with sort
                        //return Contact.find().sort(sortObj).skip((page-1) * pageSize).limit(pageSize).exec(function(err, docs) {
                        return Contact.find({ ownerId: req.session.user._id }).sort(sortObj).skip((page-1) * pageSize).limit(pageSize).exec(function(err, docs) {
                            res.send(JSON.stringify({ totalRecords: count, page: page, data: docs }));
                        });
                    }
                    res.send(JSON.stringify({ totalRecords: count, page: page, data: [] }));
                } else {
                    return Contact.find({ ownerId: req.session.user._id }).sort(sortObj).exec(function(err, docs) {
                        res.send(JSON.stringify({ totalRecords: count, data: docs }));
                    });
                }
            });
        }
    });

    app.get('/contacts/:id', ControllerAuth.authorize, function(req, res) {

        Contact.findById(req.params.id, function(err, doc) {
            if (err) { return errorHandler(req, res, err); }
            if (doc) {
                if (doc.ownerId === req.session.user._id) {
                    var result = doc.toObject();
                    result.id = doc._id;
                    delete result._id;
                    res.send(JSON.stringify(result));
                } else {
                    res.statusCode = 403;
                    res.send(JSON.stringify({
                        code: res.statusCode,
                        message: 'Not Authorized'}));
                }
            // } else if (err) {
            //     res.statusCode = 500;
            //     return res.send(JSON.stringify({
            //         code: res.statusCode,
            //         message: 'Server error',
            //         description: 'More details about the error here' }));
            } else {
                res.statusCode = 404;
                return res.send(JSON.stringify({
                    code: res.statusCode,
                    message: 'Error 404: contact not found'}));
            }
        });
    });

    app.put('/contacts/:id', ControllerAuth.authorize, function(req, res) {

        var contactObj = req.body;
        delete contactObj.id;

        Contact.findById(req.params.id, function(err, contact) {
            if (err) { return errorHandler(req, res, err); }
            if (!contact) {
                res.statusCode = 404;
                res.send(JSON.stringify({
                    code: res.statusCode,
                    message: 'Error 404: contact not found'
                }));
            }
            if (contact.ownerId === req.session.user._id) {
                // Using Schema.save, not Schema.findByIdAndUpdate as only save
                //  executes Schema.pre('save')
                // Mongoose issue: pre, post middleware are not executed on findByIdAndUpdate
                // https://github.com/LearnBoost/mongoose/issues/964
                //Contact.findByIdAndUpdate(req.params.id, contactObj, { new: true }, function(err, doc) {
                contact = $.extend(contact, contactObj);
                contact.save(function(err, doc) {
                    if (err) { return errorHandler(req, res, err); }
                    var result = doc.toObject();
                    result.id = doc._id;
                    delete result._id;
                    res.send(JSON.stringify(result));
                });
            } else {
                // User does not own contact, not authorized
                res.statusCode = 403;
                res.send(JSON.stringify({
                    code: res.statusCode,
                    message: 'Not Authorized'
                }));
            }
        });
    });

    app.post('/contacts', ControllerAuth.authorize, function(req, res) {
        var contactObj = req.body;
        delete contactObj.id;
        contactObj.ownerId = req.session.user._id;

        var contact = new Contact(contactObj).save(function (err, doc) {
            if (err) { return errorHandler(req, res, err); }
            var result = doc.toObject();
            result.id = doc._id;
            delete result._id;
            res.send(JSON.stringify(result));
        });
    });

    app.delete('/contacts/:id', ControllerAuth.authorize, function(req, res) {

        Contact.findById(req.params.id, function(err, doc) {
            if (err) { return errorHandler(req, res, err); }
            if (!doc) {
                res.statusCode = 404;
                res.send(JSON.stringify({
                    code: res.statusCode,
                    message: 'Error 404: contact not found'
                }));
            }
            if (doc.ownerId === req.session.user._id) {
                Contact.findByIdAndRemove(req.params.id, function(err, result) {
                    if (err) { return errorHandler(req, res, err); }
                    res.send(JSON.stringify({ IsSuccess: true }));
                });
            } else {
                // User does not own contact, not authorized
                res.statusCode = 403;
                res.send(JSON.stringify({
                    code: res.statusCode,
                    message: 'Not Authorized'
                }));
            }
        });
    });

    app.post('/uploader', ControllerAuth.authorize, function(req, res) {
        var path = 'pics/'+ req.session.user._id +'/';

        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }

        // http://markdawson.tumblr.com/post/18359176420/asynchronous-file-uploading-using-express-and-node-js
        require('fs').rename(
            req.files.file.path,
            path + req.files.file.name,
            function(error) {
                if (error) {
                    console.log(error);
                    res.statusCode = 500;
                    res.json({
                        code: res.statusCode,
                        message: 'Uploading process failed'
                    });
                } else {
                    res.json({
                        IsSuccess: true,
                        path: path + req.files.file.name
                    });
                }
            }
        );
    });


    /**
     * Helper methods
     */
    function getIntParam(param) {
        if (typeof param === 'string' && (/^\d+$/).test(param)) {
            return parseInt(param, 10);
        }
        return null;
    }

    function getCountFunctionDefered(userId) {
        var deferred = $.Deferred();
        Contact.count({ ownerId: userId }, function(err, count) {
            deferred.resolve(count);
        });
        return deferred.promise();
    }

}