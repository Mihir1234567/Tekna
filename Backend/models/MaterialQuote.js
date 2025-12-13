const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema({
  description: String,
  unit: String,
  qty: Number,
  rate: Number,
  amount: Number,
});

const materialQuoteSchema = new mongoose.Schema(
  {
    materialId: { type: String, required: true, unique: true },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipientInfo: {
      toName: String,
      company: String,
      address: String,
      ref: String,
    },

    materials: [materialSchema],

    totalValue: { type: Number, default: 0 },

    status: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

materialQuoteSchema.index({ materialId: 1 });
materialQuoteSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("MaterialQuote", materialQuoteSchema);
