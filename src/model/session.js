const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const SessionSchema = new mongoose.Schema({

  userId: { type: mongoose.Schema.ObjectId, ref: 'User' },
  token: { type: String, default: '' },
  isLogin: { type: Boolean, default: false }
},{ timestamps: true });

SessionSchema.method({
  saveSession() {
    return this.save();
  },
});

SessionSchema.static({
  removeSession(sessionObj) {
    return this.updateMany(sessionObj, { $set: { isLogin: 0 } }, { multi: true });
  },
  removeSessionList(sessionList) {
    return this.updateMany({ _id: { $in: sessionList } }, { $set: { isLogin: 0 } }, { multi: true });
  },
  getSession(reqObj) {
    return this.find(reqObj).sort({ addedOn: -1 }).limit(1);
  },
  checkSession(reqObj) {
    return this.find({
      userId: ObjectId(reqObj.userId),
      isLogin: 1
    });
    // return this.find(reqObj);
  }
});

module.exports = mongoose.model('Session', SessionSchema);  