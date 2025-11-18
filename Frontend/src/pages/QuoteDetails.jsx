// src/pages/QuotePreview.jsx
import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Download, ArrowLeft, Ruler, Plus, Minus, Wand2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logo from "../assets/logo.png"; // Ensure this path matches your project structure
import { apiGet } from "../utils/api";
import { getToken } from "../utils/auth";

/* ---------- Helpers ---------- */
function formatINR(v) {
    const n = Number(v) || 0;
    return (
        "₹" +
        n.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}

/* ---------- Window Sketch SVG ---------- */
function WindowSketch({ width = 36, height = 48, type = "normal" }) {
    const W = Math.max(1, Number(width));
    const H = Math.max(1, Number(height));
    const boxW = 200;
    const boxH = 200;
    const padding = 40;
    const aspect = W / H;
    let drawW = boxW;
    let drawH = boxH;

    if (aspect > 1) {
        drawH = boxW / aspect;
    } else {
        drawW = boxH * aspect;
    }

    const offsetX = (boxW - drawW) / 2 + padding;
    const offsetY = (boxH - drawH) / 2 + padding;

    const styles = {
        frame: "#1a1a1a",
        glass: "#e1eff9",
        sashFrame: "#2d3748",
        strokeWidth: 3,
    };

    return (
        <svg
            width={boxW + padding * 2}
            height={boxH + padding * 2}
            viewBox={`0 0 ${boxW + padding * 2} ${boxH + padding * 2}`}
            xmlns="http://www.w3.org/2000/svg"
        >
            {type === "slider" ? (
                <>
                    <rect
                        x={offsetX}
                        y={offsetY}
                        width={drawW}
                        height={drawH}
                        fill="none"
                        stroke={styles.frame}
                        strokeWidth={styles.strokeWidth}
                    />
                    <rect
                        x={offsetX + 2}
                        y={offsetY + 2}
                        width={drawW / 2 + 4}
                        height={drawH - 4}
                        fill={styles.glass}
                        stroke={styles.sashFrame}
                        strokeWidth="2"
                    />
                    <rect
                        x={offsetX + drawW / 2 - 4}
                        y={offsetY + 2}
                        width={drawW / 2 + 2}
                        height={drawH - 4}
                        fill={styles.glass}
                        stroke={styles.sashFrame}
                        strokeWidth="2"
                    />
                    <path
                        d={`M${offsetX + drawW * 0.75} ${
                            offsetY + drawH * 0.5
                        } L${offsetX + drawW * 0.85} ${offsetY + drawH * 0.5}`}
                        stroke="#000"
                        strokeWidth="1.5"
                        opacity="0.6"
                    />
                </>
            ) : (
                <>
                    <rect
                        x={offsetX}
                        y={offsetY}
                        width={drawW}
                        height={drawH}
                        fill={styles.glass}
                        stroke={styles.frame}
                        strokeWidth={styles.strokeWidth}
                    />
                    <path
                        d={`M${offsetX + 5} ${offsetY + drawH} L${
                            offsetX + drawW
                        } ${offsetY + 5}`}
                        fill="rgba(255,255,255,0.4)"
                    />
                </>
            )}
            <text
                x={offsetX + drawW / 2}
                y={offsetY + drawH + 30}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
                fontWeight="600"
            >
                {W}"
            </text>
            <text
                x={offsetX - 25}
                y={offsetY + drawH / 2}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
                fontWeight="600"
                transform={`rotate(-90 ${offsetX - 25} ${offsetY + drawH / 2})`}
            >
                {H}"
            </text>
        </svg>
    );
}

/* ---------- Spacer Component ---------- */
const ManualSpacer = ({ id, height, updateHeight, visible }) => {
    if (!visible && height === 0) return null;
    const STEP = 20;
    return (
        <div
            className={`transition-all duration-200 ease-in-out ${
                visible ? "my-2" : ""
            }`}
            style={{ height: `${height}px` }}
        >
            {visible ? (
                <div className="h-full min-h-[30px] bg-blue-50 border border-dashed border-blue-300 rounded flex items-center justify-center gap-4 text-blue-600 text-sm select-none relative group">
                    <button
                        onClick={() =>
                            updateHeight(id, Math.max(0, height - STEP))
                        }
                        className="p-1 hover:bg-blue-200 rounded"
                    >
                        <Minus size={16} />
                    </button>
                    <span className="font-mono">{height}px Spacer</span>
                    <button
                        onClick={() => updateHeight(id, height + STEP)}
                        className="p-1 hover:bg-blue-200 rounded"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            ) : (
                <div style={{ height: `${height}px` }} />
            )}
        </div>
    );
};

/* ---------- Main Component ---------- */
export default function QuotePreview() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();

    const [windowList, setWindowList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Spacing State
    const [spacers, setSpacers] = useState({});
    const [showSpacers, setShowSpacers] = useState(false);
    const [pageBreaks, setPageBreaks] = useState([]);

    // AUTOMATIC LAYOUT STATE
    const [autoMargins, setAutoMargins] = useState({});
    const itemRefs = useRef({}); // Stores references to every printable DOM element

    // Pricing State
    const [applyGST, setApplyGST] = useState(true);
    const [cgstPerc, setCgstPerc] = useState(9);
    const [sgstPerc, setSgstPerc] = useState(9);
    const [packingCharges, setPackingCharges] = useState(0);
    const [isPDFMode, setIsPDFMode] = useState(false);

    const mainRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            if (state?.windowList) {
                setWindowList(state.windowList);
                setLoading(false);
            } else if (id) {
                try {
                    const token = getToken();
                    const data = await apiGet(`/quotes/${id}`, token);
                    setWindowList(data.quote.windows || []);
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

    /* --- Calculations --- */
    const subtotal = windowList.reduce((s, w) => s + Number(w.amount || 0), 0);
    const totalSqFt = windowList.reduce((s, w) => s + Number(w.sqFt || 0), 0);
    const cgstAmount = applyGST ? (subtotal * cgstPerc) / 100 : 0;
    const sgstAmount = applyGST ? (subtotal * sgstPerc) / 100 : 0;
    const grandTotal = subtotal + packingCharges + cgstAmount + sgstAmount;
    const avgRate = totalSqFt > 0 ? (grandTotal / totalSqFt).toFixed(2) : 0;

    /* --- Automatic Layout Logic --- */
    const calculateAutoLayout = () => {
        if (!mainRef.current) return;

        const containerWidth = mainRef.current.offsetWidth;
        // A4 Aspect Ratio is ~1.4142. Height = Width * 1.4142
        const pageHeightPx = containerWidth * 1.4142;

        let currentY = 0; // Tracks accumulated height of all elements
        const newMargins = {};

        // Define the order of elements to check
        const keysToProcess = ["header"];
        windowList.forEach((_, i) => keysToProcess.push(`w-${i}`));
        keysToProcess.push("totals");
        keysToProcess.push("footer");

        keysToProcess.forEach((key) => {
            const el = itemRefs.current[key];
            if (!el) return;

            const height = el.offsetHeight;

            // Where does this element currently start on the theoretical page?
            // (modulo operator finds position relative to the top of the current page)
            const startOnPage = currentY % pageHeightPx;
            const endOnPage = startOnPage + height;

            // If the element ends past the page bottom boundary
            // AND the element is smaller than a full page (to prevent infinite loops on huge items)
            if (endOnPage > pageHeightPx && height < pageHeightPx) {
                // Calculate margin needed to push it to the start of the NEXT page
                // +20px buffer for aesthetics
                const marginNeeded = pageHeightPx - startOnPage + 20;

                newMargins[key] = marginNeeded;
                currentY += marginNeeded + height;
            } else {
                newMargins[key] = 0;
                currentY += height;
            }
        });

        setAutoMargins(newMargins);

        // Recalculate the red visual lines after the margins are applied
        setTimeout(calculatePageBreaks, 100);
    };

    /* --- Visual Page Break Lines (Red Dashed Lines) --- */
    const calculatePageBreaks = () => {
        if (!mainRef.current) return;
        const containerWidth = mainRef.current.offsetWidth;
        const containerHeight = mainRef.current.scrollHeight;
        const a4Ratio = 1.4142;
        const pageHeightPx = containerWidth * a4Ratio;

        const breaks = [];
        let currentH = pageHeightPx;
        // Draw lines all the way down the document
        while (currentH < containerHeight) {
            breaks.push(currentH);
            currentH += pageHeightPx;
        }
        setPageBreaks(breaks);
    };

    // Run auto layout once when data loads to ensure good initial state
    useLayoutEffect(() => {
        if (!loading && windowList.length > 0) {
            setTimeout(() => {
                calculateAutoLayout();
            }, 500); // Delay to allow DOM to fully render images/fonts
        }
    }, [loading, windowList, applyGST]);

    // Recalculate red lines on window resize
    useEffect(() => {
        window.addEventListener("resize", calculatePageBreaks);
        return () => window.removeEventListener("resize", calculatePageBreaks);
    }, [autoMargins]);

    const updateSpacer = (key, val) => {
        setSpacers((prev) => ({ ...prev, [key]: val }));
    };

    /* --- PDF Generation --- */
    const downloadPDF = async () => {
        const container = mainRef.current;
        if (!container) return;

        setShowSpacers(false); // Hide helper tools
        setIsPDFMode(true);

        setTimeout(async () => {
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = pdf.internal.pageSize.getHeight();

            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                windowWidth: 1200,
                scrollY: -window.scrollY, // Ensures full height capture
            });

            const imgData = canvas.toDataURL("image/png");
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfW) / imgProps.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, "PNG", 0, position, pdfW, imgHeight);
            heightLeft -= pdfH;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(
                    imgData,
                    "PNG",
                    0,
                    -pdfH * (pdf.getNumberOfPages() - 1),
                    pdfW,
                    imgHeight
                );
                heightLeft -= pdfH;
            }

            pdf.save(`Quotation-${id || "Draft"}.pdf`);
            setIsPDFMode(false);
        }, 500);
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (error)
        return <div className="p-10 text-center text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-900">
            {/* --- HEADER CONTROLS --- */}
            <div
                className={`max-w-5xl mx-auto mb-6 flex flex-wrap justify-between items-center gap-4 ${
                    isPDFMode ? "hidden" : ""
                }`}
            >
                <h1 className="text-2xl font-bold">Quotation Preview</h1>
                <div className="flex flex-wrap gap-3">
                    {/* Auto Adjust Button */}
                    <button
                        onClick={calculateAutoLayout}
                        className="px-4 py-2 border border-purple-300 bg-purple-50 text-purple-700 rounded flex gap-2 items-center hover:bg-purple-100 transition-colors"
                        title="Automatically fix page cuts"
                    >
                        <Wand2 size={16} /> Auto Adjust
                    </button>

                    {/* GST Toggle */}
                    <div className="flex items-center bg-white border rounded px-3">
                        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={applyGST}
                                onChange={(e) => setApplyGST(e.target.checked)}
                                className="w-4 h-4"
                            />
                            Apply GST
                        </label>
                    </div>

                    {/* Manual Tools Toggle */}
                    <button
                        onClick={() => setShowSpacers(!showSpacers)}
                        className={`px-4 py-2 border rounded flex gap-2 items-center ${
                            showSpacers
                                ? "bg-blue-100 border-blue-300 text-blue-800"
                                : "bg-white hover:bg-gray-50"
                        }`}
                    >
                        <Ruler size={16} />{" "}
                        {showSpacers ? "Hide Tools" : "Manual Tools"}
                    </button>

                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 border rounded bg-white hover:bg-gray-50"
                    >
                        Back
                    </button>

                    <button
                        onClick={downloadPDF}
                        className="px-4 py-2 bg-blue-600 text-white rounded flex gap-2 items-center hover:bg-blue-700"
                    >
                        <Download size={16} /> Save PDF
                    </button>
                </div>
            </div>

            {/* --- MAIN DOCUMENT AREA --- */}
            <div className="max-w-5xl mx-auto relative">
                {/* --- PAGE CUT VISUALIZERS --- */}
                {(showSpacers || true) &&
                    pageBreaks.map((y, i) => (
                        <div
                            key={i}
                            className="absolute w-full border-t-2 border-dashed border-red-400 z-50 pointer-events-none flex items-start justify-end opacity-50"
                            style={{ top: `${y}px` }}
                        >
                            <span className="bg-red-400 text-white text-[10px] px-2 py-0.5 rounded-b">
                                Page Cut {i + 1}
                            </span>
                        </div>
                    ))}

                <div
                    ref={mainRef}
                    className="bg-white shadow-lg border p-8 md:p-12 min-h-[297mm] relative transition-all"
                >
                    {/* --- HEADER SECTION --- */}
                    <div
                        ref={(el) => (itemRefs.current["header"] = el)}
                        style={{
                            marginBottom: autoMargins["header"]
                                ? `${autoMargins["header"]}px`
                                : "2rem",
                        }}
                        className="flex justify-between border-b-2 border-gray-800 pb-6 transition-all"
                    >
                        <div>
                            <h2 className="text-3xl font-extrabold tracking-wide">
                                TEKNA WINDOW SYSTEM
                            </h2>
                            <div className="text-sm font-medium mt-2 text-gray-700">
                                <p>VAVDI INDUSTRY AREA, VAVDI MAIN ROAD</p>
                                <p>RAJKOT, GUJARAT</p>
                                <div className="mt-3 space-y-1">
                                    <p>
                                        <strong>Mobile:</strong> 9825256525
                                    </p>
                                    <p>
                                        <strong>Email:</strong>{" "}
                                        TEKNAWIN01@GMAIL.COM
                                    </p>
                                    <p>
                                        <strong>GSTIN:</strong> 24AMIPS5762R1Z4
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            {logo ? (
                                <img
                                    src={logo}
                                    alt="Logo"
                                    className="h-32 w-auto object-contain mb-2"
                                />
                            ) : (
                                <div className="h-24 w-40 bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                    No Logo
                                </div>
                            )}
                            <div className="bg-gray-100 px-3 py-1 rounded text-sm font-bold mt-2">
                                Date: {new Date().toLocaleDateString("en-IN")}
                            </div>
                        </div>
                    </div>

                    {/* --- WINDOW LIST --- */}
                    <div className="space-y-0">
                        {windowList.map((w, i) => (
                            <React.Fragment key={i}>
                                <ManualSpacer
                                    id={`w-${i}`}
                                    visible={showSpacers}
                                    height={spacers[`w-${i}`] || 0}
                                    updateHeight={updateSpacer}
                                />

                                {/* WRAPPER FOR AUTO MARGIN & REF */}
                                <div
                                    ref={(el) =>
                                        (itemRefs.current[`w-${i}`] = el)
                                    }
                                    style={{
                                        marginTop: autoMargins[`w-${i}`]
                                            ? `${autoMargins[`w-${i}`]}px`
                                            : "0px",
                                    }}
                                    className="transition-all duration-300"
                                >
                                    <div className="border border-gray-300 rounded p-4 flex flex-col md:flex-row gap-6 mb-8 break-inside-avoid bg-white">
                                        <div className="w-full md:w-1/3 border border-gray-200 bg-gray-50 flex items-center justify-center p-4">
                                            <WindowSketch
                                                width={w.width}
                                                height={w.height}
                                                type={w.windowType}
                                            />
                                        </div>
                                        <div className="w-full md:w-2/3 flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold border-b pb-2 mb-3">
                                                    Window {i + 1}{" "}
                                                    <span className="text-sm font-normal text-gray-500">
                                                        ({w.windowType})
                                                    </span>
                                                </h3>
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                                    <div>
                                                        <strong>Size:</strong> W{" "}
                                                        {w.width}" × H{" "}
                                                        {w.height}"
                                                    </div>
                                                    <div>
                                                        <strong>
                                                            Profile:
                                                        </strong>{" "}
                                                        {w.profileSystem || "-"}
                                                    </div>
                                                    <div>
                                                        <strong>Glass:</strong>{" "}
                                                        {w.glassType || "-"}
                                                    </div>
                                                    <div>
                                                        <strong>Mesh:</strong>{" "}
                                                        {w.mess || "-"}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 bg-gray-100 p-3 rounded border border-gray-200">
                                                <div className="grid grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <span className="block text-xs text-gray-500">
                                                            Sq.ft
                                                        </span>
                                                        <span className="font-medium">
                                                            {Number(
                                                                w.sqFt
                                                            ).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-xs text-gray-500">
                                                            Rate
                                                        </span>
                                                        <span className="font-medium">
                                                            {formatINR(
                                                                w.pricePerFt
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-xs text-gray-500">
                                                            Qty
                                                        </span>
                                                        <span className="font-medium">
                                                            {w.quantity}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="block text-xs text-gray-500">
                                                            Value
                                                        </span>
                                                        <span className="font-bold text-blue-700">
                                                            {formatINR(
                                                                w.amount
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>

                    <ManualSpacer
                        id="spacer-totals"
                        visible={showSpacers}
                        height={spacers["spacer-totals"] || 0}
                        updateHeight={updateSpacer}
                    />

                    {/* --- QUOTE TOTAL SECTION --- */}
                    <div
                        ref={(el) => (itemRefs.current["totals"] = el)}
                        style={{
                            marginTop: autoMargins["totals"]
                                ? `${autoMargins["totals"]}px`
                                : "1rem",
                        }}
                        className="break-inside-avoid flex justify-end transition-all"
                    >
                        <div className="w-full md:w-2/3 lg:w-1/2 bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2">
                                Quote Summary
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Total Windows
                                    </span>
                                    <span className="font-medium">
                                        {windowList.length} pcs
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        Total Sq.ft
                                    </span>
                                    <span className="font-medium">
                                        {Number(totalSqFt).toFixed(2)} Sq.ft.
                                    </span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                                    <span className="text-gray-800 font-semibold">
                                        Subtotal
                                    </span>
                                    <span className="font-bold">
                                        {formatINR(subtotal)}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">
                                        Packing & Forwarding
                                    </span>
                                    {isPDFMode ? (
                                        <span className="font-medium">
                                            {formatINR(packingCharges)}
                                        </span>
                                    ) : (
                                        <div className="flex items-center">
                                            <span className="text-gray-500 mr-1">
                                                ₹
                                            </span>
                                            <input
                                                type="number"
                                                value={packingCharges}
                                                onChange={(e) =>
                                                    setPackingCharges(
                                                        Number(e.target.value)
                                                    )
                                                }
                                                className="w-20 text-right border-b border-gray-300 bg-transparent text-sm"
                                            />
                                        </div>
                                    )}
                                </div>

                                {applyGST && (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <span>CGST</span>
                                                {isPDFMode ? (
                                                    <span className="text-xs text-gray-400">
                                                        (@{cgstPerc}%)
                                                    </span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        className="w-8 text-center border-b text-xs"
                                                        value={cgstPerc}
                                                        onChange={(e) =>
                                                            setCgstPerc(
                                                                Number(
                                                                    e.target
                                                                        .value
                                                                )
                                                            )
                                                        }
                                                    />
                                                )}
                                            </div>
                                            <span className="font-medium">
                                                {formatINR(cgstAmount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1 text-gray-600">
                                                <span>SGST</span>
                                                {isPDFMode ? (
                                                    <span className="text-xs text-gray-400">
                                                        (@{sgstPerc}%)
                                                    </span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        className="w-8 text-center border-b text-xs"
                                                        value={sgstPerc}
                                                        onChange={(e) =>
                                                            setSgstPerc(
                                                                Number(
                                                                    e.target
                                                                        .value
                                                                )
                                                            )
                                                        }
                                                    />
                                                )}
                                            </div>
                                            <span className="font-medium">
                                                {formatINR(sgstAmount)}
                                            </span>
                                        </div>
                                    </>
                                )}

                                <div className="mt-4 pt-3 border-t-2 border-gray-300 flex justify-between items-end">
                                    <div className="text-xs text-gray-500 mb-1">
                                        Avg Rate: ₹{avgRate} / sq.ft
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-xs text-gray-500 uppercase tracking-wide">
                                            Grand Total
                                        </span>
                                        <span className="block text-xl font-extrabold text-blue-700">
                                            {formatINR(grandTotal)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <ManualSpacer
                        id="spacer-footer"
                        visible={showSpacers}
                        height={spacers["spacer-footer"] || 0}
                        updateHeight={updateSpacer}
                    />

                    {/* --- FOOTER SECTION --- */}
                    <div
                        ref={(el) => (itemRefs.current["footer"] = el)}
                        style={{
                            marginTop: autoMargins["footer"]
                                ? `${autoMargins["footer"]}px`
                                : "2.5rem",
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-gray-800 break-inside-avoid transition-all"
                    >
                        <div>
                            <h4 className="font-bold border-b border-gray-300 mb-2 pb-1">
                                TERMS & CONDITIONS
                            </h4>
                            <ul className="list-disc pl-4 space-y-1 leading-tight">
                                <li>QUOTATION VALID UPTO 1 WEEK.</li>
                                <li>
                                    SIZE CALCULATED IN WIDTH/HEIGHT IN 3 INCH
                                    STEPS.
                                </li>
                                <li>
                                    INSTALLATION: 40-45 DAYS FROM ADVANCE
                                    PAYMENT.
                                </li>
                                <li>
                                    PAYMENT: 70% ADVANCE, 20% DISPATCH, 10%
                                    INSTALL.
                                </li>
                                <li>TRANSPORTATION AND GST EXTRA.</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold border-b border-gray-300 mb-2 pb-1">
                                BANK DETAILS
                            </h4>
                            <div className="space-y-1 font-medium">
                                <div className="grid grid-cols-[100px_1fr]">
                                    <span>BANK NAME:</span>
                                    <span>STATE BANK OF INDIA</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr]">
                                    <span>A/C NO:</span>
                                    <span>34200993101</span>
                                </div>
                                <div className="grid grid-cols-[100px_1fr]">
                                    <span>IFSC:</span>
                                    <span>SBIN0060314</span>
                                </div>
                            </div>
                            <div className="mt-12 pt-4 border-t-2 border-black flex justify-between items-end">
                                <div className="text-center">
                                    <p className="font-bold mb-8">
                                        TEKNA WINDOW SYSTEM
                                    </p>
                                    <p>Authorised Signatory</p>
                                </div>
                                <div className="text-center">
                                    <p className="mb-8">
                                        I ACCEPT THE ESTIMATE.
                                    </p>
                                    <p>Signature of Customer</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
