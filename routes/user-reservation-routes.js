const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../middleware/check-auth');
const userReservationControllers = require('../controllers/user-reservation-routes');
const router = express.Router();

router.get('/uid/:uid/cm/:cm/cd/:cd/cy/:cy', userReservationControllers.getUserReservations);


router.use(checkAuth);


module.exports = router;