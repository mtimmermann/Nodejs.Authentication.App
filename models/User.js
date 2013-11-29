var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    email: String,
    firstName: String,
    lastName: String,
    password: String,
    deleted: Boolean,
    salt: String,
    hash: String
});
var User = mongoose.model('users', UserSchema);

module.exports = User;