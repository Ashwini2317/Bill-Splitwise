const expressAsyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const sendEmail = require("../utill/sendMail");

// --------------------- Register User ---------------------
const registerUser = expressAsyncHandler(async (req, res) => {
    const { name, email, phone, address } = req.body;

    if (!name || !email || !phone || !address) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) return res.status(400).json({ message: "Mobile number already registered" });

    const newUser = await User.create({ name, email, phone, address });

    res.status(201).json({
        message: "Registration successful! Please login with OTP.",
        success: true,
        user: {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            address: newUser.address
        }
    });
});

// --------------------- Request OTP ---------------------
const requestOtp = expressAsyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found, please register first" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpSendOn = new Date();
    await user.save();

    console.log(`🔐 OTP for ${email}: ${otp}`);
    await sendEmail(email, "Your OTP Code", `Your OTP is: ${otp} (valid for 5 min)`);

    res.json({ message: "OTP sent successfully to email!" });
});

// --------------------- Login With OTP ---------------------
const loginWithOtp = expressAsyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!user.otp || !user.otpSendOn) {
        return res.status(400).json({ message: "No OTP found. Please request OTP first." });
    }

    const isExpired = new Date() - new Date(user.otpSendOn) > 5 * 60 * 1000;
    if (isExpired) return res.status(400).json({ message: "OTP expired. Please request a new one." });

    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    user.otp = null;
    user.otpSendOn = null;
    await user.save();

    const token = jwt.sign({ _id: user._id, email: user.email }, process.env.JWT_KEY, { expiresIn: "1d" });

    res.cookie("USER", token, {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    });

    res.json({ message: "Login successful", success: true, user, token });
});

// --------------------- Logout User ---------------------
const logoutUser = expressAsyncHandler(async (req, res) => {
    res.clearCookie("USER");
    res.json({ message: "User logged out successfully" });
});

module.exports = { registerUser, requestOtp, loginWithOtp, logoutUser };
