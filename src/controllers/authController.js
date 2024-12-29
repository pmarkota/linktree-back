const jwt = require("jsonwebtoken");
const {
  generateOTP,
  saveOTP,
  verifyOTP: verifyOTPUtil,
} = require("../utils/otpUtils");
const db = require("../db");

// Request OTP
const requestOTP = async (req, res) => {
  try {
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Generate OTP
    const otpCode = generateOTP();

    // Save OTP to database
    const saved = await saveOTP(phone_number, otpCode);

    if (!saved) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate OTP",
      });
    }

    // In production, this would send the OTP via SMS
    // For testing, we'll return it in the response
    res.json({
      success: true,
      message: "OTP sent successfully",
      otp: otpCode, // Remove this in production
    });
  } catch (error) {
    console.error("Error in requestOTP:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, otpCode } = req.body;

    if (!phoneNumber || !otpCode) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required",
      });
    }

    // Verify OTP
    const isValid = await verifyOTPUtil(phoneNumber, otpCode);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Check if user exists
    let user = await db.query("SELECT * FROM users WHERE phone_number = $1", [
      phoneNumber,
    ]);

    let userId;
    let isNewUser = false;

    if (user.rows.length === 0) {
      // Create new user
      const newUser = await db.query(
        "INSERT INTO users (phone_number, is_verified) VALUES ($1, $2) RETURNING id",
        [phoneNumber, true]
      );
      userId = newUser.rows[0].id;
      isNewUser = true;
    } else {
      userId = user.rows[0].id;
      // Update last login
      await db.query("UPDATE users SET last_login = NOW() WHERE id = $1", [
        userId,
      ]);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId,
        phoneNumber,
        role: user.rows[0]?.role || "user",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Authentication successful",
      token,
      isNewUser,
    });
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Check if subdomain is available
const checkSubdomain = async (req, res) => {
  try {
    const { subdomain } = req.body;

    if (!subdomain) {
      return res.status(400).json({
        success: false,
        message: "Subdomain is required",
      });
    }

    const result = await db.query("SELECT id FROM users WHERE subdomain = $1", [
      subdomain.toLowerCase(),
    ]);

    res.json({
      success: true,
      isAvailable: result.rows.length === 0,
    });
  } catch (error) {
    console.error("Error in checkSubdomain:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const validateToken = async (req, res) => {
  // If we reach here, it means the token is valid (auth middleware passed)
  res.json({
    success: true,
    message: "Token is valid",
  });
};

const checkPhoneAvailability = async (req, res) => {
  const { phone_number } = req.body;

  if (!phone_number) {
    return res.status(400).json({
      success: false,
      message: "Phone number is required",
    });
  }

  try {
    const result = await db.query(
      "SELECT EXISTS(SELECT 1 FROM users WHERE phone_number = $1)",
      [phone_number]
    );

    const isPhoneInUse = result.rows[0].exists;

    return res.json({
      success: true,
      available: !isPhoneInUse,
    });
  } catch (error) {
    console.error("Error checking phone availability:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check phone availability",
    });
  }
};

module.exports = {
  requestOTP,
  verifyOTP,
  checkSubdomain,
  validateToken,
  checkPhoneAvailability,
};
