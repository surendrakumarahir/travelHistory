const express = require("express");
const router = express.Router();
const UserController = require("../controller/user");
const AdminController = require("../controller/adminController");
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

router.post("/register", UserController.register);

router.put("/edit", Authorize.auth, UserController.edit);

router.get("/get", Authorize.auth, UserController.get);

router.get("/getUserList", Authorize.auth, UserController.getList);

router.get("/getUserDetails", Authorize.auth, UserController.getUserDetails);

router.post("/login", UserController.login);

router.get("/logout/", Authorize.auth, UserController.logout);

router.post("/forgot-password", UserController.forgotPassword);

router.put("/update-password/", Authorize.auth, UserController.updatePassword);

router.put("/certificateStatus/:id/", Authorize.auth, AdminController.approveOrRejectMedicalCertificates);

router.post("/medicalRecord/", Authorize.auth, UserController.addMedicalCertificates);

router.get("/medicalRecord/", Authorize.auth, UserController.getMedicalCertificates);

router.post("/upload/", Authorize.auth, upload.single('doc'), UserController.uploadFile);

router.post("/uploadMultiple/", Authorize.auth, upload.array('doc', 5), UserController.uploadMultiple);

module.exports = router;