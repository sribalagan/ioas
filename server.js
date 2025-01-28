const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const routes = require("./routes"); // Import routes


const app = express();
const port = 5000;  // Use dynamic port from Render

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON bodies

// Routes
app.use("/api", routes); // Mount routes under '/api'

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
