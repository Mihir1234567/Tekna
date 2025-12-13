const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createMaterialQuote,
  listMaterialQuotes,
  getMaterialQuoteById,
  updateMaterialQuote,
  deleteMaterialQuote,
} = require("../controllers/materialController");

router.use(protect); // All routes require authentication

router.post("/", createMaterialQuote);
router.get("/", listMaterialQuotes);
router.get("/:id", getMaterialQuoteById);
router.put("/:id", updateMaterialQuote);
router.delete("/:id", deleteMaterialQuote);

module.exports = router;
