const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const reservationSchema = new Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    description: { type: String, required: true },
    hotel: { type: mongoose.Types.ObjectId, required: true, ref: 'Hotel' },
    user: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    deluxe_user_pick: { type: Number, required: true, min: 0 },
    deluxePrice: { type: Number, required: true, min: 0 },
    standard_user_pick: { type: Number, required: true, min: 0 },
    standardPrice: { type: Number, required: true, min: 0 },
    suites_user_pick: { type: Number, required: true, min: 0 },
    suitesPrice: { type: Number, required: true, min: 0 },
    totalPayment: { type: Number, required: true, min: 0 }
});

module.exports = mongoose.model('Reservation', reservationSchema);