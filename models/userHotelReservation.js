const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const reservationSchema = new Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    description: { type: String, required: true },
    hotel: { type: mongoose.Types.ObjectId, required: true, ref: 'Hotel' },
    user: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    deluxe_user_pick: { type: Number, required: true },
    deluxePrice: { type: Number, required: true },
    standard_user_pick: { type: Number, required: true },
    standardPrice: { type: Number, required: true },
    suites_user_pick: { type: Number, required: true },
    suitesPrice: { type: Number, required: true },
    totalPayment: { type: Number, required: true }
});

module.exports = mongoose.model('Reservation', reservationSchema);