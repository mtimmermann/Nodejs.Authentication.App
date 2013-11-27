var mongoose = require('mongoose');

//module.exports.models = function(app, mongoose) {

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