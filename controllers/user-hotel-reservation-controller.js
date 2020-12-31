const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const Reservation = require('../models/userHotelReservation');
const User = require('../models/user');
const Hotel = require('../models/hotel');

const getReservationByHotelId = async (req, res, next) => {
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

    let reservation;
    try {
        reservation = await Reservation.findOne({"hotel": hotelId});
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find a hotel', 500);
        return next(error);
    }

    if(!reservation) {
        const error = new HttpError('Could not find reservation for the provided hotel ', 404);
        return next(error);
    }

    res.json({reservation: reservation.toObject( {getters: true}) });
}

const createHotelReservation = async (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        next(new HttpError('Invalid inputs passed, please check your data.', 422));
    }
    const { name, address, description, hotelId, deluxeNumOfRooms, deluxe_user_pick, deluxePrice, standardNumOfRooms,standard_user_pick, standardPrice, suitesNumOfRooms, suites_user_pick, suitesPrice } = req.body;

    const createdHotelReservation = new Reservation({
        id: uuidv4(),
        name,
        address,
        description,
        hotel: hotelId,
        user: req.userData.userId,
        deluxe_user_pick,
        deluxePrice: deluxe_user_pick * deluxePrice,
        standard_user_pick,
        standardPrice: standard_user_pick * standardPrice,
        suites_user_pick,
        suitesPrice: suites_user_pick * suitesPrice,
        totalPayment: (deluxe_user_pick * deluxePrice) + (standard_user_pick * standardPrice) + (suites_user_pick * suitesPrice),
        reservationStatus: "Currently Reserved"
    });

    let currentUser;
    try {
        currentUser = await User.findById(req.userData.userId);
    } catch (err) {
        const error = new HttpError('Reserving hotel failed, please try again', 500);
        return next(error);
    }

    if (!currentUser) {
        const error = new HttpError('Could not find user for provided id', 404);
        return next(error);
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdHotelReservation.save({ session: sess });
        currentUser.reservations.push( createdHotelReservation );
        await currentUser.save({ session: sess});
        await sess.commitTransaction();
    } catch (err) {
        const error = new HttpError('Reserving hotel failed, please try again', 500);
        return next(error);
    }

    // console.log("userId", currentUser);
    // console.log("hotelId", hotelId);
    let hotel = await Hotel.findById(hotelId);
    // console.log(hotel.deluxeNumOfRooms, hotel.standardNumOfRooms, hotel.suitesNumOfRooms);
    let reservedRooms = await Reservation.findOne({"hotel": hotelId, "user": currentUser});
    // console.log(reservedRooms.deluxe_user_pick, reservedRooms.standard_user_pick, reservedRooms.suites_user_pick);

    try {
        await Hotel.findByIdAndUpdate(hotelId,
            {
                deluxeNumOfRooms: hotel.deluxeNumOfRooms - reservedRooms.deluxe_user_pick,
                standardNumOfRooms: hotel.standardNumOfRooms - reservedRooms.standard_user_pick,
                suitesNumOfRooms: hotel.suitesNumOfRooms - reservedRooms.suites_user_pick
            });
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find a hotel', 500);
        return next(error);
    }

    res.status(201).json({reservation: createdHotelReservation})
};

const cancelReservationByHotelId = async (req, res, next) => {
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

    let reservation;
    try {
        reservation = await Reservation.findOneAndUpdate({"hotel": hotelId, "reservationStatus": "Canceled"});
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find a reservation', 500);
        return next(error);
    }

    if(!reservation) {
        const error = new HttpError('Could not find reservation for the provided hotel ', 404);
        return next(error);
    }

    try {
        await Hotel.findOneAndUpdate(
            {"hotel": hotelId,
                deluxeNumOfRooms: reservation.deluxe_user_pick + hotel.deluxeNumOfRooms,
                standardNumOfRooms: reservation.standard_user_pick + hotel.standardNumOfRooms,
                suitesNumOfRooms: reservation.suites_user_pick + hotel.suitesNumOfRooms
            });
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find a hotel', 500);
        return next(error);
    }

    res.status(200).json({message: 'Canceled reservation'});
}

exports.getReservationByHotelId = getReservationByHotelId;
exports.createHotelReservation = createHotelReservation;
exports.cancelReservationByHotelId = cancelReservationByHotelId;
