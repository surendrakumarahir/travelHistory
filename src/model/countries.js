const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;

const CountrySchema = new mongoose.Schema({
  name: {
    type: String
  },
  iso: {
    type: String
  },
  phoneCode: {
    type: String
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

CountrySchema.method({
});

CountrySchema.static({
  getCountryDetails() {
    return this.find({
      isDeleted: false
    }, {
      name: 1,
      iso: 1,
      phoneCode: 1
    });
  },
  getCountryDetailById(id) {
    return this.aggregate([{
      $match: {
        $or: [{
          name: id
        }, {
          iso: id
        }, {
          phoneCode: id
        }],
        isDeleted: false,
      }
    }, {
      $project: {
        name: 1,
        iso: 1,
        phoneCode: 1
      }
    }
    ]);
  },
});

module.exports = mongoose.model("Country", CountrySchema);  