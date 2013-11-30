var mongoose = require('mongoose'),
	timestamp = require('../shared/models/timestamp'),
    ModelValidation = require('../shared/model_validation');

var UserSchema = new mongoose.Schema({
    email: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    deleted: Boolean,
    salt: String,
    hash: String
});

UserSchema.path('email').validate(function (email) {
    return ModelValidation.isEmailValid(email);
}, 'Invalid email');

UserSchema.plugin(timestamp);
var User = mongoose.model('users', UserSchema);

module.exports = User;