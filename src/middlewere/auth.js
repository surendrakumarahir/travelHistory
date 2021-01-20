const jwt = require('jsonwebtoken');
const Utility = require('../utility/util');
const i18n = require("i18n");
const httpStatus = require('../exceptions/httpStatusCodes.json');
const { check,  validationResult } = require('express-validator');

module.exports = {

  async auth(req, res, next) {
    await check("authorization", i18n.__("AUTHORIZATION_TOKEN_CAN_NOT_BE_EMPTY")).exists().bail().notEmpty().run(req);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      Utility.response(res, {}, {}, httpStatus.UNPROCESSABLE_ENTITY, errors);
    } else {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, AppConfig.JWTSECRET);
        /* passing decoded user object to the request object */
        req.user = decoded;
        next();
      } catch (e) {
        return Utility.response(res,
          {},
          i18n.__("INVALID_TOKEN"),
          httpStatus.UNAUTHORIZED,
          i18n.__("responseStatus.FAILURE")
        );
      }
    }
  }

}