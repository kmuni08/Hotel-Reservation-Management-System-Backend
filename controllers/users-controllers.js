const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const User = require('../models/user');


const getUsers = (req, res, next) => {
    res.json({ users: USERS });
};

const signup = async (req, res, next) => {
    const errors = validationResult(req);
    if(errors.isEmpty()) {
        throw new HttpError('Invalid inputs passed, please check your data.', 422);
    }
    const {name, email, user_type, password} = req.body;
    // const hasUser = USERS.find( u => u.email === email);
    // if(hasUser) {
    //     throw new HttpError('Could not create user. Email already exists. ', 422);
    // }

    let existingUser;
    try {
        existingUser = await User.findOne({ email: email });
    } catch (err) {
        const error = new HttpError('Signing up failed, please try again later.', 500);
        return next(error);
    }

    if (existingUser) {
        const error = new HttpError('User exists already, please login instead.', 422);
        return next(error);
    }

    const createdUser = new User({
        name,
        email,
        user_type,
        password
    });

    try {
        await createdUser.save();
    } catch (err) {
        const error = new HttpError('Signing up failed, please try again.', 500);
        return next(error);
    }

    res.status(201).json({user: createdUser.toObject({getters: true})});
};

const login = (req, res, next) => {
    const { email, password, user_type } = req.body;
    const identifiedType = USERS.find( u => u.user_type === user_type);
    const identifiedUser = USERS.find( u => u.email === email);

    if(!identifiedUser || !identifiedUser || identifiedUser.password !== password) {
        throw new HttpError('Could not authenticate user. ', 401);
    }

    res.json({message: 'Logged in'});

};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;