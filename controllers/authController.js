const bcrypt = require("bcryptjs");
const otpGenerator = require("otp-generator"); // Install otp-generator package
const nodemailer = require("nodemailer"); // Use Nodemailer for email sending
const moment = require("moment"); // For handling expiry time

const users = [
  { 
    username: "user1", 
    mobileNumber: "1234567890", 
    password: bcrypt.hashSync("password1", 10),
    androidId: null,  // Store the Android ID
    installations: 1,
    email: "user1@example.com" // Email added for sending OTP
  },
  { 
    username: "user2", 
    mobileNumber: "9876543210", 
    password: bcrypt.hashSync("password2", 10),
    androidId: null,  // Store the Android ID
    installations: 1,
    email: "user2@example.com" // Email added for sending OTP
  }
];

const otpStore = {}; // In-memory OTP store

// Generate OTP function
exports.generateOtp = (req, res) => {
  const { username } = req.body;

  // Step 1: Find user by username
  const user = users.find(user => user.username === username);

  if (user) {
    // Step 2: Generate a 6-digit OTP
    const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });

    // Step 3: Store the OTP with expiry time (5 minutes)
    otpStore[username] = {
      otp: otp,
      expiresAt: moment().add(5, "minutes").toISOString()
    };

    // Step 4: Send OTP to the user's email using Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password' // Ensure you use environment variables for security
      }
    });

    const mailOptions = {
      from: 'your-email@gmail.com',
      to: user.email,
      subject: 'Your OTP Code',
      text: `Your OTP is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ success: false, message: "Failed to send OTP" });
      } else {
        return res.json({ success: true, message: "OTP sent to your email" });
      }
    });
  } else {
    return res.status(404).json({ success: false, message: "User not found" });
  }
};

// Login function (validate username, password, and OTP)
exports.login = (req, res) => {
  const { username, password, otp, mobileNumber } = req.body;

  const user = users.find(user => user.username === username);

  if (user) {
    // Step 1: Check if the mobile number matches the one associated with the username
    if (user.mobileNumber !== mobileNumber) {
      return res.status(401).json({
        success: false,
        message: "Mobile number does not match with the username."
      });
    }

    // Step 2: Compare password
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        console.error("Error comparing passwords:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }

      if (result) {
        // Step 3: Validate OTP
        if (otpStore[username]) {
          const otpData = otpStore[username];
          if (moment().isAfter(otpData.expiresAt)) {
            delete otpStore[username]; // Remove expired OTP
            return res.status(400).json({ success: false, message: "OTP expired" });
          }

          if (otp === otpData.otp) {
            delete otpStore[username]; // Remove OTP after successful validation
            return res.json({ success: true, message: "Login successful!" });
          } else {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
          }
        } else {
          return res.status(400).json({ success: false, message: "OTP not generated" });
        }
      } else {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    });
  } else {
    return res.status(404).json({ success: false, message: "User not found" });
  }
};

// Register function (Only `ANDROID_ID` validation during registration)
exports.register = (req, res) => {
  const { mobileNumber, androidId } = req.body;

  // Find user by mobile number
  const existingUser = users.find(user => user.mobileNumber === mobileNumber);

  if (existingUser) {
    // Check if the installation limit (3 installs) has been exceeded
    if (existingUser.installations >= 3) {
      return res.status(400).json({
        success: false,
        message: "Installation limit reached. You can only install the app 3 times."
      });
    }

    // Allow installation and increment the installation count
    existingUser.installations += 1;

    // Step 1: Store the Android ID if it's null (first-time registration)
    if (!existingUser.androidId) {
      existingUser.androidId = androidId;
      return res.status(200).json({
        success: true,
        message: "Mobile number is valid and Android ID registered. Proceed to login."
      });
    }

    // If Android ID already exists, don't update it and return a message
    return res.status(200).json({
      success: true,
      message: "Mobile number is valid. Proceed to login."
    });
  } else {
    // Mobile number not found
    return res.status(404).json({
      success: false,
      message: "The given number is not registered in our records."
    });
  }
};
