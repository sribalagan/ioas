const bcrypt = require("bcryptjs");

const users = [
  { 
    username: "user1", 
    mobileNumber: "1234567890", 
    password: bcrypt.hashSync("password1", 10),
    androidId: null,  // Store the Android ID
    installations: 1  
  },
  { 
    username: "user2", 
    mobileNumber: "9876543210", 
    password: bcrypt.hashSync("password2", 10),
    androidId: null,  // Store the Android ID
    installations: 1  
  }
];

// Login function (Updated: No ANDROID_ID validation here)
exports.login = (req, res) => {
  const { username, password, mobileNumber } = req.body;

  // Step 1: Find user by username
  const user = users.find(user => user.username === username);

  if (user) {
    // Step 2: Check if the mobile number matches the one associated with the username
    if (user.mobileNumber !== mobileNumber) {
      return res.status(401).json({
        success: false,
        message: "Mobile number does not match with the username."
      });
    }

    // Step 3: Compare password
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        console.error("Error comparing passwords:", err);
        return res.status(500).json({ success: false, message: "Server error" });
      }

      if (result) {
        return res.json({ success: true, message: "Login successful!" });
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
