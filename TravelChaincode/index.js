// Chaincode for Travel Records

'use strict';

const TravelRecords = require('./lib/travelRecord');

module.exports.TravelRecords = TravelRecords;
module.exports.contracts = [TravelRecords];
