const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const {
  requestOTP,
  verifyOTP,
  checkSubdomain,
  validateToken,
} = require("../controllers/authController");
const validate = require("../middleware/validate");
const { auth } = require("../middleware/auth");

// Validation middleware
const validatePhoneNumber = body("phoneNumber")
  .notEmpty()
  .matches(/^\+?[1-9]\d{1,14}$/)
  .withMessage("Please enter a valid phone number");

const validateOTP = body("otpCode")
  .notEmpty()
  .isLength({ min: 6, max: 6 })
  .isNumeric()
  .withMessage("Please enter a valid 6-digit OTP");

const validateSubdomain = body("subdomain")
  .notEmpty()
  .isLength({ min: 3, max: 30 })
  .matches(/^[a-zA-Z0-9-]+$/)
  .withMessage(
    "Subdomain must be between 3-30 characters and can only contain letters, numbers, and hyphens"
  );

// Routes
router.post("/request-otp", [validatePhoneNumber, validate], requestOTP);
router.post(
  "/verify-otp",
  [validatePhoneNumber, validateOTP, validate],
  verifyOTP
);
router.post("/check-subdomain", [validateSubdomain, validate], checkSubdomain);
router.post("/validate-token", auth, validateToken);

// Add a test route to verify the router is working
router.get("/test", (req, res) => {
  res.json({ message: "Auth router is working" });
});

module.exports = router;
