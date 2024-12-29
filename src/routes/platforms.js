const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  getPlatforms,
  getUserLinks,
  saveSocialLinks,
} = require("../controllers/platformController");
const { body } = require("express-validator");
const validate = require("../middleware/validate");

// Validation middleware
const validateSocialLinks = body("links")
  .isArray()
  .withMessage("Links must be an array")
  .custom((links) => {
    if (!links.every((link) => link.platformId && link.url)) {
      throw new Error("Each link must have platformId and url");
    }
    if (
      !links.every((link) => typeof link.url === "string" && link.url.trim())
    ) {
      throw new Error("Each link must have a valid URL");
    }
    return true;
  });

// Routes
router.get("/", auth, getPlatforms);
router.get("/user-links", auth, getUserLinks);
router.post(
  "/save-links",
  [auth, validateSocialLinks, validate],
  saveSocialLinks
);

module.exports = router;
