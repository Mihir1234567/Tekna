const Quote = require("../models/Quote");
const generateQuoteId = require("../utils/generateQuoteId");
const mongoose = require("mongoose");

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

exports.createQuote = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            windows,
            applyGST = true,
            cgstPerc = 9,
            sgstPerc = 9,
            // Extract new fields
            clientName,
            project,
            finish,
        } = req.body;

        if (!windows || windows.length === 0)
            return res.status(400).json({ message: "Window list is empty" });

        // Generate quote ID
        const quoteId = await generateQuoteId();

        // Calculations
        const subtotal = windows.reduce(
            (s, w) => s + (Number(w.amount) || 0),
            0
        );
        const cgst = applyGST ? (subtotal * cgstPerc) / 100 : 0;
        const sgst = applyGST ? (subtotal * sgstPerc) / 100 : 0;
        const grandTotal = subtotal + cgst + sgst;

        const quote = await Quote.create({
            quoteId,
            userId,
            windows,
            subtotal,
            cgst,
            sgst,
            grandTotal,
            // Save new fields
            clientName,
            project,
            finish,
        });

        res.status(201).json({
            message: "Quote created successfully",
            quote,
        });
    } catch (err) {
        console.error("Create quote error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.listQuotes = async (req, res) => {
    try {
        const userId = req.user.userId;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
        const q = (req.query.q || "").trim();
        const status = req.query.status;
        const sortQuery = req.query.sort || "-createdAt";

        const filter = { userId };

        if (status) filter.status = status;
        if (q) {
            filter.quoteId = { $regex: q, $options: "i" };
        }

        const skip = (page - 1) * limit;

        const [total, items] = await Promise.all([
            Quote.countDocuments(filter),
            Quote.find(filter)
                .sort(sortQuery)
                .skip(skip)
                .limit(limit)
                // Added clientName to selection for list view convenience
                .select(
                    "quoteId clientName status subtotal grandTotal createdAt updatedAt"
                )
                .lean(),
        ]);

        res.json({
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            items,
        });
    } catch (err) {
        console.error("List quotes error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.getQuoteById = async (req, res) => {
    try {
        const userId = req.user.userId;
        const identifier = req.params.id;

        const filter = { userId };

        if (isValidObjectId(identifier)) {
            filter._id = identifier;
        } else {
            filter.quoteId = identifier;
        }

        const quote = await Quote.findOne(filter).lean();

        if (!quote) {
            return res.status(404).json({ message: "Quote not found" });
        }

        res.json({
            message: "Quote fetched successfully",
            quote,
        });
    } catch (err) {
        console.error("Get quote error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.updateQuote = async (req, res) => {
    try {
        const userId = req.user.userId;
        const identifier = req.params.id;
        const {
            windows,
            status,
            applyGST = true,
            cgstPerc = 9,
            sgstPerc = 9,
            // Extract new fields
            clientName,
            project,
            finish,
        } = req.body;

        const filter = { userId };

        if (isValidObjectId(identifier)) {
            filter._id = identifier;
        } else {
            filter.quoteId = identifier;
        }

        const existing = await Quote.findOne(filter);

        if (!existing) {
            return res.status(404).json({ message: "Quote not found" });
        }

        // Save old version
        existing.versionHistory.push({
            timestamp: new Date(),
            previous: {
                windows: existing.windows,
                subtotal: existing.subtotal,
                cgst: existing.cgst,
                sgst: existing.sgst,
                grandTotal: existing.grandTotal,
                status: existing.status,
                clientName: existing.clientName, // track history
                project: existing.project,
                finish: existing.finish,
            },
        });

        // Update fields if present
        if (clientName !== undefined) existing.clientName = clientName;
        if (project !== undefined) existing.project = project;
        if (finish !== undefined) existing.finish = finish;

        // If windows array updated → recalc totals
        if (windows && Array.isArray(windows)) {
            existing.windows = windows;

            const subtotal = windows.reduce(
                (sum, w) => sum + (Number(w.amount) || 0),
                0
            );
            const cgst = applyGST ? (subtotal * cgstPerc) / 100 : 0;
            const sgst = applyGST ? (subtotal * sgstPerc) / 100 : 0;
            const grandTotal = subtotal + cgst + sgst;

            existing.subtotal = subtotal;
            existing.cgst = cgst;
            existing.sgst = sgst;
            existing.grandTotal = grandTotal;
        }

        if (status) {
            existing.status = status;
        }

        await existing.save();

        res.json({
            message: "Quote updated successfully",
            quote: existing,
        });
    } catch (err) {
        console.error("Update quote error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

exports.deleteQuote = async (req, res) => {
    try {
        const userId = req.user.userId;
        const identifier = req.params.id;

        const filter = { userId };

        if (isValidObjectId(identifier)) {
            filter._id = identifier;
        } else {
            filter.quoteId = identifier;
        }

        const deleted = await Quote.findOneAndDelete(filter);

        if (!deleted) {
            return res
                .status(404)
                .json({ message: "Quote not found or not yours" });
        }

        res.json({
            message: "Quote deleted successfully",
            deletedQuoteId: deleted.quoteId,
        });
    } catch (err) {
        console.error("Delete quote error:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};
