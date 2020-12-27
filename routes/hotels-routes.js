const express = require('express');
const { check } = require('express-validator');

const hotelControllers = require('../controllers/hotels-controllers');
const router = express.Router();

router.get('/:hid', hotelControllers.getHotelById);

router.get('/user/:uid', hotelControllers.getHotelsByUserId);

router.post(
    '/',
    [
        check('title')
            .not()
            .isEmpty(),
        check('address')
            .not()
            .isEmpty(),
        check('description')
            .isLength({min: 5})
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