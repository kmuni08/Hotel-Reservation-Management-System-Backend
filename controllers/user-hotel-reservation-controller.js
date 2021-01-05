const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const Reservation = require('../models/userHotelReservation');
const User = require('../models/user');
const Hotel = require('../models/hotel');

const getUsers = async (req, res, next) => {

    const creatorId = req.params.creatorId;
    const currentMonth = req.params.cm;
    const currentDate = req.params.cd;
    const currentYear = req.params.cy;

    let hotelsByThisCreator;
    try {
        hotelsByThisCreator = await Hotel.find({"creator": creatorId});
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find a hotel creator', 500);
        return next(error);
    }

    if(!hotelsByThisCreator) {
        const error = new HttpError('Could not find hotel for the provided creator id ', 404);
        return next(error);
    }

    // grab all reservations by hotels
    let reservations = Array();
    for(let i = 0; i < hotelsByThisCreator.length; i++) {
        let temp;
        try {
            temp = await Reservation.find({"hotel": hotelsByThisCreator[i]._id});
        } catch (err) {
            const error = new HttpError('Something went wrong, could not find a hotel or user', 500);
            return next(error);
        }

        if(!temp) {
            const error = new HttpError('Could not find hotel for the provided creator id or user ', 404);
            return next(error);
        }

        temp.forEach((reservation) => {
            reservation.hotelName = hotelsByThisCreator[i].name;
            reservation.hotelAddress = hotelsByThisCreator[i].address;
            reservation.hotelDescription = hotelsByThisCreator[i].description;
            reservation.deluxePrice = hotelsByThisCreator[i].deluxePrice;
            reservation.standardPrice = hotelsByThisCreator[i].standardPrice;
            reservation.suitesPrice = hotelsByThisCreator[i].suitesPrice;
            reservations.push(reservation);
        });
    }

    let i;
    let deleteCount = [];
    for(i = 0; i < reservations.length; i++) {
        if(currentYear >= reservations[i].endDateYear && currentMonth >= reservations[i].endDateMonth && currentDate > reservations[i].endDateNum ) {
            let deleteReservationAutomatically
            try {
                deleteReservationAutomatically = await Reservation.findByIdAndDelete(reservations[i]._id);

            } catch (err) {
                const error = new HttpError('Something went wrong, could not delete this reservation', 500);
                return next(error);
            }

            if(!deleteReservationAutomatically) {
                const error = new HttpError('Could not find reservation. Sorry. ', 404);
                return next(error);
            }
            deleteCount.push(i);

            try {
                await Hotel.findByIdAndUpdate({"_id": reservations[i].hotel},
                    {
                        deluxeNumOfRooms:  reservations[i].deluxe_user_pick + hotelsByThisCreator[i].deluxeNumOfRooms,
                        standardNumOfRooms: reservations[i].standard_user_pick + hotelsByThisCreator[i].standardNumOfRooms,
                        suitesNumOfRooms: reservations[i].suites_user_pick + hotelsByThisCreator[i].suitesNumOfRooms
                    });
            } catch (err) {
                const error = new HttpError('Something went wrong, could not find a hotel', 500);
                return next(error);
            }
        }
    }

    let j;
    for (j = 0; j < deleteCount.length; j++) {
        reservations.splice(deleteCount[j], 1);
    }

    for(let i = 0; i < reservations.length; i++) {
        let temp;
        try {
            temp = await User.findOne({"_id": reservations[i].user});
        } catch (err) {
            const error = new HttpError('Something went wrong, could not find a hotel or user', 500);
            return next(error);
        }

        if(!temp) {
            const error = new HttpError('Could not find hotel for the provided creator id or user ', 404);
            return next(error);
        }
        reservations[i].userDetails = temp;

        reservations[i].hotelStartDateMonth = reservations[i].startDateMonth;
        reservations[i].hotelStartDateNum = reservations[i].startDateNum;
        reservations[i].hotelStartDateYear = reservations[i].startDateYear;
        reservations[i].hotelEndDateMonth = reservations[i].endDateMonth;
        reservations[i].hotelEndDateNum = reservations[i].endDateNum;
        reservations[i].hotelEndDateYear = reservations[i].endDateYear;
        reservations[i].hotelDeluxeRoomsPicked  = reservations[i].deluxe_user_pick;
        reservations[i].hotelStandardRoomsPicked  = reservations[i].standard_user_pick;
        reservations[i].hotelSuitesRoomsPicked = reservations[i].suites_user_pick;
        reservations[i].totalPaymentForReserved = reservations[i].totalPayment;
    }

    let finalUsers = reservations.map(reservation => {
        // let user = reservation.userDetails;
        let user = {};
        user.name = reservation.userDetails.name;
        user.email= reservation.userDetails.email;
        user.hotelName = reservation.hotelName;
        user.hotelAddress = reservation.hotelAddress;
        user.hotelDescription = reservation.hotelDescription;
        user.hotelStartDateMonth = reservation.hotelStartDateMonth;
        user.hotelStartDateNum = reservation.hotelStartDateNum;
        user.hotelStartDateYear = reservation.hotelStartDateYear;
        user.hotelEndDateMonth = reservation.hotelEndDateMonth;
        user.hotelEndDateNum = reservation.hotelEndDateNum;
        user.hotelEndDateYear = reservation.hotelEndDateYear;
        user.hotelDeluxeRoomsPicked = reservation.hotelDeluxeRoomsPicked;
        user.deluxePrice = reservation.deluxePrice;
        user.hotelStandardRoomsPicked = reservation.hotelStandardRoomsPicked;
        user.standardPrice  = reservation.standardPrice ;
        user.hotelSuitesRoomsPicked = reservation.hotelSuitesRoomsPicked;
        user.suitesPrice = reservation.suitesPrice;
        user.totalPaymentForReserved = reservation.totalPaymentForReserved;
        return user;
    });

    res.json({finalUsers});
};

