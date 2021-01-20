const express = require("express");
const router = express.Router();
const TravelController = require("../controller/travelController");
const AdminController = require("../controller/adminController");
const Validator = require("../middlewere/validation");
const Authorize = require("../middlewere/auth");
const multer = require('multer');
const path = require('path');

let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});


const upload = multer({
    storage: storage
});

router.post("/record", Authorize.auth, Validator.travel, TravelController.addRecord);
router.get("/record", Authorize.auth, TravelController.getRecord);
router.get("/allRecord", Authorize.auth, AdminController.getAllRecords);
router.put("/status/:id", Authorize.auth, AdminController.approveOrRejectRecord);
router.delete("/status/:id", Authorize.auth, TravelController.deleteRecord);
router.post("/uploadFile", Authorize.auth, upload.single('doc'), TravelController.addFileToIpfs);
router.get("/airlines", TravelController.getAirlines);
router.get("/countries", TravelController.getCountry);

module.exports = router;
