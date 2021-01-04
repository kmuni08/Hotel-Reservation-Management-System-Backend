const HttpError = require('../models/http-error');
const User = require('../models/user');
const Reservation = require('../models/userHotelReservation');

const getUserReservations = async (req, res, next) => {
    const userIdentification = req.params.uid;
    const currentMonth = req.params.cm;
    const currentDate = req.params.cd;
    const currentYear = req.params.cy;

    let users;
    try {
        users = await User.findById(userIdentification);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not find this user.', 500);
        return next(error);
    }
    if(!users) {
        const error = new HttpError('Could not find a user for the provided id. ', 404);
        return next(error);
    }

    let reservationForUser;
    let i;
    for(i = 0; i < users.reservations.length; i++) {
        try {
            reservationForUser = await Reservation.findById({_id: users.reservations[i]});
        } catch (err) {
            const error = new HttpError('Something went wrong, could not find this user.', 500);
            return next(error);
        }
        if(!reservationForUser) {
            const error = new HttpError('Could not find a user for the provided id. ', 404);
            return next(error);
        }
    }


    res.json({reservationForUser: reservationForUser.toObject( {getters: true}) });
};


exports.getUserReservations =  getUserReservations;