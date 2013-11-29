var mongoose = require('mongoose');

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
var Contact = mongoose.model('contacts', ContactSchema);

module.exports = Contact;