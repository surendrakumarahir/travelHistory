/* eslint-disable max-len,object-shorthand */
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    default: ''
  },
  countryCode: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
    required: true,
  },
  passportNo: {
    type: String,
    required: true,
    unique: true
  },
  playerId: {
    type: String
  },
  passportIssueDate: {
    type: Date
  },
  passportExpiryDate: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  profilePic: {
    type: String
  },
  medicalCertificates: [{
    title: {
      type: String
    },
    comment: {
      type: String
    },
    issueDate: {
      type: Date
    },
    status: {
      type: String,
      default: "created",
      enum: ["approved", "rejected", "created"]
    },
    documents: [{
      hash: {
        type: String
      },
      fileName: {
        type: String
      },
      ext: {
        type: String
      }
    }]
  }],
}, { timestamps: true });

UserSchema.method({
  saveUser() {
    return this.save();
  },
});

UserSchema.static({
  getUserList(reqObj, sort) {
    return this.aggregate([{
      $match: {
        isDeleted: false
      }
    }, {
      $sort: sort
    }, {
      $project: {
        name: 1,
        phone: 1,
        countryCode: 1,
        city: 1,
        country: 1,
        email: 1,
        role: 1,
        passportNo: 1,
        passportIssueDate: 1,
        passportExpiryDate: 1,
        profilePic: 1,
        medicalCertificates: 1,
        createdAt: 1
      }
    }, {
      $facet: {
        users: [{
          $skip: reqObj.recordPerPage * (reqObj.pageNo - 1)
        }, {
          $limit: reqObj.recordPerPage
        }],
        totalUsers: [{
          $count: "count"
        }]
      }
    }, {
      $project: {
        users: 1,
        totalRecords: { $arrayElemAt: ["$totalUsers.count", 0] },
      }
    },
    ]);
  },
  // Use this to check user existence by email
  existCheck(email) {
    return this.findOne({ email: email, isDeleted: false });
  },// Use this to check user existence by phone
  existPhoneCheck(phone) {
    return this.findOne({ phone: phone, isDeleted: false });
  },// Use this to check user existence by passport no
  existPassportCheckk(passportNo) {
    return this.findOne({ passportNo: passportNo, isDeleted: false });
  },
  getUserByEmail(emailId) {
    return this.find({ email: emailId, isDeleted: false });
  },
  getUserById(userId) {
    // return this.find({ _id: userId, isDeleted: 0 });
    return this.aggregate([{
      $match: {
        _id: ObjectId(userId),
        isDeleted: false,
      }
    }, {
      $project: {
        name: 1,
        phone: 1,
        countryCode: 1,
        city: 1,
        country: 1,
        email: 1,
        role: 1,
        passportNo: 1,
        passportIssueDate: 1,
        passportExpiryDate: 1,
        profilePic: 1,
        medicalCertificates: 1
      }
    }
    ]);
  },
  getUserByRequestData(reqObj) {
    // return this.find({ _id: userId, isDeleted: 0 });
    return this.aggregate([{
      $match: {
        email: reqObj.email,
        isDeleted: false,
      }
    }
    ]);
  },
  updatePassword(reqObj) {
    return this.updateOne({
      _id: ObjectId(reqObj._id),
      isDeleted: false
    }, {
      $set: {
        password: reqObj.password
      }
    });
  },
  updateById(reqObj) {
    return this.findOneAndUpdate({
      _id: reqObj._id,
      isDeleted: false
    }, {
      $set: reqObj
    }, {
      $project: {
        name: 1,
        phone: 1,
        countryCode: 1,
        city: 1,
        country: 1,
        email: 1,
        role: 1,
        passportNo: 1,
        passportIssueDate: 1,
        passportExpiryDate: 1,
        profilePic: 1,
        medicalCertificates: 1
      }
    });
  },
  updatePlayerId(reqObj) {
    return this.findOneAndUpdate({
      _id: ObjectId(reqObj.userId)
    }, {
      $set: {
        playerId: reqObj.playerId,
      },
    }, {
      new: true
    });
  },
  updateCertificate(reqObj) {
    return this.findOneAndUpdate({
      _id: ObjectId(reqObj.userId),
      isDeleted: false,
      "medicalCertificates._id": reqObj.certificateId
    }, {
      $set: {
        "medicalCertificates.$.status": reqObj.status,
        "medicalCertificates.$.comment": reqObj.comment
      }
    }, {
      new: true
    });
  },

});

module.exports = mongoose.model('User', UserSchema);
