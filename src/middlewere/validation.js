const Utility = require('../utility/util');
const httpStatus = require('../exceptions/httpStatusCodes.json');
const i18n = require("i18n");
const { check, validationResult } = require('express-validator');

const errorFunction = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    Utility.response(res, {}, {}, httpStatus.UNPROCESSABLE_ENTITY, errors);
  } else {
    next();
  }
};

module.exports = {
  errorFunction,

  async password(req, res, next) {
    await check("password", i18n.__("PASSWORD_REQUIRED")).exists().bail().notEmpty().run(req);;
    errorFunction(req, res, next);
  },
  // eTicketId
  // healthCertificateId
  // passportStampId
  async travel(req, res, next) {
   await check("toCity", i18n.__("TO_CITY_REQUIRED")).exists().bail().notEmpty().run(req);
   await check("fromCity", i18n.__("FROM_CITY_REQUIRED")).exists().bail().notEmpty().run(req);
   await check("departureDate", i18n.__("DEPARTURE_DATE_REQUIRED")).exists().bail().notEmpty().run(req);
   await check("arrivalDate", i18n.__("ARRIVAL_DATE_REQUIRED")).exists().bail().notEmpty().run(req);
    errorFunction(req, res, next);
  }

}