const mongoose = require("mongoose");

const windowSchema = new mongoose.Schema({
    windowType: String,
    width: Number,
    height: Number,
    profileSystem: String,
    design: String,
    glassType: String,
    locking: String,
    grill: String,
    hardware: String,
    mess: String,
    sqFt: Number,
    pricePerFt: Number,
    quantity: Number,
    amount: Number,
});

const quoteSchema = new mongoose.Schema(
    {
        quoteId: { type: String, required: true, unique: true },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // --- NEW FIELDS ---
        clientName: { type: String, default: "" },
        project: { type: String, default: "" },
        finish: { type: String, default: "" },
        // ------------------

        windows: [windowSchema],

        status: {
            type: String,
            default: "pending",
        },

        subtotal: Number,
        cgst: Number,
        sgst: Number,
        grandTotal: Number,

        versionHistory: { type: Array, default: [] },
    },

    { timestamps: true }
);

quoteSchema.index({ quoteId: 1 });
quoteSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Quote", quoteSchema);