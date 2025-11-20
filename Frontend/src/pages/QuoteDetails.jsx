import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Loader2,
  RotateCcw,
  ChevronsUp,
  ChevronsDown,
  Plus,
  Minus,
  Wand2,
  Printer,
  Save,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logo from "../assets/logo.png"; // Ensure this path is correct
import { apiGet } from "../utils/api"; // Removed apiPut for brevity, add back if needed
import { getToken } from "../utils/auth";

/* --- 1. Helper Functions & Sub-Components --- */
const formatINR = (val) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
};

const WindowSketch = ({ width, height, type = "normal" }) => {
  const boxSize = 140;
  const strokeColor = "#1f2937";
  const glassColor = "#f8fafc";
  const w = Math.max(1, Number(width));
  const h = Math.max(1, Number(height));
  const aspect = w / h;
  let drawW, drawH;
  if (aspect > 1) {
    drawW = boxSize;
    drawH = boxSize / aspect;
  } else {
    drawH = boxSize;
    drawW = boxSize * aspect;
  }
  const startX = (200 - drawW) / 2;
  const startY = (200 - drawH) / 2;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {/* Dimension Lines */}
        <line
          x1={startX}
          y1={startY + drawH + 10}
          x2={startX + drawW}
          y2={startY + drawH + 10}
          stroke="#94a3b8"
          strokeWidth="1"
        />
        <line
          x1={startX}
          y1={startY + drawH + 5}
          x2={startX}
          y2={startY + drawH + 15}
          stroke="#94a3b8"
          strokeWidth="1"
        />
        <line
          x1={startX + drawW}
          y1={startY + drawH + 5}
          x2={startX + drawW}
          y2={startY + drawH + 15}
          stroke="#94a3b8"
          strokeWidth="1"
        />
        <line
          x1={startX - 10}
          y1={startY}
          x2={startX - 10}
          y2={startY + drawH}
          stroke="#94a3b8"
          strokeWidth="1"
        />
        <line
          x1={startX - 15}
          y1={startY}
          x2={startX - 5}
          y2={startY}
          stroke="#94a3b8"
          strokeWidth="1"
        />
        <line
          x1={startX - 15}
          y1={startY + drawH}
          x2={startX - 5}
          y2={startY + drawH}
          stroke="#94a3b8"
          strokeWidth="1"
        />
        {/* Text */}
        <text
          x={startX + drawW / 2}
          y={startY + drawH + 24}
          textAnchor="middle"
          fill="#374151"
          style={{
            fontSize: "12px",
            fontWeight: "bold",
            fontFamily: "sans-serif",
          }}
        >
          {width}"
        </text>
        <text
          x={startX - 20}
          y={startY + drawH / 2}
          textAnchor="middle"
          fill="#374151"
          transform={`rotate(-90, ${startX - 20}, ${startY + drawH / 2})`}
          style={{
            fontSize: "12px",
            fontWeight: "bold",
            fontFamily: "sans-serif",
          }}
        >
          {height}"
        </text>
        {/* Window Frame */}
        <rect
          x={startX}
          y={startY}
          width={drawW}
          height={drawH}
          fill={glassColor}
          stroke={strokeColor}
          strokeWidth="2"
        />
        <line
          x1={startX}
          y1={startY}
          x2={startX + drawW}
          y2={startY + drawH}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
        {/* Type Logic */}
        {type.toLowerCase().includes("slider") ? (
          <>
            <line
              x1={startX + drawW / 2}
              y1={startY}
              x2={startX + drawW / 2}
              y2={startY + drawH}
              stroke={strokeColor}
              strokeWidth="1"
            />
            <path
              d={`M${startX + drawW * 0.25} ${
                startY + drawH / 2
              } l-3 0 l2 -2 m-2 2 l2 2`}
              stroke="#94a3b8"
              strokeWidth="1"
              fill="none"
            />
            <path
              d={`M${startX + drawW * 0.75} ${
                startY + drawH / 2
              } l3 0 l-2 -2 m2 2 l-2 2`}
              stroke="#94a3b8"
              strokeWidth="1"
              fill="none"
            />
          </>
        ) : (
          <>
            <line
              x1={startX + drawW / 2}
              y1={startY}
              x2={startX + drawW / 2}
              y2={startY + drawH}
              stroke="#cbd5e1"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
            <line
              x1={startX}
              y1={startY + drawH / 2}
              x2={startX + drawW}
              y2={startY + drawH / 2}
              stroke="#cbd5e1"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
          </>
        )}
      </svg>
    </div>
  );
};

