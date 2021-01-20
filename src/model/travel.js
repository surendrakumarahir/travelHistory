const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const TravelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  toCity: {
    type: String
  },
  comment: {
    type: String
  },
  fromCity: {
    type: String
  },
  airline: {
    type: String
  },
  flightNo: {
    type: String
  },
  departureDate: {
    type: Date
  },
  arrivalDate: {
    type: Date
  },
  eTicket: {
    hash: {
      type: String
    },
    fileName: {
      type: String
    },
    ext: {
      type: String
    }
  },
  passportStamp: {
    hash: {
      type: String
    },
    fileName: {
      type: String
    },
    ext: {
      type: String
    }
  },
  entryPort: {
    type: String
  },
  exitPort: {
    type: String
  },
  travelMode: {
    type: String
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    default: "created",
    enum: ["approved", "rejected", "created"]
  },
}, { timestamps: true });

// Create a method to add payment
TravelSchema.methods.addRecord = function () {
  return this.save();
};

TravelSchema.statics = {
  getRecordById(reqObj, passportNo, sort) {
    return this.aggregate([{
      $match: reqObj
    }, {
      $lookup: {
        from: "users",
        let: { userId: "$userId", passportNo: passportNo },
        pipeline: [{
          $match: {
            $expr: {
              $cond: [{
                $gt: ["$$passportNo", 1]
              }, {
                $and: [
                  { $eq: ["$_id", "$$userId"], },
                ]
              }, {
                $and: [
                  { $eq: ["$_id", "$$userId"], },
                  { $eq: ["$passportNo", "$$passportNo"] }
                ]
              }],
            },
          }
        }, {
          $project: {
            _id: 0,
            name: 1,
            email: 1,
            passportNo: 1,
            passportIssueDate: 1,
            passportExpiryDate: 1,
            medicalCertificates: 1
          }
        }],
        as: "users"
      }
    }, {
      $unwind: { path: "$users" }
    }, {
      $project: {
        userId: 1,
        toCity: 1,
        fromCity: 1,
        airline: 1,
        flightNo: 1,
        passportNo: "$users.passportNo",
        passportIssueDate: "$users.passportIssueDate",
        passportExpiryDate: "$users.passportExpiryDate",
        departureDate: 1,
        arrivalDate: 1,
        eTicket: 1,
        passportStamp: 1,
        isDeleted: 1,
        status: 1,
        email: "$users.email",
        name: "$users.name",
        comment: 1,
        entryPort: 1,
        exitPort: 1,
        travelMode: 1,
        createdAt: 1,
        medicalCertificates: "$users.medicalCertificates"
      }
    }, {
      $sort: sort
    }
    ]);
  },
  getAllRecords(reqObj, sort) {
    const searchObj = {};
    if (reqObj.startDate && reqObj.endDate) {
      searchObj.isDeleted = false;
      searchObj.departureDate = {
        $gte: new Date(reqObj.startDate),
        $lte: new Date(reqObj.endDate)
      };
    } else {
      searchObj.isDeleted = false;
    }
    return this.aggregate([{
      $match: searchObj
    }, {
      $lookup: {
        from: "users",
        let: { userId: "$userId" },
        pipeline: [{
          $match: {
            $expr: {
              $eq: ["$_id", "$$userId"]
            },
          }
        }, {
          $project: {
            _id: 0,
            name: 1,
            email: 1,
            passportNo: 1,
            passportIssueDate: 1,
            passportExpiryDate: 1,
            medicalCertificates: 1
          }
        }],
        as: "users"
      }
    }, {
      $unwind: { path: "$users" }
    }, {
      $project: {
        userId: 1,
        toCity: 1,
        fromCity: 1,
        airline: 1,
        flightNo: 1,
        passportNo: "$users.passportNo",
        passportIssueDate: "$users.passportIssueDate",
        passportExpiryDate: "$users.passportExpiryDate",
        departureDate: 1,
        arrivalDate: 1,
        eTicket: 1,
        passportStamp: 1,
        isDeleted: 1,
        status: 1,
        email: "$users.email",
        name: "$users.name",
        comment: 1,
        entryPort: 1,
        exitPort: 1,
        travelMode: 1,
        createdAt: 1,
        medicalCertificates: "$users.medicalCertificates"
      }
    },{
      $sort: sort
    }, {
      $facet: {
        records: [{
          $skip: reqObj.recordPerPage * (reqObj.pageNo - 1)
        }, {
          $limit: reqObj.recordPerPage
        }],
        totalRecords: [{
          $count: "count"
        }]
      }
    }, {
      $project: {
        records: 1,
        totalRecords: { $arrayElemAt: ["$totalRecords.count", 0] },
      }
    },
    ]);
  },
  updateRecord(reqObj) {
    return this.findOneAndUpdate({
      _id: reqObj.recordId,
      isDeleted: false,
      status: "created"
    }, {
      $set: {
        status: reqObj.status,
        comment: reqObj.comment
      }
    }, {
      new: true
    });
  },
  removeRecordById(reqObj) {
    return this.findOneAndUpdate({
      _id: reqObj.recordId,
      isDeleted: false
    }, {
      $set: {
        isDeleted: true
      }
    }, {
      new: true
    });
  }
};

module.exports = mongoose.model('Travel', TravelSchema);