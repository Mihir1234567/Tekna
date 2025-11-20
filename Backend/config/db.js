// config/db.js
const mongoose = require("mongoose");

async function connectDB(mongoUri) {
    try {
        if (!mongoUri) throw new Error("MONGO_URI is not provided");
        await mongoose.connect(mongoUri, {
            // options (Mongoose 7 has sensible defaults)
            // keepUnifiedTopology and useNewUrlParser are no longer required in Mongoose 7
        });
        console.log("✅ MongoDB connected");
    } catch (err) {
        console.error("❌ MongoDB connection error:", err.message);
        throw err;
    }
}

module.exports = connectDB;
