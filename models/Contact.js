var mongoose = require('mongoose'),
    ModelValidation = require('../shared/model_validation');

var ContactSchema = new mongoose.Schema({
    ownerId: String, // User id
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email1: { type: String, required: true },
    email1_note: String,
    phone1: String,
    phone1_note: String,
    city: String,
    region: String,
    country: String,
    picture: String,
    description: String
});

ContactSchema.path('email1').validate(function (email1) {
    return ModelValidation.isEmailValid(email);
}, 'Invalid email');

var Contact = mongoose.model('contacts', ContactSchema);

module.exports = Contact;