const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { auth } = require("../middleware/auth");

// Apply auth middleware to all routes
router.use(auth);

// Get user profile with all related data
router.get("/", profileController.getUserProfile);

// Update user profile
router.put("/", profileController.updateUserProfile);

// Individual field updates
router.post("/brand-name", profileController.updateBrandName);
router.post("/subdomain", profileController.updateSubdomain);
router.post("/goal", profileController.updateGoal);

module.exports = router;
