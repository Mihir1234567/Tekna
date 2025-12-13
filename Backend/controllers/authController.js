// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendResetEmail } = require("../utils/emailService");

const crypto = require("crypto");
// ---------------------- REGISTER & LOGIN ----------------------
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ message: "All fields are required" });

        const existing = await User.findOne({ email });
        if (existing)
            return res.status(409).json({
                message: "Email already exists. Please login instead.",
            });

        const saltRounds = Number(process.env.SALT_ROUNDS) || 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const user = await User.create({
            name,
            email,
            passwordHash,
        });

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
            token,
        });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res
                .status(400)
                .json({ message: "Email and password required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match)
            return res.status(401).json({ message: "Invalid password" });

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
            token,
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ---------------------- FORGOT PASSWORD ----------------------
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // 1) Generate reset token (raw)
        const resetToken = crypto.randomBytes(32).toString("hex");

        // 2) Hash token & store in DB
        const hashed = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.resetPasswordToken = hashed;
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 min

        await user.save();

        // 3) Reset URL (for frontend)
        const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        // TODO: send mail here
        await sendResetEmail({
            to: user.email,
            resetURL,
        });

        console.log("Reset link:", resetURL);

        res.json({
            message: "Password reset link sent to email",
            resetURL, // temporary for testing
        });
    } catch (err) {
        console.error("forgotPassword error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// ---------------------- RESET PASSWORD ----------------------
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }

        // Hash token to match DB
        const hashed = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashed,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user)
            return res
                .status(400)
                .json({ message: "Invalid or expired token" });

        // Hash new password
        const saltRounds = Number(process.env.SALT_ROUNDS) || 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        user.passwordHash = passwordHash;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.json({ message: "Password reset successful" });
    } catch (err) {
        console.error("resetPassword error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
