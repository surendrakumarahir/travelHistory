/* eslint-disable max-len,no-underscore-dangle,dot-notation,object-shorthand,no-use-before-define */
const moment = require("moment");
const i18n = require("i18n");
const Travel = require("../model/travel");
const User = require("../model/user");
const Utility = require("../utility/util");
const NotificationConstant = require("../locales/notifications.json");
const httpStatus = require("../exceptions/httpStatusCodes.json");
const FabricController = require("./fabricController.js");
const _ = require("lodash");

module.exports = {

  getAllRecords: async (req, res, next) => {
    try {
      const reqObj = {
        startDateRange: req.query.startDate,
        endDateRange: req.query.endDate
      }

      const pageNo = Number(req.query.pageNo) || 1;
      const recordPerPage = Number(req.query.recordPerPage) || 5;
      const skip = recordPerPage * (pageNo - 1);
      const limit = skip + recordPerPage; 
      const sortingKey = req.query.sortingKey && req.query.sortingKey;
      let sortBy = "desc";
      if (req.query.sortBy == "1") {
        sortBy = "asc";
      }

      //get data from BC
      const getAllRecords = await FabricController.callChaincode('readTravelRecord', reqObj, true);

      if (!getAllRecords && getAllRecords.length == 0) {
        const err = {};
        err.status = httpStatus.BAD_REQUEST;
        err.resMsg = i18n.__("UNABLE_TO_RETRIEVE_RECORD");
        err.resCode = i18n.__("responseStatus.FAILURE")
        return next(err);
      }

      if (sortingKey) {
        getAllRecords.results = _.orderBy(getAllRecords.results, [sortingKey], [sortBy]);
      }

      return Utility.response(res,
        {
          records: getAllRecords.results.slice(skip, limit),
          totalRecords: getAllRecords.results.length
        },
        i18n.__("RECORD_FETCHED_SUCCESSFULLY"),
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

  approveOrRejectRecord: async (req, res, next) => {
    try {
      const reqObj = {
        travelId: req.params.id,
        status: req.body.status.toLowerCase(),
        comment: req.body.comment
      }
      const updateRecordResponse = await FabricController.callChaincode('updateTravelRecord', reqObj);
      if (!updateRecordResponse) {
        const err = {};
        err.status = httpStatus.BAD_REQUEST;
        err.resMsg = i18n.__("UNABLE_TO_APPROVE_REJECT_RECORD");
        err.resCode = i18n.__("responseStatus.FAILURE")
        return next(err);
      }
      let resMsg = "";

      const getUserResponse = await User.getUserById(req.user.id);
      const notificationObj = {
        playerId: getUserResponse[0].playerId,
        title: NotificationConstant.PUSH.TITLE.RECORD_UPDATED
      };

      if (reqObj.status == "approved") {
        resMsg = i18n.__("RECORD_APPROVED_SUCCESSFULLY");
        notificationObj.body = NotificationConstant.PUSH.BODY.RECORD_APPROVED;
      } else {
        resMsg = i18n.__("RECORD_REJECTED_SUCCESSFULLY");
        notificationObj.body = NotificationConstant.PUSH.BODY.RECORD_REJECTED;
      }
      await Utility.createNotification(notificationObj)

      return Utility.response(res,
        updateRecordResponse,
        resMsg,
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

  approveOrRejectMedicalCertificates: async (req, res, next) => {
    try {
      const reqObj = {
        userId: req.params.id,
        status: req.body.status.toLowerCase(),
        certificateId: req.body.certificateId,
        comment: req.body.comment ? req.body.comment : ""
      }
      const updateRecordResponse = await User.updateCertificate(reqObj);
      if (!updateRecordResponse) {
        const err = {};
        err.status = httpStatus.BAD_REQUEST;
        err.resMsg = i18n.__("UNABLE_TO_APPROVE_REJECT_RECORD");
        err.resCode = i18n.__("responseStatus.FAILURE")
        return next(err);
      }
      let resMsg = "";

      const getUserResponse = await User.getUserById(reqObj.userId);
      const notificationObj = {
        playerId: getUserResponse[0].playerId,
        title: NotificationConstant.PUSH.TITLE.CERTIFICATE_UPDATED
      };

      if (reqObj.status == "approved") {
        resMsg = i18n.__("RECORD_APPROVED_SUCCESSFULLY");
        notificationObj.body = NotificationConstant.PUSH.BODY.CERTIFICATE_APPROVED;
      } else {
        resMsg = i18n.__("RECORD_REJECTED_SUCCESSFULLY");
        notificationObj.body = NotificationConstant.PUSH.BODY.CERTIFICATE_REJECTED;
      }
      await Utility.createNotification(notificationObj)

      return Utility.response(res,
        updateRecordResponse,
        resMsg,
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

}
