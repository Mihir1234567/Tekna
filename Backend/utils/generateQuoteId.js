const Quote = require("../models/Quote");

async function generateQuoteId() {
    const last = await Quote.findOne().sort({ createdAt: -1 });

    if (!last) return "Q-0001";

    const lastNum = Number(last.quoteId.split("-")[1]);
    const next = (lastNum + 1).toString().padStart(4, "0");

    return `Q-${next}`;
}

module.exports = generateQuoteId;
