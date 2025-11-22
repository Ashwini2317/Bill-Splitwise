const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
    try {
        // Check if email credentials are configured
        if (!process.env.EMAIL || !process.env.EMAIL_PASS) {
            console.log("⚠️  Email not configured. Skipping email send.");
            console.log(`📧 [DEV MODE] OTP for ${to}: ${text}`);
            return true; // Return success in dev mode
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL,
            to,
            subject,
            text,
        });

        console.log(`✅ Email sent to ${to}`);
        return true;
    } catch (error) {
        console.error("❌ Email error:", error.message);
        // In dev mode, log OTP to console
        console.log(`📧 [DEV MODE] OTP for ${to}: ${text}`);
        return false;
    }
};

module.exports = sendEmail;
