const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../middleware/check-auth');
const userHotelReservationControllers = require('../controllers/user-hotel-reservation-controller');
const router = express.Router();

router.get('/:hid', userHotelReservationControllers.getReservationByHotelId);

router.use(checkAuth);

router.post(
    '/',
    [
        check('name')
            .not()
            .isEmpty(),
        check('address')
            .not()
            .isEmpty(),
        check('description')
            .isLength({min: 5}),
        check('deluxe_user_pick')
            .not()
            .isEmpty(),
        check('deluxePrice')
             .not()
             .isEmpty(),
        check('standard_user_pick')
            .not()
            .isEmpty(),
        check('standardPrice')
             .not()
            .isEmpty(),
        check('suites_user_pick')
            .not()
            .isEmpty(),
        check('suitesPrice')
             .not()
             .isEmpty()
    ],
    userHotelReservationControllers.createHotelReservation);

router.patch('/cancel/:hid', userHotelReservationControllers.cancelReservationByHotelId);


module.exports = router;