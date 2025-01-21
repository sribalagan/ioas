const bcrypt = require("bcryptjs");

const users = [
  { 
    username: "user1", 
    mobileNumber: "1234567890", 
    password: bcrypt.hashSync("password1", 10),
    androidId: null,  // Added androidId for storing the device's ID
    installations: 1  
  },
  { 
    username: "user2", 
    mobileNumber: "9876543210", 
    password: bcrypt.hashSync("password2", 10),
    androidId: null,  // Added androidId for storing the device's ID
    installations: 1  
  }
];

// Login function
exports.login = (req, res) => {
  const { username, password } = req.body;

  const user = users.find(user => user.username === username);

  if (user) {
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

// Register function
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

    // Step 1: First-time registration (if androidId is null)
    if (existingUser.androidId === null) {
      existingUser.androidId = androidId; // Store the Android ID for first-time registration
      existingUser.installations += 1; // Increment installation count
      return res.status(200).json({
        success: true,
        message: "Mobile number verified and device registered successfully!"
      });
    }

    // Step 2: Check if Android ID matches (for reinstallation)
    if (existingUser.androidId === androidId) {
      // If the Android ID matches, allow reinstallation
      existingUser.installations += 1; // Increment installation count
      return res.status(200).json({
        success: true,
        message: "Device registered successfully!"
      });
    } else {
      // If the Android ID does not match, it's a different device
      return res.status(400).json({
        success: false,
        message: "This device is not authorized for this phone number."
      });
    }
  } else {
    // Mobile number not found in the database
    return res.status(404).json({
      success: false,
      message: "The given number is not registered in our records."
    });
  }
};
