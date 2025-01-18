const bcrypt = require("bcryptjs");

const users = [
  {username: "user1" , mobileNumber: "1234567890" , password: bcrypt.hashSync("password1", 10),installations: 1  }, 
  {username: "user2" , mobileNumber: "9876543210" , password: bcrypt.hashSync("password2", 10),installations: 1  }  
];

// login function
exports.login = (req, res) => {
  const {username, password } = req.body;

  
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

// register function
exports.register = (req, res) => {
  const { mobileNumber } = req.body;

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

    return res.status(200).json({
      success: true,
      message: "Mobile number is valid. Proceed to login."
    });
  } else {
    // Mobile number not found
    return res.status(404).json({
      success: false,
      message: "Mobile number not found. Please register."
    });
  }
};