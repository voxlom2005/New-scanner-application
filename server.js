// ==========================
// BASIC SETUP
// ==========================
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
app.use(express.json()); // to read JSON body

app.use(express.static(path.join(__dirname, "frontend")));
// ==========================
// DATABASE CONNECTION
// ==========================
mongoose.connect("mongodb://127.0.0.1:27017/otp_demo")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// ==========================
// USER SCHEMA (SIMPLE)
// ==========================
const userSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  password: String,   // plain text ONLY for learning
  otp: String,
  otpExpiry: Date,
  isVerified: { type: Boolean, default: false }
});

const User = mongoose.model("User", userSchema);

// ==========================
// OTP GENERATOR FUNCTION
// ==========================
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit
}

// ==========================
// REGISTER API
// ==========================
app.post("/register", async (req, res) => {
  const { name, mobile, password } = req.body;

  if (!name || !mobile || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const otp = generateOTP();

  // save user with OTP
  const user = new User({
    name,
    mobile,
    password,
    otp,
    otpExpiry: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes
    isVerified: false
  });

  await user.save();

  console.log("Generated OTP (testing):", otp);

  // OTP returned ONLY for learning
  res.json({
    message: "Registered successfully. OTP generated (testing mode)",
    otp: otp
  });
});

// ==========================
// VERIFY OTP API
// ==========================
app.post("/verify-otp", async (req, res) => {
  const { mobile, otp } = req.body;

  const user = await User.findOne({ mobile });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.isVerified) {
    return res.json({ message: "User already verified" });
  }

  if (new Date() > user.otpExpiry) {
    return res.status(400).json({ message: "OTP expired" });
  }

  if (user.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpiry = null;

  await user.save();

  res.json({ message: "OTP verified successfully" });
});

// ==========================
// SERVER START
// ==========================
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
