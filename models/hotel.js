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
    deluxeNumOfRooms: { type: Number, required: true, min: 0 },
    deluxePrice: { type: Number, required: true, min: 0 },
    standardNumOfRooms: { type: Number, required: true, min: 0 },
    standardPrice: { type: Number, required: true, min: 0 },
    suitesNumOfRooms: { type: Number, required: true, min: 0 },
    suitesPrice: { type: Number, required: true, min: 0 }
});

module.exports = mongoose.model('Hotel', hotelSchema);