class HttpError extends Error {
    constructor(message, errorCode) {
        super(message); //Add message property to instances based on class
        this.code = errorCode; //Adds a code property.

    }
}

module.exports = HttpError;