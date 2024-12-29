const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  getBusinessCategories,
  selectBusinessCategory,
} = require("../controllers/businessCategoryController");
const { body } = require("express-validator");
const validate = require("../middleware/validate");

// Validation middleware
const validateCategorySelection = body("categoryId")
  .notEmpty()
  .isUUID()
  .withMessage("Valid category ID is required");

// Routes
router.get("/", getBusinessCategories);
router.post(
  "/select",
  [auth, validateCategorySelection, validate],
  selectBusinessCategory
);

module.exports = router;
