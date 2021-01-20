const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const AirlineSchema = new mongoose.Schema({
  name: {
    type: String
  },
  code: {
    type: String
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

AirlineSchema.method({
});

AirlineSchema.static({
  getAirlines() {
    return this.find({
      isDeleted: false
    }, {
      name: 1,
      code: 1
    });
  },
});

module.exports = mongoose.model('Airline', AirlineSchema);  