const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
    createQuote,
    listQuotes,
    getQuoteById,
    updateQuote,
    deleteQuote,
} = require("../controllers/quoteController");

router.post("/", auth, createQuote); // Create
router.get("/", auth, listQuotes); // List
router.get("/:id", auth, getQuoteById); // Get by ID
router.put("/:id", auth, updateQuote);
router.delete("/:id", auth, deleteQuote);

module.exports = router;
