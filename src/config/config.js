const ENV = process.env.NODE_ENV || 'development';
const constant = require('./config.json');
const dotenv = require('dotenv');
if (ENV === 'staging') {
    dotenv.config({ path: 'enviornment/.env.staging' });
} else if (ENV === 'development') {
    dotenv.config({ path: 'enviornment/.env.development' });
} else if (ENV === 'production') {
    dotenv.config({ path: 'enviornment/.env.production' });
}

// require and configure dotenv, will load vars in .env in PROCESS.ENV
require('dotenv').config();

module.exports = config = {
    ENV: process.env.ENV,
    PORT: process.env.PORT || 3000,
    JWTSECRET: process.env.JWT_SECRET,
    CONSTANT: constant,
    MONGOURI: process.env.MONGO_URI
};

global.AppConfig = config;
