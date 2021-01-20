/* eslint-disable max-len,no-underscore-dangle,dot-notation,object-shorthand,no-use-before-define */
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const i18n = require("i18n");
const User = require('../model/user');
const Session = require('../model/session');
const moment = require('moment');
const Utility = require('../utility/util');
const httpStatus = require('../exceptions/httpStatusCodes.json');
const async = require("async");

module.exports = {

  generatePasswordHash: async (password) => {
    password = bcrypt.hashSync(password, Number(AppConfig.CONSTANT.SALT.ROUNDS));
    return password;
  },

  // register user
  register: async (req, res, next) => {
    try {
      const user = new User(req.body);
      user.email = req.body.email.trim().toLowerCase();
      user.playerId = req.headers["device-token"] ? req.headers["device-token"] : null;
      user.passportExpiryDate = new Date(moment(req.body.passportExpiryDate));
      user.passportIssueDate = new Date(moment(req.body.passportIssueDate));
      /* Check if user already exists based on emailID */

      const getUserByEmailResponse = await User.existCheck(user.email);

      if (getUserByEmailResponse) {
        const err = {};
        err.status = httpStatus.CONFLICT;
        err.resMsg = i18n.__("EMAIL_ALREADY_EXISTS");
        err.resCode = i18n.__("responseStatus.ERROR")
        return next(err);
      }
      const getUserByPhoneResponse = await User.existPhoneCheck(user.phone);
      if (getUserByPhoneResponse) {
        const err = {};
        err.status = httpStatus.CONFLICT;
        err.resMsg = i18n.__("PHONE_ALREADY_EXISTS");
        err.resCode = i18n.__("responseStatus.ERROR")
        return next(err);
      }
      const getUserByPassportResponse = await User.existPassportCheckk(user.passportNo);
      if (getUserByPassportResponse) {
        const err = {};
        err.status = httpStatus.CONFLICT;
        err.resMsg = i18n.__("PASSPORT_ALREADY_EXISTS");
        err.resCode = i18n.__("responseStatus.ERROR")
        return next(err);
      }
      user["password"] = await module.exports.generatePasswordHash(user["password"]);

      let registerUserResponse = await user.save();
      registerUserResponse = registerUserResponse.toObject();

      delete registerUserResponse["password"];

      const token = jwt.sign({
        id: registerUserResponse["_id"],
        email: registerUserResponse["email"],
        userRole: registerUserResponse["role"],
        name: registerUserResponse["name"] ? registerUserResponse["name"] : "",
      }, AppConfig.JWTSECRET);
      registerUserResponse["token"] = token;

      const sessionObj = new Session();
      sessionObj.userId = registerUserResponse._id;
      sessionObj.token = token;
      sessionObj.isLogin = true;
      await sessionObj.save();

      return Utility.response(res,
        registerUserResponse,
        i18n.__("USER_REGISTERED_SUCCESSFULLY"),
        httpStatus.OK,
        {},
        i18n.__("responseStatus.SUCCESS")
      );
    } catch (e) {
      e.resMsg = i18n.__("SOMETHING_WENT_WRONG");
      e.resCode = i18n.__("responseStatus.FAILURE")
      next(e);
    }
  },

  // login user
  login: async (req, res, next) => {
    const data = req.body;
    data.email = req.body.email.trim().toLowerCase();
    User.findOne({ email: data.email.toLowerCase() }, async (err, user) => {
      if (err) {
        const err = {};
        err.status = httpStatus.INTERNAL_SERVER_ERROR;
        err.resMsg = i18n.__("SOMETHING_WENT_WRONG");
        err.resCode = i18n.__("responseStatus.FAILURE")
        return next(err);
      }
      if (!user) {
        const err = {};
        err.status = httpStatus.NOT_FOUND;
        err.resMsg = i18n.__("USER_NOT_REGISTERED");
        err.resCode = i18n.__("responseStatus.FAILURE")
        return next(err);
      }

      bcrypt.compare(data.password, user.password, async (err, compare) => {
        if (!compare) {
          const err = {};
          err.status = httpStatus.UNAUTHORIZED;
          err.resMsg = i18n.__("INVALID_CREDENTIALS");
          err.resCode = i18n.__("responseStatus.FAILURE")
          return next(err);
        }
        try {
          const userSession = {
            userId: user._id.toString()
          }
          const checkLogin = await Session.checkSession(userSession);
          if (checkLogin.length) {
            await Session.removeSession({ userId: user._id });
          }

          let updatedUserResponse = await User.updatePlayerId({
            userId: user._id,
            playerId: req.headers["device-token"] ? req.headers["device-token"] : null,
          });

          const token = jwt.sign({
            id: user._id,
            email: user.email,
            userRole: user.role,
            userName: user["name"] ? user["name"] : "",
          }, AppConfig.JWTSECRET);

          user = user.toObject();
          updatedUserResponse = updatedUserResponse.toObject();
          user["token"] = token;
          updatedUserResponse["token"] = token;

          const sessionObj = new Session();
          sessionObj.userId = user._id;
          sessionObj.token = token;
          sessionObj.isLogin = true;
          const sessionResponse = sessionObj.save();

          delete user["password"];

          return Utility.response(res,
            updatedUserResponse,
            i18n.__("USER_SIGNED_IN_SUCCESSFULLY"),
            httpStatus.OK,
            {},
            i18n.__("responseStatus.SUCCESS")
          );
        } catch (e) {
          e.resMsg = i18n.__("SOMETHING_WENT_WRONG");
          e.resCode = i18n.__("responseStatus.FAILURE")
          next(e);
        }
      });
    });
  },

  // edit user
  edit: async (req, res, next) => {
    try {
      const user = req.body;
      user._id = req.user.id;
      user.passportExpiryDate = new Date(moment(req.body.passportExpiryDate));
      user.passportIssueDate = new Date(moment(req.body.passportIssueDate));
      /* Check if user already exists based on emailID */

      const getUserResponse = await User.getUserById(req.user.id);
      if (getUserResponse[0].email.toLowerCase() != user.email.toLowerCase()) {
        const getUserByEmailResponse = await User.existCheck(user.email);
        if (getUserByEmailResponse) {
          const err = {};
          err.status = httpStatus.CONFLICT;
          err.resMsg = i18n.__("EMAIL_ALREADY_EXISTS");
          err.resCode = i18n.__("responseStatus.ERROR")
          return next(err);
        }
      }
      if (getUserResponse[0].phone != user.phone) {
        const getUserByPhoneResponse = await User.existPhoneCheck(user.phone);
        if (getUserByPhoneResponse) {
          const err = {};
          err.status = httpStatus.CONFLICT;
          err.resMsg = i18n.__("PHONE_ALREADY_EXISTS");
          err.resCode = i18n.__("responseStatus.ERROR")
          return next(err);
        }
      }
      if (getUserResponse[0].passportNo != user.passportNo) {
        const getUserByPassportResponse = await User.existPassportCheckk(user.passportNo);
        if (getUserByPassportResponse) {
          const err = {};
          err.status = httpStatus.CONFLICT;
          err.resMsg = i18n.__("PASSPORT_ALREADY_EXISTS");
          err.resCode = i18n.__("responseStatus.ERROR")
          return next(err);
        }
      }

      let editUserResponse = await User.updateById(user);
      if (editUserResponse) {
        return Utility.response(res,
          editUserResponse,
          i18n.__("USER_UPDATED_SUCCESSFULLY"),
          httpStatus.OK,
          {},
          i18n.__("responseStatus.SUCCESS")
        );
      } else {
        const err = {};
        err.status = httpStatus.BAD_REQUEST;
        err.resMsg = i18n.__("UNABLE_TO_UPDATE_USER");
        err.resCode = i18n.__("responseStatus.FAILURE")
        return next(err);
      }
    } catch (e) {
      e.resMsg = i18n.__("SOMETHING_WENT_WRONG");
      e.resCode = i18n.__("responseStatus.FAILURE")
      next(e);
    }
  },

  // get user
  get: async (req, res, next) => {
    try {
      const getUserResponse = await User.getUserById(req.user.id);
      if (getUserResponse) {
        return Utility.response(res,
          getUserResponse[0],
          i18n.__("USER_RETRIEVED_SUCCESSFULLY"),
          httpStatus.OK,
          {},
          i18n.__("responseStatus.SUCCESS")
        );
      } else {
        const err = {};
        err.status = httpStatus.BAD_REQUEST;
        err.resMsg = i18n.__("UNABLE_TO_RETRIEVE_USER");
        err.resCode = i18n.__("responseStatus.FAILURE")
        return next(err);
      }
    } catch (e) {
      e.resMsg = i18n.__("SOMETHING_WENT_WRONG");
      e.resCode = i18n.__("responseStatus.FAILURE")
      next(e);
    }
  },

  /* Forgot Password * */
  forgotPassword: async (req, res) => {
    try {
      const reqObj = {
        email: req.body.email.toLowerCase(),
      };
      const getUserByRequestDataResponse = await User.getUserByRequestData(reqObj);

      if (!getUserByRequestDataResponse.length) {
        const err = {};
        err.status = httpStatus.NOT_FOUND;
        err.resMsg = i18n.__("USER_NOT_REGISTERED");
        err.resCode = i18n.__("responseStatus.FAILURE")
        return next(err);
      }

      // const randomCharacter = randomize('Aa0', 8);
      const randomCharacter = (Math.random() * Math.pow(36, 6) | 0).toString(36);

      const mailResponse = await Utility.sendMail(
        AppConfig.CONSTANT.MAIL.SENDER,
        getUserByRequestDataResponse[0].email,
        AppConfig.CONSTANT.MAIL.SUBJECT, `Here is your new password - ${randomCharacter}`,
      );

      if (!mailResponse) {
        const err = {};
        err.status = httpStatus.INTERNAL_SERVER_ERROR;
        err.resMsg = i18n.__("UNABLE_TO_RESET_PASSWORD");
        err.resCode = i18n.__("responseStatus.FAILURE")
        return next(err);
      }
      const updateObj = {
        _id: getUserByRequestDataResponse[0]._id,
        password: bcrypt.hashSync(randomCharacter, AppConfig.CONSTANT.SALT.ROUNDS),
      };
      const updatePasswordResponse = await User.updatePassword(updateObj);

      if (!updatePasswordResponse) {
        const err = {};
        err.status = httpStatus.INTERNAL_SERVER_ERROR;
        err.resMsg = i18n.__("UNABLE_TO_RESET_PASSWORD");
        err.resCode = i18n.__("responseStatus.FAILURE")
        return next(err);
      }
      return Utility.response(res,
        {},
        i18n.__("PASSWORD_RETRIEVED_SUCCESSFULLY"),
        httpStatus.OK,
        {},
        i18n.__("responseStatus.SUCCESS")
      );
    } catch (e) {
      e.resMsg = i18n.__("SOMETHING_WENT_WRONG");
      e.resCode = i18n.__("responseStatus.FAILURE")
      next(e);
    }
  },


  /* update Password * */
  updatePassword: async (req, res, next) => {
    try {
      const oldPassword = req.body.oldPassword;
      const newPassword = req.body.newPassword;

      const getUserResponse = await User.getUserById(req.user.id);

      if (oldPassword === newPassword) {
        return Utility.response(res,
          {},
          i18n.__("NOTHING_TO_UPDATE"),
          httpStatus.NO_CONTENT,
          i18n.__("responseStatus.ERROR")
        );
      }
      if (!getUserResponse.length) {
        return Utility.response(res,
          {},
          i18n.__("USER_NOT_REGISTERED"),
          httpStatus.NOT_FOUND,
          i18n.__("responseStatus.FAILURE")
        );
      }
      const matchResult = bcrypt.compareSync(oldPassword, getUserResponse[0].password);

      if (!matchResult) {
        return Utility.response(res,
          {},
          i18n.__("OLD_PASSWORD_DO_NOT_MATCH"),
          httpStatus.CONFLICT,
          i18n.__("responseStatus.ERROR")
        );
      }
      const updateObj = {
        _id: getUserResponse[0]._id,
        password: await module.exports.generatePasswordHash(newPassword)
      };
      const updatePasswordResponse = await User.updatePassword(updateObj);

      if (!updatePasswordResponse.nModified) {
        return Utility.response(res,
          {},
          i18n.__("UNABLE_TO_RESET_PASSWORD"),
          httpStatus.INTERNAL_SERVER_ERROR,
          i18n.__("responseStatus.FAILURE")
        );
      }
      return Utility.response(res,
        {},
        i18n.__("PASSWORD_CHANGED_SUCCESSFULLY"),
        httpStatus.OK,
        {},
        i18n.__("responseStatus.SUCCESS")
      );
    } catch (e) {
      e.resMsg = i18n.__("UNABLE_TO_CHANGE_PASSWORD");
      e.resCode = i18n.__("responseStatus.FAILURE")
      next(e);
    }
  },

  /* Logout  * */
  logout: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const removeSessionResponse = await Session.removeSession({ userId: userId });

      if (removeSessionResponse.nModified < 0) {
        return Utility.response(res,
          {},
          i18n.__("USER_NOT_REGISTERED"),
          httpStatus.NOT_FOUND,
          i18n.__("responseStatus.FAILURE")
        );
      }
      return Utility.response(res,
        {},
        i18n.__("USER_LOGOUT_SUCCESSFULLY"),
        httpStatus.OK,
        {},
        i18n.__("responseStatus.SUCCESS")
      );
    } catch (e) {
      e.resMsg = i18n.__("UNABLE_TO_RESET_PASSWORD");
      e.resCode = i18n.__("responseStatus.FAILURE")
      next(e);
    }
  },

  uploadFile: async (req, res, next) => {
    try {
      if (!req.file) {
        const e = {};
        e.status = httpStatus.BAD_REQUEST;
        e.resMsg = i18n.__("SOMETHING_WENT_WRONG");
        e.resCode = i18n.__("responseStatus.FAILURE")
        return next(e);
      }
      return Utility.response(res,
        {
          document: req.file.filename
        },
        i18n.__("FILE_UPLOADED"),
        httpStatus.OK,
        {},
        i18n.__("responseStatus.SUCCESS")
      );
    } catch (e) {
      e.resMsg = i18n.__("SOMETHING_WENT_WRONG");
      e.resCode = i18n.__("responseStatus.FAILURE")
      next(e);
    }
  },

  uploadMultiple: async (req, res, next) => {
    try {
      if (!req.files) {
        const e = {};
        e.status = httpStatus.BAD_REQUEST;
        e.resMsg = i18n.__("SOMETHING_WENT_WRONG");
        e.resCode = i18n.__("responseStatus.FAILURE")
        return next(e);
      }
      const documents = [];
      req.files.forEach(obj => {
        documents.push(obj.filename);
      });
      return Utility.response(res,
        {
          document: documents
        },
        i18n.__("FILE_UPLOADED"),
        httpStatus.OK,
        {},
        i18n.__("responseStatus.SUCCESS")
      );
    } catch (e) {
      e.resMsg = i18n.__("SOMETHING_WENT_WRONG");
      e.resCode = i18n.__("responseStatus.FAILURE")
      next(e);
    }
  },


  /* add medical certificates * */
  addMedicalCertificates: async (req, res, next) => {
    try {
      const reqObj = req.body;
      reqObj._id = req.user.id;
      async.eachSeries(reqObj.medicalCertificates, function (obj, callback) {
        (async () => {
          try {
            obj.issueDate = new Date(moment(obj.issueDate).format());
            callback();
          } catch (err) {
            callback(err);
          }
        })();
      }, async function (err) {
        if (err) {
          err.status = httpStatus.BAD_REQUEST;
          err.resMsg = i18n.__("UNABLE_TO_ADD_MEDICAL_CERTIFICATES");
          err.resCode = i18n.__("responseStatus.FAILURE")
          return next(err);
        } else {
        }

      });
      const addRecord = await User.updateById(reqObj);
      if (addRecord) {
        return Utility.response(res,
          addRecord,
          i18n.__("ADD_MEDICAL_CERTIFICATES"),
          httpStatus.OK,
          {},
          i18n.__("responseStatus.SUCCESS")
        );
      } else {
        const err = {};
        err.status = httpStatus.BAD_REQUEST;
        err.resMsg = i18n.__("UNABLE_TO_ADD_MEDICAL_CERTIFICATES");
        err.resCode = i18n.__("responseStatus.FAILURE")
        return next(err);
      }
    } catch (e) {
      e.resMsg = i18n.__("SOMETHING_WENT_WRONG");
      e.resCode = i18n.__("responseStatus.FAILURE")
      next(e);
    }
  },

  // get medical certificates
  getMedicalCertificates: async (req, res, next) => {
    try {
      const getUserResponse = await User.getUserById(req.user.id);
      if (getUserResponse && getUserResponse[0].medicalCertificates && getUserResponse[0].medicalCertificates.length) {
        return Utility.response(res,
          getUserResponse[0].medicalCertificates,
          i18n.__("MEDICAL_CERTIFICATES_RETRIEVED_SUCCESSFULLY"),
          httpStatus.OK,
          {},
          i18n.__("responseStatus.SUCCESS")
        );
      } else {
        const err = {};
        err.status = httpStatus.BAD_REQUEST;
        err.resMsg = i18n.__("UNABLE_TO_RETRIEVE_MEDICAL_CERTIFICATES");
        err.resCode = i18n.__("responseStatus.FAILURE")
        return next(err);
      }
    } catch (e) {
      e.resMsg = i18n.__("SOMETHING_WENT_WRONG");
      e.resCode = i18n.__("responseStatus.FAILURE")
      next(e);
    }
  },

  // get all users list
  getList: async (req, res, next) => {
    try {
      const reqObj = {
        recordPerPage: req.query.recordPerPage ? Number(req.query.recordPerPage) : 5,
        pageNo: req.query.pageNo ? Number(req.query.pageNo) : 1
      }
      let sort = {};
      if (req.query.sortingKey && req.query.sortBy) {
        sort[req.query.sortingKey] = Number(req.query.sortBy);
      } else {
        sort["createdAt"] = -1;
      }
      const getUserResponse = await User.getUserList(reqObj, sort);

      if (getUserResponse) {
        return Utility.response(res,
          getUserResponse,
          i18n.__("USER_RETRIEVED_SUCCESSFULLY"),
          httpStatus.OK,
          {},
          i18n.__("responseStatus.SUCCESS")
        );
      } else {
        const err = {};
        err.status = httpStatus.BAD_REQUEST;
        err.resMsg = i18n.__("UNABLE_TO_RETRIEVE_USER");
        err.resCode = i18n.__("responseStatus.FAILURE")
        return next(err);
      }
    } catch (e) {
      e.resMsg = i18n.__("SOMETHING_WENT_WRONG");
      e.resCode = i18n.__("responseStatus.FAILURE")
      next(e);
    }
  },

  // get user
  getUserDetails: async (req, res, next) => {
    try {
      const getUserResponse = await User.getUserById(req.query.id);

      if (getUserResponse) {
        return Utility.response(res,
          getUserResponse[0],
          i18n.__("USER_RETRIEVED_SUCCESSFULLY"),
          httpStatus.OK,
          {},
          i18n.__("responseStatus.SUCCESS")
        );
      } else {
        const err = {};
        err.status = httpStatus.BAD_REQUEST;
        err.resMsg = i18n.__("UNABLE_TO_RETRIEVE_USER");
        err.resCode = i18n.__("responseStatus.FAILURE")
        return next(err);
      }
    } catch (e) {
      e.resMsg = i18n.__("SOMETHING_WENT_WRONG");
      e.resCode = i18n.__("responseStatus.FAILURE")
      next(e);
    }
  },

}

