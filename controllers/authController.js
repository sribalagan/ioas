const bcrypt = require("bcryptjs");

// Sample in-memory user data (passwords are hashed using bcrypt)
const users = [
  { id: "1", username: "user1", password: bcrypt.hashSync("password1", 10) }, // hashed password
  { id: "2", username: "user2", password: bcrypt.hashSync("password2", 10) }  // hashed password
];

// Simulate login authentication logic with bcrypt password validation
exports.login = (req, res) => {
  const { id, username, password } = req.body;

  // Find the user by id and username
  const user = users.find(user => user.id === id && user.username === username);

  if (user) {
    // Compare the entered password with the stored hashed password
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Server error" });
      }

      if (result) {
        // If passwords match, send success response
        return res.json({ success: true });
      } else {
        // If passwords don't match, send failure response
        return res.json({ success: false });
      }
    });
  } else {
    // If user not found
    return res.json({ success: false });
  }
};
