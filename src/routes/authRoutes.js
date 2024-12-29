const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/request-otp", authController.requestOTP);
router.post("/verify-otp", authController.verifyOTP);
router.post("/check-subdomain", authController.checkSubdomain);
router.post("/check-phone", authController.checkPhoneAvailability);
router.post("/validate-token", authController.validateToken);

module.exports = router;
