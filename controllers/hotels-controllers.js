const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Hotel = require('../models/hotel');
const User = require('../models/user');

const getHotels = async (req, res, next) => {
    let hotels;
    try {
        hotels = await Hotel.find({});
    } catch (err) {
        const error = new HttpError('Fetching hotels failed, please try again later.', 500);
        return next(error);
    }

    res.json({hotels: hotels.map(hotel => hotel.toObject({getters: true}))});
};

const getHotelById = async (req, res, next) => {
    const hotelId = req.params.hid;

    let hotel;
    try {
        hotel = await Hotel.findById(hotelId);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find a hotel', 500);
        return next(error);
    }

    if(!hotel) {
        const error = new HttpError('Could not find a hotel for the provided id ', 404);
        return next(error);
    }

    res.json({hotel: hotel.toObject( {getters: true}) });
}

const getHotelsByUserId = async (req, res, next) => {
    const userId = req.params.uid;

    let hotels;
    try {
        hotels = await Hotel.find({ creator: userId });
    } catch (err) {
        const error = new HttpError('Fetching hotels failed. Please try again later', 500);
        return next(error);
    }

    if(!hotels || hotels.length === 0) {
        return next (
            new HttpError('Could not find hotels for the provided user id ', 404)
        )
    }

    res.json({hotels: hotels.map(hotel => hotel.toObject({getters: true})) });
}

const createHotel = async (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        next(new HttpError('Invalid inputs passed, please check your data.', 422));
    }
    const { image, name, address, description, deluxeNumOfRooms, deluxePrice, standardNumOfRooms, standardPrice, suitesNumOfRooms, suitesPrice } = req.body;

    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address);
    } catch(error) {
        return next(error);
    }

    //short way of doing const name = req.body.name;
    const createdHotel = new Hotel({
        id: uuidv4(),
        image,
        name,
        address,
        description,
        location: coordinates,
        creator: req.userData.userId,
        deluxeNumOfRooms,
        deluxePrice,
        standardNumOfRooms,
        standardPrice,
        suitesNumOfRooms,
        suitesPrice
    });

    let user;
    try {
        user = await User.findById(req.userData.userId);
    } catch (err) {
        const error = new HttpError('Creating hotel failed, please try again', 500);
        return next(error);
    }

    if (!user) {
        const error = new HttpError('Could not find user for provided id', 404);
        return next(error);
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdHotel.save({ session: sess });
        user.hotels.push(createdHotel);
        await user.save({ session: sess});
        await sess.commitTransaction();
    } catch (err){
        const error = new HttpError('Creating hotel failed, please try again', 500);
        return next(error);
    }

    res.status(201).json({hotel: createdHotel})
};

const updateHotel = async (req, res, next) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, please check your data.', 422)
        );
    }

    const { image, name, address, description, deluxeNumOfRooms, deluxePrice, standardNumOfRooms, standardPrice, suitesNumOfRooms, suitesPrice} = req.body;
    const hotelId = req.params.hid;

    let hotel;
    try {
        hotel = await Hotel.findById(hotelId);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update hotel.', 500);
        return next(error);
    }

    if(hotel.creator.toString() !== req.userData.userId) {
        const error = new HttpError('You are not allowed to edit this place.', 401);
        return next(error);
    }

    hotel.image = image;
    hotel.name = name;
    hotel.address = address;
    hotel.description = description;
    hotel.deluxeNumOfRooms = deluxeNumOfRooms;
    hotel.deluxePrice = deluxePrice;
    hotel.standardNumOfRooms = standardNumOfRooms;
    hotel.standardPrice = standardPrice;
    hotel.suitesNumOfRooms = suitesNumOfRooms;
    hotel.suitesPrice = suitesPrice;

    try {
        await hotel.save();
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update hotel', 500);
        return next(error);
    }

    res.status(200).json({hotel: hotel.toObject({ getters: true })})
};

const deleteHotel = async (req, res, next) => {
    const hotelId = req.params.hid;

    let hotel;
    try {
        hotel = await Hotel.findById(hotelId).populate('creator');
    } catch (err) {
        const error = new HttpError('Something went wrong, could not delete hotel.', 500);
        return next(error);
    }

    if(!hotel) {
        const error = new HttpError('Could not find hotel for this id.', 404);
        return next(error);
    }

    if (hotel.creator.id !== req.userData.userId) {
        const error = new HttpError('You are not allowed to delete this place.', 401);
        return next(error);
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await hotel.remove({session: sess});
        hotel.creator.hotels.pull(hotel);
        await hotel.creator.save({session: sess});
        await sess.commitTransaction();
    } catch (err) {
        const error = new HttpError('Something went wrong, could not delete hotel.', 500);
        return next(error);
    }

    res.status(200).json({message: 'Deleted hotel'})
};

exports.getHotels = getHotels;
exports.getHotelById = getHotelById;
exports.getHotelsByUserId = getHotelsByUserId;
exports.createHotel = createHotel;
exports.updateHotel = updateHotel;
exports.deleteHotel = deleteHotel;