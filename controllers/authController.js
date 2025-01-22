const bcrypt = require("bcryptjs");
const otpGenerator = require("otp-generator"); // OTP generation
const nodemailer = require("nodemailer"); // Email sending
const moment = require("moment"); // Expiry handling

const users = [
  { 
    username: "user1", 
    mobileNumber: "1234567890", 
    password: bcrypt.hashSync("password1", 10),
    androidId: null,  // Store the Android ID
    installations: 1,
    email: "sribalagan2003@gmail.com" // Email for sending OTP
  },
  { 
    username: "user2", 
    mobileNumber: "9876543210", 
    password: bcrypt.hashSync("password2", 10),
    androidId: null,
    installations: 2,
    email: "coczeller918@gmail.com" // Email for sending OTP
  }
];

const otpStore = {}; // In-memory OTP store

// Generate OTP function
exports.generateOtp = (req, res) => {
  const { username, password, mobileNumber } = req.body;

  const user = users.find(user => user.username === username);

  if (user) {
    // Validate password
    bcrypt.compare(password, user.password, (err, result) => {
      if (err || !result) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      // Validate mobile number
      if (user.mobileNumber !== mobileNumber) {
        return res.status(401).json({ success: false, message: "Mobile number does not match" });
      }

      // Generate OTP
      const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });

      // Store OTP and expiry time
      otpStore[username] = {
        otp: otp,
        expiresAt: moment().add(5, "minutes").toISOString()
      };

      // Send OTP to user's email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'sribalagan.21@gmail.com',
          pass: 'uzjs iqmc nvjl rbqs' // Use environment variables for email credentials
        }
      });

      const mailOptions = {
        from: 'sribalagan.21@gmail.com',
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
    });
  } else {
    return res.status(404).json({ success: false, message: "User not found" });
  }
};

// Login function (validate username, password, OTP)
exports.login = (req, res) => {
  const { username, password, otp, mobileNumber } = req.body;

  const user = users.find(user => user.username === username);

  if (user) {
    // Validate password
    bcrypt.compare(password, user.password, (err, result) => {
      if (err || !result) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      // Validate mobile number
      if (user.mobileNumber !== mobileNumber) {
        return res.status(401).json({ success: false, message: "Mobile number does not match" });
      }

      // OTP validation
      if (otpStore[username]) {
        const otpData = otpStore[username];

        // Check if OTP has expired
        if (moment().isAfter(otpData.expiresAt)) {
          delete otpStore[username]; // Remove expired OTP
          return res.status(400).json({ success: false, message: "OTP expired. Please generate a new one." });
        }

        // Check if OTP matches
        if (otp === otpData.otp) {
          delete otpStore[username]; // Remove OTP after successful validation
          return res.json({ success: true, message: "Login successful!" });
        } else {
          return res.status(400).json({ success: false, message: "Invalid OTP" });
        }
      } else {
        return res.status(400).json({ success: false, message: "OTP not generated" });
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