const ManualSpacer = ({ id, height, updateHeight, visible, pdfMode }) => {
  if (pdfMode)
    return height > 0 ? <div style={{ height: `${height}px` }} /> : null;
  if (!visible && height === 0) return null;
  if (!visible && height > 0) return <div style={{ height: `${height}px` }} />;

  const SMALL_STEP = 20;
  const BIG_STEP = 100;

  return (
    <div
      className="transition-all duration-200 ease-in-out my-2"
      style={{ height: `${height}px` }}
    >
      <div className="h-10 bg-indigo-50 border border-dashed border-indigo-300 rounded flex items-center justify-center gap-2 text-indigo-700 select-none relative opacity-70 hover:opacity-100">
        <div className="flex items-center bg-white rounded border border-indigo-200 overflow-hidden">
          <button
            onClick={() => updateHeight(id, Math.max(0, height - BIG_STEP))}
            className="p-1 hover:bg-indigo-100 border-r border-indigo-100"
          >
            <ChevronsUp size={14} />
          </button>
          <button
            onClick={() => updateHeight(id, Math.max(0, height - SMALL_STEP))}
            className="p-1 hover:bg-indigo-100"
          >
            <Minus size={14} />
          </button>
        </div>
        <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-indigo-200">
          {height}px
        </span>
        <div className="flex items-center bg-white rounded border border-indigo-200 overflow-hidden">
          <button
            onClick={() => updateHeight(id, height + SMALL_STEP)}
            className="p-1 hover:bg-indigo-100 border-r border-indigo-100"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => updateHeight(id, height + BIG_STEP)}
            className="p-1 hover:bg-indigo-100"
          >
            <ChevronsDown size={14} />
          </button>
        </div>
        {height > 0 && (
          <button
            onClick={() => updateHeight(id, 0)}
            className="absolute right-2 text-red-400 hover:text-red-600"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

/* --- 2. The Reusable Template (Used for both Screen & Print) --- */
const QuoteTemplate = React.forwardRef(
  (
    {
      data,
      financials,
      spacers,
      showSpacers,
      updateSpacer,
      isPDFMode,
      itemRefs, // Pass ref collector only for the visible instance
    },
    ref
  ) => {
    const { windowList, clientDetails } = data;
    const {
      applyGST,
      cgstPerc,
      sgstPerc,
      packingCharges,
      subtotal,
      totalSqFt,
      cgstAmount,
      sgstAmount,
      grandTotal,
    } = financials;

    // Helper to assign ref only if itemRefs is provided (Visible Mode)
    const setRef = (key, el) => {
      if (itemRefs && itemRefs.current) {
        itemRefs.current[key] = el;
      }
    };

    return (
      <div
        ref={ref}
        style={{ width: "794px", minHeight: "1123px" }}
        className="bg-white shadow-2xl p-10 relative text-gray-900 mx-auto"
      >
        {/* HEADER */}
        <header
          ref={(el) => setRef("header", el)}
          className="flex justify-between items-start pb-6 border-b-2 border-gray-900 mb-8"
        >
          <div className="flex flex-col items-start text-left w-2/3">
            <h1 className="text-3xl font-extrabold tracking-wide text-gray-900 mb-1">
              TEKNA WINDOW SYSTEM
            </h1>
            <p className="text-sm text-gray-700">
              VAVDI INDUSTRY AREA, VAVDI MAIN ROAD
            </p>
            <p className="text-sm text-gray-700 mb-4">RAJKOT, GUJARAT</p>
            <div className="text-sm space-y-1 text-gray-700">
              <p>
                <strong>Mobile:</strong> 9825256525
              </p>
              <p>
                <strong>Email:</strong> TEKNAWIN01@GMAIL.COM
              </p>
              <p>
                <strong>GSTIN:</strong> 24AMIPS5762R1Z4
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end text-right w-1/3">
            <div className="h-20 mb-2 relative">
              {logo ? (
                <img src={logo} alt="Logo" className="h-full object-contain" />
              ) : (
                <div className="h-full w-24 bg-red-100 text-red-500 flex items-center justify-center font-bold">
                  TWS
                </div>
              )}
            </div>
            <div className="mt-4 px-3 py-1.5 text-sm font-bold text-gray-800">
              Date: {new Date().toLocaleDateString("en-IN")}
            </div>
          </div>
        </header>

        {/* CLIENT INFO */}
        <section className="mb-10">
          <div className="grid grid-cols-4 gap-4 text-sm bg-slate-50 p-4 rounded border border-slate-200">
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                Client
              </span>
              <span className="font-bold text-gray-900">
                {clientDetails.clientName || "—"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                Project
              </span>
              <span className="font-bold text-gray-900">
                {clientDetails.project || "—"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                Quote No
              </span>
              <span className="font-bold text-indigo-700 font-mono">
                {data.id || "—"}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                Finish
              </span>
              <span className="font-bold text-gray-900">
                {clientDetails.finish || "—"}
              </span>
            </div>
          </div>
        </section>

        {/* WINDOWS */}
        <section className="mb-10 space-y-6">
          {windowList.map((win, index) => (
            <React.Fragment key={index}>
              <ManualSpacer
                id={`w-${index}`}
                visible={showSpacers}
                pdfMode={isPDFMode}
                height={spacers[`w-${index}`] || 0}
                updateHeight={updateSpacer}
              />
              <div
                ref={(el) => setRef(`w-${index}`, el)}
                className="break-inside-avoid border border-gray-300 rounded-sm overflow-hidden flex"
              >
                <div className="w-[180px] border-r border-gray-300 p-2 flex items-center justify-center bg-white">
                  <WindowSketch
                    width={win.width}
                    height={win.height}
                    type={win.windowType}
                  />
                </div>
                <div className="flex-1 p-4 text-xs text-gray-800 flex flex-col">
                  <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-3">
                    <span className="font-extrabold text-sm text-slate-800 px-2 py-0.5 rounded-sm">
                      Window {index + 1}
                    </span>
                    <span className="font-bold text-slate-600 uppercase tracking-wider">
                      {win.windowType}
                    </span>
                  </div>
                  <div className="grid grid-cols-[85px_1fr] gap-y-1.5 leading-tight">
                    <span className="font-bold text-slate-500">Size:</span>
                    <span>
                      W {win.width}" x H {win.height}"
                    </span>
                    <span className="font-bold text-slate-500">Profile:</span>
                    <span className="uppercase">
                      {win.profileSystem || "-"}
                    </span>
                    <span className="font-bold text-slate-500">Glass:</span>
                    <span className="uppercase">{win.glassType || "-"}</span>
                    <span className="font-bold text-slate-500">Mesh:</span>
                    <span className="uppercase">{win.mess || "-"}</span>
                    <span className="font-bold text-slate-500">Hardware:</span>
                    <span className="uppercase">{win.hardware || "-"}</span>
                  </div>
                </div>
                <div className="w-[140px] border-l border-gray-300 bg-slate-50 p-4 flex flex-col justify-center gap-2 text-right">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">
                      Area
                    </span>
                    <span className="font-bold text-slate-800">
                      {Number(win.sqFt).toFixed(2)} sq.ft
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">
                      Rate
                    </span>
                    <span className="font-bold text-slate-800">
                      ₹{win.pricePerFt}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">
                      Qty
                    </span>
                    <span className="font-bold text-slate-800">
                      {win.quantity} pcs
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-300">
                    <span className="block text-[10px] font-bold text-indigo-600 uppercase">
                      Amount
                    </span>
                    <span className="font-bold text-lg text-indigo-900">
                      {formatINR(win.amount)}
                    </span>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </section>

        <ManualSpacer
          id="spacer-totals"
          visible={showSpacers}
          pdfMode={isPDFMode}
          height={spacers["spacer-totals"] || 0}
          updateHeight={updateSpacer}
        />

        {/* SUMMARY */}
        <section
          ref={(el) => setRef("totals", el)}
          className="break-inside-avoid flex justify-end mb-10"
        >
          <div className="w-1/2 border border-slate-900 p-0">
            <div className="bg-slate-900 text-white px-4 py-2 text-sm font-bold uppercase tracking-wider">
              Quote Summary
            </div>
            <div className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Windows</span>
                <span className="font-bold">{windowList.length} pcs</span>
              </div>
              <div className="flex justify-between">
                <span>Total Area</span>
                <span className="font-bold">
                  {Number(totalSqFt).toFixed(2)} Sq.ft
                </span>
              </div>
              <div className="border-t border-slate-200 my-2"></div>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600 items-center">
                <span>Packing</span>
                <span>{formatINR(packingCharges)}</span>
              </div>
              {applyGST && (
                <>
                  <div className="flex justify-between text-slate-600 items-center">
                    <span>
                      CGST <span className="text-xs">(@{cgstPerc}%)</span>
                    </span>
                    <span>{formatINR(cgstAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 items-center">
                    <span>
                      SGST <span className="text-xs">(@{sgstPerc}%)</span>
                    </span>
                    <span>{formatINR(sgstAmount)}</span>
                  </div>
                </>
              )}
              <div className="border-t-2 border-slate-900 pt-2 mt-2 flex justify-between items-center">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-xl text-indigo-700">
                  {formatINR(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </section>

        <ManualSpacer
          id="spacer-footer"
          visible={showSpacers}
          pdfMode={isPDFMode}
          height={spacers["spacer-footer"] || 0}
          updateHeight={updateSpacer}
        />

        {/* FOOTER */}
        <section
          ref={(el) => setRef("footer", el)}
          className="break-inside-avoid pt-4 border-t border-gray-200"
        >
          <div className="grid grid-cols-2 gap-8">
            <div className="text-[10px] text-gray-600 leading-relaxed">
              <h5 className="font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1 uppercase">
                Terms & Conditions
              </h5>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Quotation valid for 1 week. Rates subject to change.</li>
                <li>Size calculated in 3-inch steps (Width/Height).</li>
                <li>Design changes post-confirmation charged extra.</li>
                <li>No warranty on glass after installation.</li>
                <li>Payment: 70% Advance, 20% Dispatch, 10% Install.</li>
                <li>Subject to Rajkot Jurisdiction.</li>
              </ul>
            </div>
            <div>
              <div className="bg-slate-50 p-3 border border-slate-200 rounded mb-6 text-xs">
                <h5 className="font-bold text-gray-900 mb-2 border-b border-slate-200 pb-1 uppercase">
                  Bank Details
                </h5>
                <div className="grid grid-cols-[70px_1fr] gap-y-1">
                  <span className="text-slate-500">Bank:</span>
                  <span className="font-bold">STATE BANK OF INDIA</span>
                  <span className="text-slate-500">A/C:</span>
                  <span className="font-mono font-bold">34200993101</span>
                  <span className="text-slate-500">IFSC:</span>
                  <span className="font-mono font-bold">SBIN0060314</span>
                </div>
              </div>
              <div className="flex justify-between items-end gap-4 text-xs font-bold text-center">
                <div className="flex-1">
                  <div className="h-10 border-b border-gray-400 mb-1"></div>
                  <p>TEKNA WINDOWS</p>
                </div>
                <div className="flex-1">
                  <div className="h-10 border-b border-gray-400 mb-1"></div>
                  <p>CUSTOMER SIGN</p>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center text-[10px] text-gray-400 mt-8">
            Generated by TEKNA Window Systems
          </div>
        </section>
      </div>
    );
  }
);

/* --- 3. Main Component --- */
export default function QuotePreview() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  // REFS
  const mainRef = useRef(null); // Visible (Scaled)
  const mainRefPrint = useRef(null); // Hidden (Full Size)
  const itemRefs = useRef({});

  const apiBaseUrl =
    import.meta.env.REACT_APP_API_BASE || "https://tekna-ryyc.onrender.com";

  // STATE
  const [windowList, setWindowList] = useState([]);
  const [clientDetails, setClientDetails] = useState({
    clientName: "",
    project: "",
    finish: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isPDFMode, setIsPDFMode] = useState(false);
  const [scale, setScale] = useState(1);
  const [spacers, setSpacers] = useState({});
  const [showSpacers, setShowSpacers] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [pageBreaks, setPageBreaks] = useState([]);

  // Financials
  const [applyGST, setApplyGST] = useState(true);
  const [cgstPerc, setCgstPerc] = useState(9);
  const [sgstPerc, setSgstPerc] = useState(9);
  const [packingCharges, setPackingCharges] = useState(0);

  // Derived Financials
  const subtotal = windowList.reduce((s, w) => s + Number(w.amount || 0), 0);
  const totalSqFt = windowList.reduce((s, w) => s + Number(w.sqFt || 0), 0);
  const cgstAmount = applyGST ? (subtotal * cgstPerc) / 100 : 0;
  const sgstAmount = applyGST ? (subtotal * sgstPerc) / 100 : 0;
  const grandTotal = subtotal + packingCharges + cgstAmount + sgstAmount;

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      if (state?.windowList) {
        setWindowList(state.windowList);
        if (state.clientInfo) setClientDetails(state.clientInfo);
        setLoading(false);
      } else if (id) {
        try {
          const token = getToken();
          const data = await apiGet(`/quotes/${id}`, token);
          setWindowList(data.quote.windows || []);
          setClientDetails({
            clientName: data.quote.clientName || "",
            project: data.quote.project || "",
            finish: data.quote.finish || "",
          });
          if (data.quote) {
            setApplyGST(data.quote.applyGST ?? true);
            setCgstPerc(data.quote.cgstPerc || 9);
            setSgstPerc(data.quote.sgstPerc || 9);
            setPackingCharges(data.quote.packingCharges || 0);
          }
        } catch (err) {
          console.error(err);
          setError("Failed to load data");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, state]);

  // --- Save Data ---
  const handleSaveQuote = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      const token = getToken();
      const payload = {
        applyGST,
        cgstPerc,
        sgstPerc,
        packingCharges,
        windows: windowList,
        clientName: clientDetails.clientName,
        project: clientDetails.project,
        finish: clientDetails.finish,
      };
      const res = await fetch(`${apiBaseUrl}/api/quotes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      alert("Quote Saved Successfully!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Error saving quote.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Auto Layout Logic ---
  const updateSpacer = (key, val) =>
    setSpacers((prev) => ({ ...prev, [key]: val }));

  const calculatePageBreaks = () => {
    if (!mainRef.current) return;
    const containerHeight = mainRef.current.scrollHeight;
    const pageHeightPx = 1123;
    const breaks = [];
    let currentH = pageHeightPx;
    while (currentH < containerHeight + 500) {
      breaks.push(currentH);
      currentH += pageHeightPx;
    }
    setPageBreaks(breaks);
  };

  const handleAutoAdjust = (showUi = true) => {
    if (!mainRef.current) return;
    setIsAdjusting(true);
    if (showUi) setShowSpacers(true);
    setSpacers({});

    setTimeout(() => {
      const pageHeightPx = 1123;
      const newSpacers = {};
      let totalAddedMargin = 0;
      const keys = [
        "header",
        ...windowList.map((_, i) => `w-${i}`),
        "totals",
        "footer",
      ];

      keys.forEach((key) => {
        const el = itemRefs.current[key];
        if (!el) return;
        const naturalTop = el.offsetTop + totalAddedMargin;
        const height = el.offsetHeight;
        const currentBottom = naturalTop + height;
        const startPage = Math.floor(naturalTop / pageHeightPx);
        const endPage = Math.floor(currentBottom / pageHeightPx);

        if (startPage !== endPage) {
          const nextPageStart = (startPage + 1) * pageHeightPx;
          const spaceNeeded = nextPageStart - naturalTop + 50;
          let spacerKey = key;
          if (key === "totals") spacerKey = "spacer-totals";
          if (key === "footer") spacerKey = "spacer-footer";
          if (key !== "header") {
            newSpacers[spacerKey] = Math.ceil(spaceNeeded);
            totalAddedMargin += spaceNeeded;
          }
        }
      });
      setSpacers(newSpacers);
      setIsAdjusting(false);
      calculatePageBreaks();
    }, 200);
  };

  // --- PDF GENERATION (THE SILVER BULLET FIX) ---
  const downloadPDF = async () => {
    const printNode = mainRefPrint.current; // Target the HIDDEN node
    if (!printNode) return;

    setIsPDFMode(true); // Hide spacers in UI for cleanliness

    // Wait for React to hide spacers (if they were visible)
    await new Promise((r) => setTimeout(r, 200));

    // Force DPR to avoid pixel shrinking on high-res mobile screens
    const originalDPR = window.devicePixelRatio;
    // Temporary override to ensure 1:1 pixel mapping
    Object.defineProperty(window, "devicePixelRatio", {
      writable: true,
      configurable: true,
      value: 1,
    });

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      const canvas = await html2canvas(printNode, {
        scale: 2, // High quality
        width: 794, // Fixed A4 width
        useCORS: true,
        scrollY: 0,
        windowWidth: 1200, // Force desktop layout emulation
      });

      const imgData = canvas.toDataURL("image/png");
      const imgHeight = (canvas.height * pdfW) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, 0, pdfW, imgHeight);
      heightLeft -= pdfH;

      while (heightLeft > 0) {
        position += pdfH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -position, pdfW, imgHeight);
        heightLeft -= pdfH;
      }

      pdf.save(`${clientDetails.clientName || "Quotation"}.pdf`);
    } catch (error) {
      console.error("PDF Gen Error:", error);
      alert("Failed to generate PDF");
    } finally {
      // Restore DPR
      Object.defineProperty(window, "devicePixelRatio", {
        writable: true,
        configurable: true,
        value: originalDPR,
      });
      setIsPDFMode(false);
    }
  };

  // --- Screen Resize for Preview ---
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth - 32;
      const target = 794;
      setScale(w < target ? w / target : 1);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useLayoutEffect(() => {
    if (!loading && windowList.length > 0)
      setTimeout(() => handleAutoAdjust(false), 500);
  }, [loading, windowList]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" /> Loading...
      </div>
    );
  if (error)
    return (
      <div className="h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );

  // Combine props for cleaner passing
  const templateProps = {
    data: { windowList, clientDetails, id },
    financials: {
      applyGST,
      cgstPerc,
      sgstPerc,
      packingCharges,
      subtotal,
      totalSqFt,
      cgstAmount,
      sgstAmount,
      grandTotal,
    },
    spacers,
    showSpacers,
    updateSpacer,
    isPDFMode,
  };

  return (
    <div className="bg-gray-100 p-4 font-sans text-gray-800 h-screen overflow-y-auto w-full">
      {/* --- Toolbar --- */}
      <div className="max-w-[794px] mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-xl font-bold text-gray-800">Preview</h1>
        <div className="flex flex-wrap justify-center gap-2 items-center">
          {/* GST Toggle */}
          <div className="flex items-center bg-white border rounded px-3 py-1.5 shadow-sm text-xs mr-2">
            <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
              <input
                type="checkbox"
                checked={applyGST}
                onChange={(e) => setApplyGST(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              Enable GST
            </label>
          </div>
          {/* GST Inputs */}
          {applyGST && (
            <>
              <input
                type="number"
                value={cgstPerc}
                onChange={(e) => setCgstPerc(Number(e.target.value))}
                className="w-12 p-1 text-xs border rounded text-center"
                placeholder="CGST"
              />
              <input
                type="number"
                value={sgstPerc}
                onChange={(e) => setSgstPerc(Number(e.target.value))}
                className="w-12 p-1 text-xs border rounded text-center"
                placeholder="SGST"
              />
            </>
          )}
          <input
            type="number"
            value={packingCharges}
            onChange={(e) => setPackingCharges(Number(e.target.value))}
            className="w-16 p-1 text-xs border rounded text-center"
            placeholder="Pack."
          />

          <button
            onClick={() => handleAutoAdjust(true)}
            disabled={isAdjusting}
            className="px-3 py-1.5 bg-white border border-purple-200 text-purple-700 rounded text-xs font-medium hover:bg-purple-50 flex items-center gap-1"
          >
            {isAdjusting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Wand2 size={14} />
            )}{" "}
            Auto-Layout
          </button>
          <button
            onClick={handleSaveQuote}
            disabled={isSaving}
            className="px-4 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}{" "}
            Save
          </button>
          <button
            onClick={downloadPDF}
            className="px-4 py-1.5 bg-gray-800 text-white rounded text-xs font-medium hover:bg-gray-900 flex items-center gap-2"
          >
            <Printer size={14} /> Download PDF
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 bg-white border rounded text-xs font-medium hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>

      {/* --- VISIBLE SCREEN PREVIEW (SCALED) --- */}
      <div className="flex justify-center pb-20">
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
          }}
        >
          <div className="relative">
            {showSpacers &&
              pageBreaks.map((y, i) => (
                <div
                  key={i}
                  className="absolute w-full border-t-2 border-dashed border-red-300 z-50 pointer-events-none opacity-60"
                  style={{ top: `${y}px` }}
                >
                  <span className="bg-red-300 text-white text-[10px] px-2 rounded-b font-bold tracking-wider absolute right-0">
                    Page {i + 2} Start
                  </span>
                </div>
              ))}

            {/* The Interactive Template */}
            <QuoteTemplate
              ref={mainRef}
              {...templateProps}
              itemRefs={itemRefs} // Pass refs here so Auto-Layout works
            />
          </div>
        </div>
      </div>

      {/* --- HIDDEN PRINT PREVIEW (FIXED 794px) --- */}
      <div
        id="print-view"
        style={{
          position: "absolute",
          top: -9999,
          left: -9999,
          width: "794px",
          height: "auto",
          overflow: "visible",
        }}
      >
        {/* The Clean Template for PDF Generation */}
        <QuoteTemplate
          ref={mainRefPrint}
          {...templateProps}
          itemRefs={null} // Don't capture refs here to avoid conflict
          isPDFMode={true} // Force PDF mode logic (hide spacers)
        />
      </div>
    </div>
  );
}
