const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const hotelSchema = new Schema({
    image: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    description: { type: String, required: true },
    location: {
        lat: {type: Number, required: true},
        lng: {type: Number, required: true }
    },
    creator: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    deluxeNumOfRooms: { type: Number, required: true },
    deluxePrice: { type: Number, required: true },
    standardNumOfRooms: { type: Number, required: true },
    standardPrice: { type: Number, required: true },
    suitesNumOfRooms: { type: Number, required: true },
    suitesPrice: { type: Number, required: true }
});

module.exports = mongoose.model('Hotel', hotelSchema);