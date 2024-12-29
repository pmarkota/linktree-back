const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { body } = require("express-validator");
const validate = require("../middleware/validate");

// Handle preflight for all auth routes
router.options("*", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.status(200).end();
});

// Phone number validation middleware
const validatePhone = body("phone_number")
  .trim()
  .notEmpty()
  .withMessage("Phone number is required")
  .matches(/^\+?[1-9]\d{1,14}$/)
  .withMessage("Please enter a valid phone number");

// Routes
router.post("/request-otp", validatePhone, validate, authController.requestOTP);
router.post("/verify-otp", authController.verifyOTP);
router.post("/check-subdomain", authController.checkSubdomain);
router.post("/validate-token", authController.validateToken);
router.post("/check-phone", authController.checkPhoneAvailability);

module.exports = router;
