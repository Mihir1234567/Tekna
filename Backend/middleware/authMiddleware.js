// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader)
        return res
            .status(401)
            .json({ message: "Missing Authorization header" });

    const token = authHeader.split(" ")[1]; // "Bearer token"

    if (!token) return res.status(401).json({ message: "Token missing" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { userId, email }
        next();
    } catch (err) {
        console.error("JWT error:", err);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
