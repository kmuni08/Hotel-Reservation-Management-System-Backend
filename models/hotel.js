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
    creator: { type: String, required: true },
    deluxe: {
        numOfRooms: {type: Number, required: true},
        price: {type: Number, required: true }
    },
    standard: {
        numOfRooms: {type: Number, required: true},
        price: {type: Number, required: true }
    },
    suites: {
        numOfRooms: {type: Number, required: true},
        price: {type: Number, required: true }
    }

});

module.exports = mongoose.model('Hotel', hotelSchema);