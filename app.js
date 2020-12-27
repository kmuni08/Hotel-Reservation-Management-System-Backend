const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const hotelRoutes = require('./routes/hotels-routes');
const usersRoutes = require('./routes/users-routes');
const HttpError = require('./models/http-error');

const app = express();

app.use(bodyParser.json());

app.use('/api/hotels', hotelRoutes);
app.use('/api/users', usersRoutes);

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
    .connect(`mongodb+srv://kmuni08:randomrelated123@@cluster0.vbxke.mongodb.net/hotel-reservation-management?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
    .then(() => {
        app.listen(5000);
    })
    .catch(err => {
        console.log(err);
    });

