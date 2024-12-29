const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { getDashboardData } = require("../controllers/dashboardController");

router.get("/data", auth, getDashboardData);

module.exports = router;
