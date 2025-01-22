const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// POST route to handle login
router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/generate-otp", authController.generateOTP);

module.exports = router;
