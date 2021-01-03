const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const reservationRoutes = require('./routes/user-hotel-reservation-routes');
const hotelRoutes = require('./routes/hotels-routes');
const usersRoutes = require('./routes/users-routes');
const userReservationRoutes = require('./routes/user-reservation-routes');
const HttpError = require('./models/http-error');

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
});

app.use('/api/hotels', hotelRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/user-reservation-routes', userReservationRoutes);

app.use((req, res, next) => {
    throw new HttpError('Could not find this route', 404);

});

app.use((error, req, res, next) => {
    if(res.headerSent) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({message: error.message || "An unknown error occurred."});
});

mongoose
    .connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vbxke.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false })
    .then(() => {
        app.listen(process.env.PORT|| 5000);
    })
    .catch(err => {
        console.log(err);
    });

