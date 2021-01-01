const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const Reservation = require('../models/userHotelReservation');
const User = require('../models/user');
const Hotel = require('../models/hotel');

const getUsers = async (req, res, next) => {

    const creatorId = req.params.creatorId;

    let hotelCreator;
    try {
        hotelCreator = await Hotel.findOne({"creator": creatorId});
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find a hotel creator', 500);
        return next(error);
    }

    if(!hotelCreator) {
        const error = new HttpError('Could not find hotel for the provided creator id ', 404);
        return next(error);
    }

    let findHotelAndUser;
    try {
        findHotelAndUser = await Reservation.findOne({"hotel": hotelCreator._id});
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find a hotel or user', 500);
        return next(error);
    }

    if(!findHotelAndUser) {
        const error = new HttpError('Could not find hotel for the provided creator id or user ', 404);
        return next(error);
    }

    let rightUser;
    try {
        // users = await User.find({_id: {$nin: ['5fee440aa9c27f16a037e2ee']}, $and: rightUser}, '-password');
        // console.log("right", rightUser)
        // console.log("first", users[0]._id)
        rightUser = await User.find({_id: findHotelAndUser.user}, '-password');

    } catch (err) {
        const error = new HttpError('Fetching users failed, please try again later.', 500);
        return next(error);
    }
    

    res.json({rightUser: rightUser.map(user => user.toObject({getters: true}))});
};

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

const getReservationByUserId = async (req, res, next) => {
    const userIdentification = req.params.uid;

    let user;
    try {
        user = await User.findById(userIdentification);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find this user.', 500);
        return next(error);
    }

    if(!user) {
        const error = new HttpError('Could not find a user for the provided id. ', 404);
        return next(error);
    }

    let reservationForUser;
    try {
        reservationForUser = await Reservation.findOne({"user": userIdentification });
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find a reservation for user.', 500);
        return next(error);
    }
    console.log(reservationForUser);

    if(!reservationForUser) {
        const error = new HttpError('Could not find reservation for the provided user ', 404);
        return next(error);
    }
    res.json({reservationForUser: reservationForUser.toObject( {getters: true}) });
    // res.json({reservationForUser: reservationForUser.map(userReservation => userReservation.toObject({getters: true}))});
}

const createHotelReservation = async (req, res, next) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        next(new HttpError('Invalid inputs passed, please check your data.', 422));
    }
    const { name, address, description, hotelId, deluxeNumOfRooms, deluxe_user_pick, deluxePrice, standardNumOfRooms,standard_user_pick, standardPrice, suitesNumOfRooms, suites_user_pick, suitesPrice } = req.body;

    if((deluxe_user_pick > deluxeNumOfRooms) || (standard_user_pick > standardNumOfRooms) || (suites_user_pick > suitesNumOfRooms)) {
        const error = new HttpError('Not suitable for reservation. Invalid data inputs', 404);
        return next(error);
    }

    let reservedRoomsPreviously;
    try {
        reservedRoomsPreviously = await Reservation.findOne({"hotel": hotelId});
        if(reservedRoomsPreviously) {
            const error = new HttpError('Call the administrator if you would like to edit your reservation. Currently, rebooking hotel is not supported yet.', 500);
            return next(error);
        }
    } catch (err) {}

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
        const error = new HttpError('Reserving hotel failed, please try again. If you are trying to make a reservation at a previous hotel you reserved and canceled, you have to contact the administrator to make a reservation at this hotel again. ', 500);
        return next(error);
    }

    let hotel = await Hotel.findById(hotelId);
    let reservedRooms = await Reservation.findOne({"hotel": hotelId});

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
        reservation= await Reservation.findOneAndDelete(hotelId).populate('user');
    } catch (err) {
        const error = new HttpError('Something went wrong, could not delete reservation.', 500);
        return next(error);
    }
    console.log(reservation);

    if(!reservation) {
        const error = new HttpError('Could not find reservation for this id.', 404);
        return next(error);
    }

    if (reservation.user.id !== req.userData.userId) {
        const error = new HttpError('You are not allowed to delete this reservation', 401);
        return next(error);
    }

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await reservation.remove({session: sess});
        reservation.user.reservations.pull(reservation);
        await reservation.user.save({session: sess});
        await sess.commitTransaction();
    } catch (err) {
        const error = new HttpError('Something went wrong, could not delete reservation.', 500);
        return next(error);
    }

    try {
        await Hotel.findOneAndUpdate(
            {
                "hotel": hotelId,
                deluxeNumOfRooms: reservation.deluxe_user_pick + hotel.deluxeNumOfRooms,
                standardNumOfRooms: reservation.standard_user_pick + hotel.standardNumOfRooms,
                suitesNumOfRooms: reservation.suites_user_pick + hotel.suitesNumOfRooms
                });
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find a hotel', 500);
        return next(error);
    }

    res.status(200).json({message: 'Deleted reservation'})
}

exports.getUsers = getUsers;
exports.getReservationByHotelId = getReservationByHotelId;
exports.getReservationByUserId =  getReservationByUserId;
exports.createHotelReservation = createHotelReservation;
exports.cancelReservationByHotelId = cancelReservationByHotelId;
