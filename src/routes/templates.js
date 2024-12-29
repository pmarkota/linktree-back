const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  getTemplates,
  selectTemplate,
} = require("../controllers/templateController");
const { body } = require("express-validator");
const validate = require("../middleware/validate");

// Validation middleware
const validateTemplateSelection = body("templateId")
  .trim()
  .notEmpty()
  .withMessage("Template ID is required")
  .isUUID()
  .withMessage("Invalid template ID format");

// Routes
router.get("/", auth, getTemplates);
router.post(
  "/select",
  [auth, validateTemplateSelection, validate],
  selectTemplate
);

module.exports = router;
