var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    email: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    deleted: Boolean,
    salt: String,
    hash: String
});
var User = mongoose.model('users', UserSchema);

module.exports = User;