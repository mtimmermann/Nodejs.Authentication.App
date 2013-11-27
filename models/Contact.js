var mongoose = require('mongoose');

var ContactSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email1: String,
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