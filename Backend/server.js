// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

const app = express();

// Basic middlewares
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);
app.use(morgan("dev"));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/quotes", require("./routes/quoteRoutes"));

// Health route (use this to test server + DB)
app.get("/health", async (req, res) => {
    const mongoose = require("mongoose");
    const state = mongoose.connection.readyState; // 0 disconnected,1 connected,2 connecting,3 disconnecting
    res.json({
        status: "ok",
        env: process.env.NODE_ENV || "development",
        dbState: state,
    });
});

app.get("/", (req, res) => {
    res.send({
        message: "Tekna backend is running. Visit /health to check status.",
    });
});

// TODO: later add routes:
// app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api/quotes", require("./routes/quoteRoutes"));

// Start server after DB connects
(async () => {
    try {
        await connectDB(MONGO_URI);
        app.listen(PORT, () => {
            console.log(`🚀 Server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err.message);
        process.exit(1);
    }
})();
