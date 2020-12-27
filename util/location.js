const axios = require('axios');
const API_KEY = `AIzaSyCa_Pp3F0oviY5nFg3DPYV5l3TbSja9ci0`;
const HttpError = require('../models/http-error');

async function getCoordsForAddress(address) {
    const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`
    );
    const data = response.data;
    console.log(data);

    if(!data || data.status === 'ZERO_RESULTS') {
        throw new HttpError('Could not find location for the specified address.', 422);
    }

    return data.results[0].geometry.location;
}

module.exports = getCoordsForAddress;