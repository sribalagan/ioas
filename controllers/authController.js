const bcrypt = require("bcryptjs");

// Sample in-memory user data (passwords are hashed using bcrypt)
const users = [
  { id: "1", username: "user1", password: bcrypt.hashSync("password1", 10) }, // hashed password
  { id: "2", username: "user2", password: bcrypt.hashSync("password2", 10) }  // hashed password
];

console.log(users[0].password);

// Simulate login authentication logic with bcrypt password validation
exports.login = async (req, res) => {
  const { id, username, password } = req.body;

  // Find the user by id and username
  const user = users.find(user => user.id === id && user.username === username);

  if (user) {
    try {
      // Compare the entered password with the stored hashed password
      const result = await bcrypt.compare(password, user.password);

      if (result) {
        // If passwords match, send success response
        return res.json({ success: true });
      } else {
        // If passwords don't match, send failure response
        return res.json({ success: false, message: "Invalid credentials" });
      }
    } catch (err) {
      return res.status(500).json({ success: false, message: "Server error" });
    }
  } else {
    // If user not found
    return res.json({ success: false, message: "Invalid credentials" });
  }
};
