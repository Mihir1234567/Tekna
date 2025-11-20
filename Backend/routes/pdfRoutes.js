const express = require("express");
const router = express.Router();

const { generateQuotePDF } = require("../controllers/pdfController");

// GET /api/pdf/quote/:id
router.get("/quote/:id", generateQuotePDF);

module.exports = router;
