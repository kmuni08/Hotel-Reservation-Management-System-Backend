const { v4: uuidv4 } = require('uuid');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Hotel = require('../models/hotel');

const { validationResult } = require('express-validator');

let HOTELS = [
    {
        hid: '1',
        image: 'https://content.fortune.com/wp-content/uploads/2020/05/F500-2020-338-Hilton-.jpg',
        name: 'New York Stock Exchange',
        rating: 4.0,
        address: '11 Wall St, New York, NY 10005',
        creator: 'u1',
        location: {
            lat: 40.7484405,
            lng: -73.9878584
        },
        description: 'Airport hotel with a pool and free shuttle. Free Wi-Fi',
        deluxe: {
            numOfRooms: 25,
            price: 300
        },
        standard: {
            numOfRooms: 50,
            price: 85
        },
        suites: {
            numOfRooms: 15,
            price: 150
        }
    },
    {
        hid: '2',
        image: 'https://www.gannett-cdn.com/presto/2019/04/16/USAT/15d11370-b0e6-4743-adf0-387d1fa95ab5-AP_Marriott_Starwood_Sale.JPG?crop=4851,2740,x0,y0&width=3200&height=1808&format=pjpg&auto=webp',
        name: 'Marriot',
        address: '11 Wall St, New York, NY 10005',
        creator: 'u2',
        location: {
            lat: 40.7484405,
            lng: -73.9878584
        },
        description: 'Free breakfast and Wi-Fi. It is near airport for easy access. ',
        deluxe: {
            numOfRooms: 15,
            price: 250,
            deluxe_user_pick: 0
        },
        standard: {
            numOfRooms: 40,
            price: 75,
            standard_user_pick: 0
        },
        suites: {
            numOfRooms: 10,
            price: 120,
            suites_user_pick: 0
        }
    }

];


const getHotelById = async (req, res, next) => {
    const hotelId = req.params.hid
    // console.log('GET Request in Places');
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
    res.json({hotel: hotel.toObject( {getters: true}) });
}


//function getHotelById() {..}
//const getHotelById = function()

const getHotelsByUserId = async (req, res, next) => {
    const userId = req.params.uid;

    let hotels;
    try {
        hotels = await Hotel.find({ creator: userId });
    } catch (err) {
        const error = new HttpError('Fetching hotels failed. Please try again later', 500);
        return next(error);
    }

    if(!hotels || hotels.length === 0) {
        return next (
            new HttpError('Could not find hotels for the provided user id ', 404)
        )
    }

    res.json({hotels: hotels.map(hotel => hotel.toObject({getters: true})) });
}

const createHotel = async (req, res, next) => {
    const errors = validationResult(req);

    if(errors.isEmpty()) {
        next(new HttpError('Invalid inputs passed, please check your data.', 422));
    }
    const { image, name, description, address, creator, deluxe, standard, suites } = req.body;

    let coordinates;
    try {
        coordinates = await getCoordsForAddress(address);
    } catch(error) {
        return next(error);
    }

    //short way of doing const name = req.body.name;
    const createdHotel = new Hotel({
        id: uuidv4(),
        image,
        name,
        description,
        address,
        location: coordinates,
        creator,
        deluxe,
        standard,
        suites
    })

    // HOTELS.push(createdHotel);
    try {
        await createdHotel.save();
    } catch (err){
        const error = new HttpError('Creating hotel failed, please try again', 500);
        return next(error);
    }

    res.status(201).json({hotel: createdHotel})
};

const updateHotel = async (req, res, next) => {

    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, please check your data.', 422)
        );
    }

    const { name, address, description, deluxe, standard, suites } = req.body;
    const hotelId = req.params.hid;

    let hotel;
    try {
        hotel = await Hotel.findById(hotelId);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update hotel.', 500);
        return next(error);
    }

    hotel.name = name;
    hotel.address = address;
    hotel.description = description;
    hotel.deluxe.numOfRooms = deluxe.numOfRooms;
    hotel.standard.numOfRooms = standard.numOfRooms;
    hotel.suites.numOfRooms = suites.numOfRooms;

    try {
        await hotel.save();
    } catch (err) {
        const error = new HttpError('Something went wrong, could not update hotel', 500);
        return next(error);
    }

    // HOTELS[hotelIndex] = updatedHotel;

    res.status(200).json({hotel: hotel.toObject({ getters: true })})
};

const deleteHotel = async (req, res, next) => {
    const hotelId = req.params.hid;

    let hotel;
    try {
        hotel = await Hotel.findById(hotelId);
    } catch (err) {
        const error = new HttpError('Something went wrong, could not delete hotel.', 500);
        return next(error);
    }

    try {
        await hotel.remove();
    } catch (err) {
        const error = new HttpError('Something went wrong, could not delete hotel.', 500);
        return next(error);
    }

    res.status(200).json({message: 'Deleted hotel'})
};

exports.getHotelById = getHotelById;
exports.getHotelsByUserId = getHotelsByUserId;
exports.createHotel = createHotel;
exports.updateHotel = updateHotel;
exports.deleteHotel = deleteHotel;