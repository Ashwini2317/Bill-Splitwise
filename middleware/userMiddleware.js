const jwt = require("jsonwebtoken");
const expressAsyncHandler = require("express-async-handler");
const User = require("../model/User");

// --------------------- Protect Routes ---------------------
const protect = expressAsyncHandler(async (req, res, next) => {
    let token;

    // Cookie मध्ये token check करा
    if (req.cookies && req.cookies.USER) {
        token = req.cookies.USER;
    }

    // Authorization header मध्ये Bearer token check करा (mobile app साठी)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized, token missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);

        // req.user मध्ये user attach करा
        req.user = await User.findById(decoded._id).select("-otp -otpSendOn"); // OTP info hide
        next();
    } catch (error) {
        return res.status(401).json({ message: "Not authorized, token invalid" });
    }
});

module.exports = { protect };
