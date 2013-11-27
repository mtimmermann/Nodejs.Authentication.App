var Contact = require('../models/Contact'),
    ControllerAuth = require('../shared/controllerauth'),
    $ = require('jquery');

module.exports.controllers = function(app, mongoose) {


    app.get('/contacts', ControllerAuth.requiredAuthentication, function(req, res) {

        var page = getIntParam(req.query.page);
        var pageSize = getIntParam(req.query.pageSize)
        var search = req.query.search;

        if (search) {
            Contact.find({'$or':[
                {'firstName':{'$regex':search, '$options':'i'}},
                {'lastName':{'$regex':search, '$options':'i'}}]},
                function(err, docs) {
                    if (err) throw err;
                    return res.send(JSON.stringify({ data: docs }));
            });

        } else {

            $.when(getCountFunctionDefered()).done(function(count) {

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
                        return Contact.find().sort(sortObj).skip((page-1) * pageSize).limit(pageSize).exec(function(err, docs) {
                            res.send(JSON.stringify({ totalRecords: count, page: page, data: docs }));
                        });
                    }
                    return res.send(JSON.stringify({ totalRecords: count, page: page, data: [] }));
                } else {
                    return Contact.find().sort(sortObj).exec(function(err, docs) {
                        res.send(JSON.stringify({ totalRecords: count, data: docs }));
                    });
                }
            });
        }
    });


    app.get('/contacts/:id', ControllerAuth.requiredAuthentication, function(req, res) {

        Contact.findById(req.params.id, function(err, doc) {
            if (doc) {
                var result = doc.toObject();
                result.id = doc._id;
                delete result._id;
                return res.send(JSON.stringify(result));
            } else if (err) {
                res.statusCode = 500;
                return res.send(JSON.stringify({
                    code: res.statusCode,
                    message: 'Server error',
                    description: 'More details about the error here' }));
            } else {
                res.statusCode = 404;
                return res.send(JSON.stringify({
                    code: res.statusCode,
                    message: 'Error 404: contact not found'}));
            }
        });
    });


    app.put('/contacts/:id', ControllerAuth.requiredAuthentication, function(req, res) {

        var contactObj = req.body;
        contactObj._id = db.ObjectId(req.params.id);
        delete contactObj.id;

        Contact.save(contactObj, function(err, doc) {
            if (err) throw err;
            // if (err || result == null) {
            //     res.statusCode = 500;
            //     return res.send(JSON.stringify({
            //         code: res.statusCode,
            //         message: 'Server error',
            //         description: 'More details about the error here' }));
            if (result !== null && result === 0) {
                res.statusCode = 404;
                return res.send(JSON.stringify({
                    code: res.statusCode,
                    message: 'Error 404: contact not found'}));
            } else {
                var result = doc.toObject();
                result.id = doc._id;
                delete result._id;
                return res.send(JSON.stringify(result));
            }
        });

    });


    app.post('/contacts', ControllerAuth.requiredAuthentication, function(req, res) {
        var contactObj = req.body;
        delete contactObj.id;

        var contact = new Contact(contactObj).save(function (err, doc) {
            if (err) throw err;
            var result = doc.toObject();
            result.id = doc._id;
            delete result._id;
            return res.send(JSON.stringify(result));
        });
    });



    // Helper methods
    function getIntParam(param) {
        if (typeof param === 'string' && (/^\d+$/).test(param)) {
            return parseInt(param, 10);
        }
        return null;
    }

    var getCountFunctionDefered = function() {
        var deferred = $.Deferred();
        Contact.count({}, function(err, count) {
            deferred.resolve(count);
        });
        return deferred.promise();
    }

}