const getReservationByHotelId = async (req, res, next) => {
    const customerId = req.params.cid;
    const hotelId = req.params.hid;
    const currentMonth = req.params.currM;
    const currentDate = req.params.currD;
    const currentYear = req.params.currY;

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

    let reservationByHotel;
    try {
        reservationByHotel = await Reservation.findOne({"hotel": hotelId, "user": customerId });
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find a hotel', 500);
        return next(error);
    }

    if(!reservationByHotel) {
        const error = new HttpError('Could not find reservation for the provided hotel ', 404);
        return next(error);
    }

    if(currentYear >= reservationByHotel.endDateYear && currentMonth >= reservationByHotel.endDateMonth && currentDate > reservationByHotel.endDateNum ) {
     let deleteReservationOnUserEnd;
        try {
            deleteReservationOnUserEnd = await Reservation.findOneAndDelete( {"_id": reservationByHotel._id, "endDateNum": {$lte: reservationByHotel.endDateNum}});

        } catch (err) {
            const error = new HttpError('Something went wrong, could not delete this reservation', 500);
            return next(error);
        }
        if(!deleteReservationOnUserEnd) {
            const error = new HttpError('Could not find previous reservation. It must have expired. Make a reservation for a new one. ', 404);
            return next(error);
        }

        try {
            await Hotel.findByIdAndUpdate({"_id": reservationByHotel.hotel},
                {
                    deluxeNumOfRooms: reservationByHotel.deluxe_user_pick + hotel.deluxeNumOfRooms,
                    standardNumOfRooms: reservationByHotel.standard_user_pick + hotel.standardNumOfRooms,
                    suitesNumOfRooms: reservationByHotel.suites_user_pick + hotel.suitesNumOfRooms
                });
        } catch (err) {
            const error = new HttpError('Something went wrong, could not find a hotel', 500);
            return next(error);
        }
    }

    res.json({reservationByHotel: reservationByHotel.toObject( {getters: true}) });
};

const createHotelReservation = async (req, res, next) => {
    const errors = validationResult(req);


    if(!errors.isEmpty()) {
        next(new HttpError('Invalid inputs passed, please check your data.', 422));
    }
    const { userId, name, address, description, hotelId, startDateMonth, startDateNum, startDateYear, endDateMonth, endDateNum, endDateYear, deluxeNumOfRooms, deluxe_user_pick, deluxePrice, standardNumOfRooms,standard_user_pick, standardPrice, suitesNumOfRooms, suites_user_pick, suitesPrice } = req.body;

    if((deluxe_user_pick > deluxeNumOfRooms) || (standard_user_pick > standardNumOfRooms) || (suites_user_pick > suitesNumOfRooms)) {
        const error = new HttpError('Not suitable for reservation. You may be reserving more rooms than available or the rooms are sold out. Invalid data inputs', 404);
        return next(error);
    }

    if(deluxe_user_pick === 0 && standard_user_pick === 0 && suites_user_pick === 0) {
        const error = new HttpError('You need to reserve valid number of rooms.', 404);
        return next(error);
    }

    if(deluxe_user_pick === "undefined" && standard_user_pick === "undefined" && suites_user_pick === "undefined") {
        const error = new HttpError('Make sure no text boxes are empty.', 404);
        return next(error);
    }

    let reservedRoomsPreviously;
    try {
        reservedRoomsPreviously = await Reservation.findOne({"hotel": hotelId, "user": userId});
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
        startDateMonth,
        startDateNum,
        startDateYear,
        endDateMonth,
        endDateNum,
        endDateYear,
        user: req.userData.userId,
        deluxe_user_pick,
        deluxePrice: deluxe_user_pick * deluxePrice,
        standard_user_pick,
        standardPrice: standard_user_pick * standardPrice,
        suites_user_pick,
        suitesPrice: suites_user_pick * suitesPrice,
        totalPayment: (deluxe_user_pick * deluxePrice) + (standard_user_pick * standardPrice) + (suites_user_pick * suitesPrice)
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
    let reservedRooms = await Reservation.findOne({"hotel": hotelId, "user": currentUser});

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
    const cust_id = req.params.cid;
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

    let tempCheckReservation = await Reservation.findOne({"hotel": hotelId, "user": cust_id});
    if (tempCheckReservation.user.toString() !== cust_id.toString()) {
        const error = new HttpError('You are not allowed to delete this reservation', 401);
        return next(error);
    }


    let reservation;
    try {
        reservation= await Reservation.findOneAndDelete({"hotel": hotelId, "user": cust_id}).populate('user');
    } catch (err) {
        const error = new HttpError('Something went wrong, could not delete reservation.', 500);
        return next(error);
    }

    if(!reservation) {
        const error = new HttpError('Could not find reservation for this id.', 404);
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
        await Hotel.findByIdAndUpdate({"_id": hotelId},
            {
                deluxeNumOfRooms: tempCheckReservation.deluxe_user_pick + hotel.deluxeNumOfRooms,
                standardNumOfRooms: tempCheckReservation.standard_user_pick + hotel.standardNumOfRooms,
                suitesNumOfRooms: tempCheckReservation.suites_user_pick + hotel.suitesNumOfRooms
                });
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find a hotel', 500);
        return next(error);
    }

    res.status(200).json({message: 'Deleted reservation'})
}

exports.getReservationByHotelId = getReservationByHotelId;
exports.createHotelReservation = createHotelReservation;
exports.cancelReservationByHotelId = cancelReservationByHotelId;
exports.getUsers = getUsers;
