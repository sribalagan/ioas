const otpGenerator = require("otp-generator"); // OTP generation
const nodemailer = require("nodemailer"); // Email sending
const moment = require("moment"); // Expiry handling
const pool = require("../db"); // Database connection

const otpStore = {}; // In-memory OTP store

// Generate OTP function
exports.generateOtp = async (req, res) => {
  const { username, password, mobileNumber } = req.body;

  try {    
    // Step 1: Fetch user by username in user_master table
    const userQuery = "SELECT * FROM user_master WHERE username = $1";
    const userResult = await pool.query(userQuery, [username]);

    if (userResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = userResult.rows[0];
    console.log("User:", user);  // Log the user query result to see raw data

    // Step 2: Fetch employee details using emp_id from user_master
    const employeeQuery = "SELECT email, mobile_no FROM employee_master WHERE emp_id = $1";
    const employeeResult = await pool.query(employeeQuery, [user.emp_id]);

    if (employeeResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const employee = employeeResult.rows[0];

    // Step 3: Check if the mobile number matches
    if (employee.mobile_no !== mobileNumber) {
      return res.status(401).json({ success: false, message: "Mobile number does not match" });
    }

    // Step 4: Validate password (Consider using bcrypt here)
    if (password !== user.password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Step 5: Generate OTP
    const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
    const expiresAt = moment().add(5, "minutes").toISOString(); // OTP expiry time (5 minutes)

    // Store OTP and expiration time in memory
    otpStore[username] = { otp, expiresAt };
    
    // Step 6: Send OTP to user's email (retrieved from employee_master table)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: 'sribalagan.21@gmail.com', // Use environment variable for email
        pass: 'bjgh cltp elsd osan', // Use environment variable for password
      },
    });

    const mailOptions = {
      from: 'sribalagan.21@gmail.com',
      to: employee.email, // Send OTP to the email from employee_master
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending OTP:", error);  // Log email error
        return res.status(500).json({ success: false, message: "Failed to send OTP" });
      } else {
        return res.json({ success: true, message: "OTP sent to your email" });
      }
    });
  } catch (error) {
    console.log("Entering catch block...");
    console.error("Error generating OTP:", error.message); // Log error message
    console.error("Stack trace:", error.stack); // Log the full stack trace
    res.status(500).send("Internal server error");  // Use send to ensure response is sent
  }
};

// Login function (validate username, password, OTP)
exports.login = async (req, res) => {
  const { username, password, otp, mobileNumber } = req.body;

  try {
    // Step 1: Fetch user by username in user_master table
    const userQuery = "SELECT * FROM user_master WHERE username = $1";
    const userResult = await pool.query(userQuery, [username]);

    if (userResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = userResult.rows[0];

    // Step 2: Fetch employee details using emp_id from user_master
    const employeeQuery = "SELECT mobile_no FROM employee_master WHERE emp_id = $1";
    const employeeResult = await pool.query(employeeQuery, [user.emp_id]);

    if (employeeResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    const employee = employeeResult.rows[0];

    // Step 3: Validate password
    if (password !== user.password) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Step 4: Validate mobile number
    if (employee.mobile_no !== mobileNumber) {
      return res.status(401).json({ success: false, message: "Mobile number does not match" });
    }

    // Step 5: Validate OTP (if it's present in memory)
    if (otpStore[username]) {
      const otpData = otpStore[username];

      // Check if OTP has expired
      if (moment().isAfter(moment(otpData.expiresAt))) {
        delete otpStore[username];  // Remove expired OTP
        return res.status(400).json({ success: false, message: "OTP expired. Please generate a new one." });
      }

      // Check if OTP matches
      if (otp === otpData.otp) {
        delete otpStore[username];  // Remove OTP after successful validation
        return res.json({ success: true, message: "Login successful!" });
      } else {
        return res.status(400).json({ success: false, message: "Invalid OTP" });
      }
    } else {
      return res.status(400).json({ success: false, message: "OTP not generated" });
    }
  } catch (error) {
    console.error("Error during login:", error.message); // Log error message
    console.error("Stack trace:", error.stack); // Log the full stack trace
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


exports.register = async (req, res) => {
  const { mobileNumber, androidId } = req.body; // Extract mobile number and device ID

  try {
    // Step 1: Check if the mobile number exists in the employee_master table
    const empQuery = "SELECT emp_id FROM employee_master WHERE mobile_no = $1";
    const empResult = await pool.query(empQuery, [mobileNumber]);

    if (empResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "The given number is not registered in our records.",
      });
    }

    const empId = empResult.rows[0].emp_id;

    // Step 2: Check if the mobile number has been registered 3 times
    const mobileCountQuery = `
      SELECT COUNT(*) AS mobile_count 
      FROM mobile_device_reg_details 
      WHERE mobile_number = $1
    `;
    const mobileCountResult = await pool.query(mobileCountQuery, [mobileNumber]);
    const mobileCount = parseInt(mobileCountResult.rows[0].mobile_count, 10);

    if (mobileCount >= 3) {
      return res.status(400).json({
        success: false,
        message: "This mobile number has already been registered 3 times.",
      });
    }

    // Step 3: Check if the device ID has been registered 3 times
    const deviceCountQuery = `
      SELECT COUNT(*) AS device_count 
      FROM mobile_device_reg_details 
      WHERE mobile_device_id = $1
    `;
    const deviceCountResult = await pool.query(deviceCountQuery, [androidId]);
    const deviceCount = parseInt(deviceCountResult.rows[0].device_count, 10);

    if (deviceCount >= 3) {
      return res.status(400).json({
        success: false,
        message: "This device ID has already been registered 3 times.",
      });
    }

    // Step 4: Register the mobile number and device ID
    const registerQuery = `
      INSERT INTO mobile_device_reg_details (
        emp_id, mobile_device_id, mobile_number, reg_datetime, status
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 'A')
      RETURNING mobile_id, reg_datetime
    `;
    const registerResult = await pool.query(registerQuery, [empId, androidId, mobileNumber]);

    return res.status(201).json({
      success: true,
      message: "Device registered successfully. Proceed to login.",
      data: registerResult.rows[0],
    });
  } catch (error) {
    console.error("Error during registration:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
