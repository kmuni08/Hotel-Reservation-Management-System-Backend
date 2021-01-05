const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../middleware/check-auth');
const userHotelReservationControllers = require('../controllers/user-hotel-reservation-controller');
const router = express.Router();


router.get('/:creatorId/cm/:cm/cd/:cd/cy/:cy', userHotelReservationControllers.getUsers);
router.get('/:cid/:hid/current-date/:currM/:currD/:currY', userHotelReservationControllers.getReservationByHotelId);
router.use(checkAuth);

router.post(
    '/:cid',
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

router.delete('/cancel/:cid/:hid', userHotelReservationControllers.cancelReservationByHotelId);


module.exports = router;