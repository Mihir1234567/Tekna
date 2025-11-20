const puppeteer = require("puppeteer");

exports.generateQuotePDF = async (req, res) => {
  const { id } = req.params;
  const authHeader = req.get("authorization");

  try {
    const FRONTEND_URL = process.env.CLIENT_URL;
    const printableUrl = `${FRONTEND_URL}/quote/print/${id}?pdf=1`;

    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--single-process",
        "--no-zygote",
      ],
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 1,
    });

    // Inject token into localStorage BEFORE React loads
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      await page.evaluateOnNewDocument((tk) => {
        localStorage.setItem("token", tk);
      }, token);
    }

    await page.goto(printableUrl, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });
    console.log("Loaded URL:", printableUrl);
    const html = await page.content();
    console.log("HTML length", html.length);

    await new Promise((resolve) => setTimeout(resolve, 400));

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "8mm",
        right: "8mm",
      },
    });
console.log("PDF BUFFER SIZE:", pdfBuffer?.length);

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition": `attachment; filename="Quotation-${id}.pdf"`,
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF Generation Error:", err);
    return res.status(500).json({ message: "Failed to generate PDF" });
  }
};
