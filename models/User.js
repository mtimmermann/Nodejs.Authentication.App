
var mongoose = require('mongoose');
//    hash = require('../pass').hash;

//module.exports.models = function(app, mongoose) {

    //mongoose.connect("mongodb://localhost/nodejsauthapp");
    var UserSchema = new mongoose.Schema({
        email: String,
        username: String,
        password: String,
        deleted: Boolean,
        salt: String,
        hash: String
    });
    var User = mongoose.model('users', UserSchema);

    module.exports = User;
//}