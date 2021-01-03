const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../middleware/check-auth');
const hotelControllers = require('../controllers/hotels-controllers');
const router = express.Router();

router.get('/', hotelControllers.getHotels);

router.get('/:hid', hotelControllers.getHotelById);

router.get('/user/:uid', hotelControllers.getHotelsByUserId);


router.use(checkAuth);

router.post(
    '/',
    [
        check('image')
            .not()
            .isEmpty(),
        check('name')
            .not()
            .isEmpty(),
        check('address')
            .not()
            .isEmpty(),
        check('description')
            .isLength({min: 5}),
        check('deluxeNumOfRooms')
            .not()
            .isEmpty(),
        check('deluxePrice')
            .not()
            .isEmpty(),
        check('standardNumOfRooms')
            .not()
            .isEmpty(),
        check('standardPrice')
            .not()
            .isEmpty(),
        check('suitesNumOfRooms')
            .not()
            .isEmpty(),
        check('suitesPrice')
            .not()
            .isEmpty()
    ],
    hotelControllers.createHotel);

router.patch(
    '/:hid',
    [
    check('name')
        .not()
        .isEmpty(),
   check('address')
        .not()
        .isEmpty(),
    check('description')
         .isLength({min: 5})

    ],
    hotelControllers.updateHotel)
router.delete('/:hid', hotelControllers.deleteHotel)

module.exports = router;