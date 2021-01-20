/* eslint-disable max-len,no-underscore-dangle,dot-notation,object-shorthand,no-use-before-define */
const i18n = require("i18n");
const mongoose = require("mongoose");
const User = require("../model/user");
const Travel = require("../model/travel");
const Airline = require("../model/airline");
const Country = require("../model/countries");
const moment = require("moment");
const Utility = require("../utility/util");
const httpStatus = require("../exceptions/httpStatusCodes.json");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const ipfsClient = require("ipfs-http-client")
const FabricController = require("./fabricController.js");
// connect to ipfs daemon API server
const ipfs = ipfsClient({ host: "3.17.152.73", port: "5001", protocol: "http" })

module.exports = {

  /* add record * */
  addRecord: async (req, res, next) => {
    try {
      const travel = req.body;
      travel.userId = req.user.id;
      travel.email = req.user.email;
      travel.status = "PENDING";
      travel.arrivalDate = new Date(moment(travel.arrivalDate).format());
      travel.departureDate = new Date(moment(travel.departureDate).format());
      travel.createdAt = new Date(moment().format());
      travel.updatedAt = new Date(moment().format());
      travel.travelMode = travel.travelMode.toLowerCase();
      travel.isDeleted = false;
      const userResponse = await User.getUserById(travel.userId);
      travel.passportNo = userResponse[0].passportNo;
      travel.passportIssueDate = userResponse[0].passportIssueDate;
      travel.passportExpiryDate = userResponse[0].passportExpiryDate;
      travel.name = userResponse[0].name;

      //save to hyperledger
      const addRecord = await FabricController.callChaincode('createTravelRecord', travel);

      if (!addRecord || (addRecord && addRecord.status && addRecord.status.toUpperCase() == "FAILED")) {
        const err = {};
        err.status = httpStatus.BAD_REQUEST;
        err.resMsg = i18n.__("UNABLE_TO_ADD_RECORD");
        err.resCode = i18n.__("responseStatus.FAILURE")
        return next(err);
      } else {
        return Utility.response(res,
          addRecord,
          i18n.__("RECORD_ADDED_SUCCESSFULLY"),
          httpStatus.OK,
          {},
          i18n.__("responseStatus.SUCCESS")
        );
      }
    } catch (e) {
      e.resMsg = i18n.__("SOMETHING_WENT_WRONG");
      e.resCode = i18n.__("responseStatus.FAILURE")
      next(e);
    }
  },

  /* get record * */
  getRecord: async (req, res, next) => {
    try {
      const reqObj = {
        isDeleted: false
      };
      let sort = {};
      if (req.user.userRole.toLowerCase() == AppConfig.CONSTANT.USER_ROLE.USER) {
        reqObj.userId = req.user.id;
      } else {
        if (req.query.travelId) {
          reqObj.travelId = req.query.travelId;
        } else {
          if (req.query.passportNo) {
            reqObj.passportNo = req.query.passportNo;
          }
          if (req.query.email) {
            const getUserByRequestDataResponse = await User.getUserByRequestData({
              email: req.query.email.toLowerCase(),
            });
            if (getUserByRequestDataResponse.length == 0) {
              const err = {};
              err.status = httpStatus.BAD_REQUEST;
              err.resMsg = i18n.__("UNABLE_TO_RETRIEVE_RECORD");
              err.resCode = i18n.__("responseStatus.FAILURE")
              return next(err);
            }
            reqObj.userId = getUserByRequestDataResponse[0]._id;
          }
          if (req.query.sortingKey && req.query.sortBy) {
            sort[req.query.sortingKey] = Number(req.query.sortBy);
          }
        }
      }

      const sortingKey = req.query.sortingKey && req.query.sortingKey;
      let sortBy = "desc";
      if (req.query.sortBy == "1") {
        sortBy = "asc";
      }

      //get data from BC
      const getRecord = await FabricController.callChaincode('readTravelRecord', reqObj, true);

      if (getRecord.length == 0 || getRecord.results.length == 0 || Object.keys(getRecord.results[0]).length == 0) {
        const err = {};
        err.status = httpStatus.BAD_REQUEST;
        err.resMsg = i18n.__("UNABLE_TO_RETRIEVE_RECORD");
        err.resCode = i18n.__("responseStatus.FAILURE")
        return next(err);
      } else {
        if (sortingKey) {
          getRecord.results = _.orderBy(getRecord.results, [sortingKey], [sortBy]);
        }
        return Utility.response(res,
          {
            records: getRecord.results,
            totalRecords: getRecord.results.length
          },
          i18n.__("RECORD_FETCHED_SUCCESSFULLY"),
          httpStatus.OK,
          {},
          i18n.__("responseStatus.SUCCESS")
        );
      }
    } catch (e) {
      e.resMsg = i18n.__("SOMETHING_WENT_WRONG");
      e.resCode = i18n.__("responseStatus.FAILURE")
      next(e);
    }
  },

  deleteRecord: async (req, res, next) => {
    try {
      const reqObj = {
        recordId: req.params.id
      }
      const removeRecordResponse = await Travel.removeRecordById(reqObj);
      if (!removeRecordResponse) {
        const err = {};
        err.status = httpStatus.BAD_REQUEST;
        err.resMsg = i18n.__("UNABLE_TO_REMOVE_RECORD");
        err.resCode = i18n.__("responseStatus.FAILURE")
        return next(err);
      }
      return Utility.response(res,
        {},
        i18n.__("RECORD_REMOVED_SUCCESSFULLY"),
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

  addFileToIpfs: async (req, res, next) => {
    try {
      if (!req.file) {
        const e = {};
        e.status = httpStatus.BAD_REQUEST;
        e.resMsg = i18n.__("SOMETHING_WENT_WRONG");
        e.resCode = i18n.__("responseStatus.FAILURE")
        return next(e);
      }
      const data = fs.readFileSync(req.file.path);
      const filesAdded = await ipfs.add({
        path: req.file.path,
        content: data
      });

      for await (const file of filesAdded) {
        //removing file
        // fs.unlinkSync("./public/uploads/" + req.file.filename);
        return Utility.response(res,
          {
            hash: file.cid.toString(),
            ext: path.extname(req.file.originalname),
            fileName: req.file.filename,
          },
          i18n.__("HASH_STORED_SUCESSFULLY_ON_IPFS"),
          httpStatus.OK,
          {},
          i18n.__("responseStatus.SUCCESS")
        );
      }
    } catch (e) {
      e.resMsg = i18n.__("SOMETHING_WENT_WRONG");
      e.resCode = i18n.__("responseStatus.FAILURE")
      return next(e);
    }
  },

  getFileFromIpfs: async (hashArray) => {
    try {
      const node = await IPFS.create({ silent: true });
      hashArray.forEach(async element => {
        const fileFetched = await node.cat(element.hash);
        for await (const file of fileFetched) {
          fs.writeFile(`./public/uploads/${element.fileName}`, file, (err, ans) => {
            if (err) throw err;
            console.log("The file has been saved!", ans);
            node.stop();
          });
        }
      });
    } catch (e) {
      e.resMsg = i18n.__("SOMETHING_WENT_WRONG");
      e.resCode = i18n.__("responseStatus.FAILURE");
      return e;
    }
  },

  getAirlines: async (req, res, next) => {
    try {
      const getAirlines = await Airline.getAirlines();
      if (getAirlines && getAirlines.length) {
        const requiredAirlines = getAirlines.filter(el => el.name.toLowerCase().startsWith(req.query.string.toLowerCase().trim()))
        return Utility.response(res,
          requiredAirlines,
          i18n.__("AIRLINES_FETCHED_SUCCESSFULLY"),
          httpStatus.OK,
          {},
          i18n.__("responseStatus.SUCCESS")
        );
      } else {
        const err = {};
        err.status = httpStatus.BAD_REQUEST;
        err.resMsg = i18n.__("UNABLE_TO_RETRIEVE_AIRLINES");
        err.resCode = i18n.__("responseStatus.FAILURE")
        return next(err);
      }
    } catch (e) {
      e.resMsg = i18n.__("SOMETHING_WENT_WRONG");
      e.resCode = i18n.__("responseStatus.FAILURE")
      return next(e);
    }
  },

  getCountry: async (req, res, next) => {
    try {
      let getCountry;
      if (req.query.id) {
        getCountry = await Country.getCountryDetailById();
      } else {
        getCountry = await Country.getCountryDetails();
      }
      if (getCountry && getCountry.length) {
        return Utility.response(res,
          getCountry,
          i18n.__("COUNTRIES_FETCHED_SUCCESSFULLY"),
          httpStatus.OK,
          {},
          i18n.__("responseStatus.SUCCESS")
        );
      } else {
        const err = {};
        err.status = httpStatus.BAD_REQUEST;
        err.resMsg = i18n.__("UNABLE_TO_RETRIEVE_COUNTRIES");
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
