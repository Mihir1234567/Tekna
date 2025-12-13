const MaterialQuote = require("../models/MaterialQuote");
const mongoose = require("mongoose");

// Helper to generate a short ID (simple random or timestamp based)
// We can reuse generateQuoteId if suitable, or make a simple one here.
// For consistency, let's make a simple one or assume existing util usage.
// Since I don't want to break existing utils, I'll inline a simple generator or import if I knew where it was.
// The plan didn't specify checking utils for ID generation, but Quote uses one.
// Let's replicate a simple random 6-char ID.
const generateId = () => {
  return "MAT-" + Math.random().toString(36).substr(2, 6).toUpperCase();
};

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

exports.createMaterialQuote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { recipientInfo, materials, status } = req.body;

    if (!materials || materials.length === 0) {
      return res.status(400).json({ message: "Material list is empty" });
    }

    const materialId = generateId();

    const totalValue = materials.reduce(
      (sum, m) => sum + (Number(m.amount) || 0),
      0
    );

    const newQuote = await MaterialQuote.create({
      materialId,
      userId,
      recipientInfo,
      materials,
      totalValue,
      status: status || "pending",
    });

    res.status(201).json({
      message: "Material quote created successfully",
      quote: newQuote,
    });
  } catch (err) {
    console.error("Create material quote error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.listMaterialQuotes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));

    const filter = { userId };
    const status = req.query.status;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      MaterialQuote.countDocuments(filter),
      MaterialQuote.find(filter)
        .sort("-createdAt")
        .skip(skip)
        .limit(limit)
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
    console.error("List material quotes error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getMaterialQuoteById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const identifier = req.params.id;

    const filter = { userId };
    if (isValidObjectId(identifier)) {
      filter._id = identifier;
    } else {
      filter.materialId = identifier;
    }

    const quote = await MaterialQuote.findOne(filter).lean();
    if (!quote) {
      return res.status(404).json({ message: "Material quote not found" });
    }

    res.json(quote); // Frontend expects the object directly usually or wrapped? Quote controller wraps in { message, quote }. Frontend logic handled direct object or { items } for list.
    // Frontend fetchDetails expects: const data = await res.json(); setQuote(data) or similar?
    // MaterialDetails.jsx uses: const { materials=[], recipientInfo={} } = data;
    // So we should return the quote object directly or spread it.
    // Let's look at frontend again later if needed, but returning JSON of the object is standard.
  } catch (err) {
    console.error("Get material quote error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateMaterialQuote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const identifier = req.params.id;
    const { recipientInfo, materials, status } = req.body;

    const filter = { userId };
    if (isValidObjectId(identifier)) {
      filter._id = identifier;
    } else {
      filter.materialId = identifier;
    }

    const quote = await MaterialQuote.findOne(filter);
    if (!quote) {
      return res.status(404).json({ message: "Material quote not found" });
    }

    if (recipientInfo) quote.recipientInfo = recipientInfo;
    if (status) quote.status = status;

    if (materials && Array.isArray(materials)) {
      quote.materials = materials;
      quote.totalValue = materials.reduce(
        (sum, m) => sum + (Number(m.amount) || 0),
        0
      );
    }

    await quote.save();

    res.json({
      message: "Material quote updated successfully",
      quote,
    });
  } catch (err) {
    console.error("Update material quote error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.deleteMaterialQuote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const identifier = req.params.id;

    const filter = { userId };
    if (isValidObjectId(identifier)) {
      filter._id = identifier;
    } else {
      filter.materialId = identifier;
    }

    const deleted = await MaterialQuote.findOneAndDelete(filter);
    if (!deleted) {
      return res.status(404).json({ message: "Material quote not found" });
    }

    res.json({
      message: "Material quote deleted successfully",
      deletedId: deleted.materialId,
    });
  } catch (err) {
    console.error("Delete material quote error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
