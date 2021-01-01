const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 5 },
    hotels: [{ type: mongoose.Types.ObjectId, required: true, ref: 'Hotel' }],
    reservations: [{ type: mongoose.Types.ObjectId, ref: 'Reservation' }],
    role: { type: String, required: false }
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);