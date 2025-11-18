// src/pages/QuotePreview.jsx
import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    Download,
    Ruler,
    Plus,
    Minus,
    Wand2,
    RotateCcw,
    ChevronsUp,
    ChevronsDown,
    Loader2,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logo from "../assets/logo.png";
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
    const padding = 20; // Reduced padding since we draw dimensions outside now
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
        frame: "#374151", // Gray-700
        glass: "#eff6ff", // Blue-50
        sashFrame: "#4b5563", // Gray-600
        strokeWidth: 2,
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
                        stroke="#9ca3af"
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
                        fill="rgba(255,255,255,0.5)"
                    />
                </>
            )}
            {/* Inner Dimensions Removed - Moved to Outside Layout */}
        </svg>
    );
}

/* ---------- Mobile-Optimized Spacer Component ---------- */
const ManualSpacer = ({ id, height, updateHeight, visible }) => {
    const isVisible = visible || height > 0;

    if (!isVisible) return null;

    const SMALL_STEP = 20;
    const BIG_STEP = 100;

    return (
        <div
            className="transition-all duration-200 ease-in-out my-2"
            style={{ height: `${height}px` }}
        >
            <div className="h-14 sm:h-10 bg-blue-50 border border-dashed border-blue-300 rounded-lg flex items-center justify-center gap-3 sm:gap-2 text-blue-700 select-none relative shadow-sm group">
                <div className="flex items-center bg-white rounded border border-blue-200 overflow-hidden shadow-sm">
                    <button
                        onClick={() =>
                            updateHeight(id, Math.max(0, height - BIG_STEP))
                        }
                        className="p-3 sm:p-1.5 hover:bg-blue-100 border-r border-blue-100 active:bg-blue-200"
                        title="-100px"
                    >
                        <ChevronsUp size={18} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                    <button
                        onClick={() =>
                            updateHeight(id, Math.max(0, height - SMALL_STEP))
                        }
                        className="p-3 sm:p-1.5 hover:bg-blue-100 active:bg-blue-200"
                        title="-20px"
                    >
                        <Minus size={18} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                </div>

                <span className="font-mono font-bold min-w-[70px] sm:min-w-[60px] text-center bg-white px-2 py-1.5 sm:py-1 rounded border border-blue-200 shadow-sm text-blue-800 text-sm sm:text-xs">
                    {height}px
                </span>

                <div className="flex items-center bg-white rounded border border-blue-200 overflow-hidden shadow-sm">
                    <button
                        onClick={() => updateHeight(id, height + SMALL_STEP)}
                        className="p-3 sm:p-1.5 hover:bg-blue-100 border-r border-blue-100 active:bg-blue-200"
                        title="+20px"
                    >
                        <Plus size={18} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                    <button
                        onClick={() => updateHeight(id, height + BIG_STEP)}
                        className="p-3 sm:p-1.5 hover:bg-blue-100 active:bg-blue-200"
                        title="+100px (Push Down)"
                    >
                        <ChevronsDown size={18} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                </div>

                {height > 0 && (
                    <button
                        onClick={() => updateHeight(id, 0)}
                        className="absolute right-2 p-2 sm:p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Reset to 0"
                    >
                        <RotateCcw size={18} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                )}

                <div className="absolute left-3 text-[10px] uppercase tracking-wider opacity-40 font-bold hidden sm:block">
                    Spacer
                </div>
            </div>
        </div>
    );
};

/* ---------- Main Component ---------- */
export default function QuotePreview() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();

    const [windowList, setWindowList] = useState([]);
    const [clientDetails, setClientDetails] = useState({
        clientName: "",
        project: "",
        finish: "",
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdjusting, setIsAdjusting] = useState(false);

    const [spacers, setSpacers] = useState({});
    const [showSpacers, setShowSpacers] = useState(false);
    const [pageBreaks, setPageBreaks] = useState([]);

    // SCALING STATE
    const [scale, setScale] = useState(1);

    const itemRefs = useRef({});
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
                if (state.clientInfo) {
                    setClientDetails({
                        clientName: state.clientInfo.clientName,
                        project: state.clientInfo.project,
                        finish: state.clientInfo.finish,
                    });
                }
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

    /* --- SCREEN SCALING LOGIC --- */
    useEffect(() => {
        const handleResize = () => {
            const availableWidth = window.innerWidth - 32;
            const desiredWidth = 1024;

            if (availableWidth < desiredWidth) {
                const newScale = availableWidth / desiredWidth;
                setScale(newScale);
            } else {
                setScale(1);
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    /* --- Calculations --- */
    const subtotal = windowList.reduce((s, w) => s + Number(w.amount || 0), 0);
    const totalSqFt = windowList.reduce((s, w) => s + Number(w.sqFt || 0), 0);
    const cgstAmount = applyGST ? (subtotal * cgstPerc) / 100 : 0;
    const sgstAmount = applyGST ? (subtotal * sgstPerc) / 100 : 0;
    const grandTotal = subtotal + packingCharges + cgstAmount + sgstAmount;
    const avgRate = totalSqFt > 0 ? (grandTotal / totalSqFt).toFixed(2) : 0;

    /* --- AUTO ADJUST LOGIC --- */
    const handleAutoAdjust = () => {
        if (!mainRef.current) return;
        setIsAdjusting(true);
        setShowSpacers(true);

        setSpacers({});

        setTimeout(() => {
            const containerWidth = mainRef.current.offsetWidth;
            const pageHeightPx = containerWidth * 1.4142;

            const newSpacers = {};
            let totalAddedMargin = 0;

            const keys = ["header"];
            windowList.forEach((_, i) => keys.push(`w-${i}`));
            keys.push("totals");
            keys.push("footer");

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
            setTimeout(calculatePageBreaks, 100);
        }, 200);
    };

    const calculatePageBreaks = () => {
        if (!mainRef.current) return;
        const containerHeight = mainRef.current.scrollHeight;
        const containerWidth = mainRef.current.offsetWidth;
        const pageHeightPx = containerWidth * 1.4142;

        const breaks = [];
        let currentH = pageHeightPx;
        while (currentH < containerHeight + 2000) {
            breaks.push(currentH);
            currentH += pageHeightPx;
        }
        setPageBreaks(breaks);
    };

    useLayoutEffect(() => {
        if (!loading && windowList.length > 0) {
            setTimeout(handleAutoAdjust, 500);
        }
    }, [loading, windowList]);

    useEffect(() => {
        window.addEventListener("resize", calculatePageBreaks);
        return () => window.removeEventListener("resize", calculatePageBreaks);
    }, [spacers]);

    const updateSpacer = (key, val) => {
        setSpacers((prev) => ({ ...prev, [key]: val }));
    };

    const downloadPDF = async () => {
        const container = mainRef.current;
        if (!container) return;

        const oldScale = scale;
        setScale(1);
        setShowSpacers(false);
        setIsPDFMode(true);

        setTimeout(async () => {
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = pdf.internal.pageSize.getHeight();

            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                windowWidth: 1200,
                scrollY: -window.scrollY,
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
            setScale(oldScale);
        }, 500);
    };

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (error)
        return <div className="p-10 text-center text-red-500">{error}</div>;

    return (
        // UPDATED: Changed from min-h-screen to h-screen with overflow-y-auto to fix double scrollbars
        // Also conditionally changing this for PDF mode to ensure full capture
        <div
            className={`bg-gray-100 p-4 font-sans text-gray-900 ${
                isPDFMode
                    ? "min-h-screen"
                    : "h-screen overflow-y-auto overflow-x-hidden w-full"
            }`}
        >
            {/* --- HEADER TOOLBAR --- */}
            <div
                className={`max-w-5xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4 ${
                    isPDFMode ? "hidden" : ""
                }`}
            >
                <h1 className="text-2xl font-bold text-center md:text-left">
                    Quotation Preview
                </h1>
                <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                    <button
                        onClick={handleAutoAdjust}
                        disabled={isAdjusting}
                        className="px-3 py-2 border border-purple-300 bg-purple-50 text-purple-700 rounded flex gap-1 items-center text-xs md:text-sm font-medium hover:bg-purple-100 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {isAdjusting ? (
                            <Loader2 className="animate-spin" size={14} />
                        ) : (
                            <Wand2 size={14} />
                        )}
                        {isAdjusting ? "Adjusting..." : "Auto Adjust"}
                    </button>

                    <button
                        onClick={() => setShowSpacers(!showSpacers)}
                        className={`px-3 py-2 border rounded flex gap-1 items-center text-xs md:text-sm font-medium shadow-sm transition-colors ${
                            showSpacers
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white hover:bg-gray-50 text-gray-700"
                        }`}
                    >
                        <Ruler size={14} />{" "}
                        {showSpacers ? "Hide Tools" : "Spacing"}
                    </button>

                    <div className="flex items-center bg-white border rounded px-2 shadow-sm">
                        <label className="flex items-center gap-2 text-xs md:text-sm cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={applyGST}
                                onChange={(e) => setApplyGST(e.target.checked)}
                                className="w-3 h-3 md:w-4 md:h-4"
                            />
                            GST
                        </label>
                    </div>

                    <button
                        onClick={() => navigate(-1)}
                        className="px-3 py-2 border rounded bg-white hover:bg-gray-50 shadow-sm text-xs md:text-sm"
                    >
                        Back
                    </button>

                    <button
                        onClick={downloadPDF}
                        className="px-3 py-2 bg-gray-800 text-white rounded flex gap-1 items-center hover:bg-gray-900 shadow-sm text-xs md:text-sm"
                    >
                        <Download size={14} /> PDF
                    </button>
                </div>
            </div>

            {/* --- DOCUMENT STAGE --- */}
            <div className="flex justify-center pb-10">
                <div
                    style={{
                        transform: `scale(${scale})`,
                        transformOrigin: "top center",
                        width: "1024px",
                    }}
                >
                    <div className="relative">
                        {/* Page Cut Lines */}
                        {(showSpacers || true) &&
                            pageBreaks.map((y, i) => (
                                <div
                                    key={i}
                                    className="absolute w-full border-t-2 border-dashed border-red-400 z-50 pointer-events-none flex items-start justify-end opacity-60"
                                    style={{ top: `${y}px` }}
                                >
                                    <span className="bg-red-400 text-white text-[10px] px-2 py-0.5 rounded-b font-bold tracking-wider">
                                        PAGE CUT {i + 1}
                                    </span>
                                </div>
                            ))}

                        {/* --- THE A4 PAPER --- */}
                        <div
                            ref={mainRef}
                            className="bg-white shadow-2xl border border-gray-200 p-12 min-w-[1024px] min-h-[297mm] relative text-gray-900"
                        >
                            {/* Header */}
                            <div
                                ref={(el) => (itemRefs.current["header"] = el)}
                            >
                                <div className="flex justify-between border-b-2 border-gray-900 pb-6">
                                    <div>
                                        <h2 className="text-3xl font-extrabold tracking-wide text-gray-900">
                                            TEKNA WINDOW SYSTEM
                                        </h2>
                                        <div className="text-sm font-medium mt-3 text-gray-600 leading-relaxed">
                                            <p>
                                                VAVDI INDUSTRY AREA, VAVDI MAIN
                                                ROAD, RAJKOT
                                            </p>
                                            <div className="mt-2">
                                                <p>
                                                    <strong>Mobile:</strong>{" "}
                                                    87588 02598{" "}
                                                </p>
                                                <p>
                                                    <strong>Email:</strong>{" "}
                                                    TEKNAWIN01@GMAIL.COM
                                                </p>
                                                <p>
                                                    <strong>GSTIN:</strong>{" "}
                                                    24AMIPS5762R1Z4
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
                                            <div className="h-24 w-40 bg-gray-50 flex items-center justify-center text-gray-300 text-xs italic border border-dashed border-gray-200">
                                                No Logo
                                            </div>
                                        )}
                                        <div className="text-sm font-bold mt-2 text-gray-500">
                                            Date:{" "}
                                            <span className="text-gray-900">
                                                {new Date().toLocaleDateString(
                                                    "en-IN"
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* --- CLIENT DETAILS SECTION --- */}
                                <div className="mt-8 mb-8">
                                    <div className="border-y-2 border-gray-100 py-5 bg-gray-50/50">
                                        <div className="grid grid-cols-2 gap-y-6 gap-x-12 px-2">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] uppercase tracking-widest text-amber-600 font-bold mb-1">
                                                    Client Name
                                                </span>
                                                <span className="text-lg font-bold text-gray-900 uppercase tracking-tight">
                                                    {clientDetails.clientName ||
                                                        "—"}
                                                </span>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-[11px] uppercase tracking-widest text-amber-600 font-bold mb-1">
                                                    Quotation No.
                                                </span>
                                                <span className="text-lg font-bold text-gray-900 tracking-tight font-mono">
                                                    {id && id !== "undefined"
                                                        ? id
                                                        : "QE/TK/--"}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[11px] uppercase tracking-widest text-amber-600 font-bold mb-1">
                                                    Project
                                                </span>
                                                <span className="text-sm font-semibold text-gray-800 uppercase">
                                                    {clientDetails.project ||
                                                        "—"}
                                                </span>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-[11px] uppercase tracking-widest text-amber-600 font-bold mb-1">
                                                    Finish
                                                </span>
                                                <span className="text-sm font-semibold text-gray-800 uppercase">
                                                    {clientDetails.finish ||
                                                        "—"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Windows Loop (TECHNICAL TABLE LAYOUT) */}
                            <div className="space-y-6 border-t border-gray-200 pt-6">
                                {windowList.map((w, i) => (
                                    <React.Fragment key={i}>
                                        <ManualSpacer
                                            id={`w-${i}`}
                                            visible={showSpacers}
                                            height={spacers[`w-${i}`] || 0}
                                            updateHeight={updateSpacer}
                                        />

                                        <div
                                            ref={(el) =>
                                                (itemRefs.current[`w-${i}`] =
                                                    el)
                                            }
                                            className="transition-all duration-500"
                                        >
                                            {/* Main Box Container */}
                                            <div className="border border-gray-300 flex flex-col bg-white break-inside-avoid">
                                                {/* 1. Header Bar */}
                                                <div className="flex justify-between bg-gray-100 border-b border-gray-300 px-3 py-2 text-sm font-bold text-gray-800">
                                                    <span>
                                                        Location : Window{" "}
                                                        {i + 1}
                                                    </span>
                                                    <span className="uppercase">
                                                        Code : {w.windowType}
                                                    </span>
                                                </div>

                                                {/* 2. Content Area */}
                                                <div className="flex flex-row">
                                                    {/* Left: Drawing with Dimension Lines */}
                                                    <div className="w-1/3 border-r border-gray-300 p-10 flex items-center justify-center relative bg-white">
                                                        {/* Top Dimension Text */}
                                                        <div className="absolute top-3 left-0 w-full text-center text-xs font-semibold text-gray-600">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <div className="h-px w-12 bg-gray-400"></div>
                                                                <span>
                                                                    W x{" "}
                                                                    {Number(
                                                                        w.width
                                                                    ).toFixed(
                                                                        2
                                                                    )}
                                                                </span>
                                                                <div className="h-px w-12 bg-gray-400"></div>
                                                            </div>
                                                        </div>

                                                        {/* Left Dimension Text */}
                                                        <div className="absolute left-3 top-0 h-full flex flex-col justify-center text-xs font-semibold text-gray-600">
                                                            <div
                                                                className="flex flex-col items-center gap-2"
                                                                style={{
                                                                    writingMode:
                                                                        "vertical-rl",
                                                                    textOrientation:
                                                                        "mixed",
                                                                    transform:
                                                                        "rotate(180deg)",
                                                                }}
                                                            >
                                                                <div className="h-12 w-px bg-gray-400"></div>
                                                                <span>
                                                                    H x{" "}
                                                                    {Number(
                                                                        w.height
                                                                    ).toFixed(
                                                                        2
                                                                    )}
                                                                </span>
                                                                <div className="h-12 w-px bg-gray-400"></div>
                                                            </div>
                                                        </div>

                                                        {/* The Window Itself */}
                                                        <WindowSketch
                                                            width={w.width}
                                                            height={w.height}
                                                            type={w.windowType}
                                                        />
                                                    </div>

                                                    {/* Right: Data Table */}
                                                    <div className="w-2/3 flex flex-col text-xs text-gray-800">
                                                        {/* Specs Section */}
                                                        <div className="flex-grow p-4 space-y-1.5 leading-relaxed">
                                                            <div className="grid grid-cols-[100px_auto]">
                                                                <span className="font-bold">
                                                                    Size (Inch)
                                                                </span>
                                                                <span>
                                                                    : W x{" "}
                                                                    {w.width}{" "}
                                                                    &nbsp;&nbsp;
                                                                    H x{" "}
                                                                    {w.height}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-[100px_auto]">
                                                                <span className="font-bold">
                                                                    Profile
                                                                    System
                                                                </span>
                                                                <span className="uppercase">
                                                                    :{" "}
                                                                    {w.profileSystem ||
                                                                        "-"}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-[100px_auto]">
                                                                <span className="font-bold">
                                                                    Design
                                                                </span>
                                                                <span className="uppercase">
                                                                    :{" "}
                                                                    {w.design ||
                                                                        "-"}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-[100px_auto]">
                                                                <span className="font-bold">
                                                                    Glass
                                                                </span>
                                                                <span className="uppercase">
                                                                    :{" "}
                                                                    {w.glassType ||
                                                                        "-"}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-[100px_auto]">
                                                                <span className="font-bold">
                                                                    Mess
                                                                </span>
                                                                <span className="uppercase">
                                                                    :{" "}
                                                                    {w.mess ||
                                                                        "-"}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-[100px_auto]">
                                                                <span className="font-bold">
                                                                    Locking
                                                                </span>
                                                                <span className="uppercase">
                                                                    :{" "}
                                                                    {w.locking ||
                                                                        "-"}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-[100px_auto]">
                                                                <span className="font-bold">
                                                                    Grill
                                                                </span>
                                                                <span className="uppercase">
                                                                    :{" "}
                                                                    {w.grill ||
                                                                        "-"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Computed Values Section */}
                                                        <div>
                                                            <div className="bg-gray-100 border-y border-gray-300 px-3 py-1 font-bold text-gray-700">
                                                                Computed Values
                                                            </div>
                                                            <div className="px-3 py-2 space-y-1">
                                                                <div className="flex justify-between border-b border-dotted border-gray-200 pb-1">
                                                                    <span>
                                                                        Sq.ft
                                                                        per
                                                                        Window :
                                                                    </span>
                                                                    <div className="flex gap-2">
                                                                        <span className="font-bold">
                                                                            {Number(
                                                                                w.sqFt
                                                                            ).toFixed(
                                                                                2
                                                                            )}
                                                                        </span>
                                                                        <span className="w-8 text-gray-500">
                                                                            Sq.ft.
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between border-b border-dotted border-gray-200 pb-1">
                                                                    <span>
                                                                        Rate
                                                                        sq.ft :
                                                                    </span>
                                                                    <div className="flex gap-2">
                                                                        <span className="font-bold">
                                                                            {Number(
                                                                                w.pricePerFt
                                                                            ).toFixed(
                                                                                2
                                                                            )}
                                                                        </span>
                                                                        <span className="w-8 text-gray-500">
                                                                            Rs.
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between border-b border-dotted border-gray-200 pb-1">
                                                                    <span>
                                                                        Quantity
                                                                        :
                                                                    </span>
                                                                    <div className="flex gap-2">
                                                                        <span className="font-bold">
                                                                            {
                                                                                w.quantity
                                                                            }
                                                                        </span>
                                                                        <span className="w-8 text-gray-500">
                                                                            pcs
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>
                                                                        Value :
                                                                    </span>
                                                                    <div className="flex gap-2">
                                                                        <span className="font-bold">
                                                                            {Number(
                                                                                w.amount
                                                                            ).toFixed(
                                                                                2
                                                                            )}
                                                                        </span>
                                                                        <span className="w-8 text-gray-500">
                                                                            Rs.
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Hardware Footer */}
                                                        <div>
                                                            <div className="bg-gray-100 border-y border-gray-300 px-3 py-1 font-bold text-gray-700">
                                                                Hardware Brand
                                                            </div>
                                                            <div className="px-3 py-2 uppercase font-medium text-gray-600">
                                                                {w.hardware ||
                                                                    "PREMIUM QUALITY"}
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

                            {/* Totals Section (Clean Document Style) */}
                            <div
                                ref={(el) => (itemRefs.current["totals"] = el)}
                                className="break-inside-avoid flex justify-end pt-8"
                            >
                                <div className="w-1/2 pl-8">
                                    <div className="space-y-3 text-sm text-gray-700">
                                        <div className="flex justify-between">
                                            <span>Total Windows</span>
                                            <span className="font-semibold">
                                                {windowList.length} pcs
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Total Area</span>
                                            <span className="font-semibold">
                                                {Number(totalSqFt).toFixed(2)}{" "}
                                                sq.ft
                                            </span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-200">
                                            <span>Subtotal</span>
                                            <span className="font-bold text-gray-900">
                                                {formatINR(subtotal)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Packing & Forwarding</span>
                                            {isPDFMode ? (
                                                <span className="font-semibold">
                                                    {formatINR(packingCharges)}
                                                </span>
                                            ) : (
                                                <div className="flex items-center border-b border-gray-300">
                                                    <span className="text-gray-400 mr-1">
                                                        ₹
                                                    </span>
                                                    <input
                                                        type="number"
                                                        value={packingCharges}
                                                        onChange={(e) =>
                                                            setPackingCharges(
                                                                Number(
                                                                    e.target
                                                                        .value
                                                                )
                                                            )
                                                        }
                                                        className="w-20 text-right outline-none bg-transparent font-semibold"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        {applyGST && (
                                            <>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-1 text-gray-500">
                                                        <span>CGST</span>
                                                        {isPDFMode ? (
                                                            <span className="text-xs">
                                                                (@{cgstPerc}%)
                                                            </span>
                                                        ) : (
                                                            <input
                                                                type="number"
                                                                className="w-6 text-center border-b border-gray-300 text-xs ml-1"
                                                                value={cgstPerc}
                                                                onChange={(e) =>
                                                                    setCgstPerc(
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    )
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                    <span>
                                                        {formatINR(cgstAmount)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-1 text-gray-500">
                                                        <span>SGST</span>
                                                        {isPDFMode ? (
                                                            <span className="text-xs">
                                                                (@{sgstPerc}%)
                                                            </span>
                                                        ) : (
                                                            <input
                                                                type="number"
                                                                className="w-6 text-center border-b border-gray-300 text-xs ml-1"
                                                                value={sgstPerc}
                                                                onChange={(e) =>
                                                                    setSgstPerc(
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    )
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                    <span>
                                                        {formatINR(sgstAmount)}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                        <div className="pt-4 border-t-2 border-gray-900 flex justify-between items-baseline mt-2">
                                            <span className="text-xs text-gray-400">
                                                Rate: ₹{avgRate}/sq.ft
                                            </span>
                                            <div className="text-right">
                                                <span className="block text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">
                                                    Grand Total
                                                </span>
                                                <span className="block text-2xl font-extrabold text-gray-900">
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

                            {/* Footer (Clean Columns) */}
                            <div
                                ref={(el) => (itemRefs.current["footer"] = el)}
                                className="break-inside-avoid mt-12 border-t-2 border-gray-100 pt-8"
                            >
                                <div className="grid grid-cols-2 gap-12 text-xs leading-relaxed text-gray-600">
                                    {/* Terms */}
                                    <div>
                                        <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-3 text-sm">
                                            Terms & Conditions
                                        </h4>
                                        <ul className="list-disc pl-4 space-y-1.5 text-justify">
                                            <li>
                                                Quotation valid for{" "}
                                                <strong>1 week</strong> (Rates
                                                subject to material price
                                                change).
                                            </li>
                                            <li>
                                                Size calculated in{" "}
                                                <strong>3-inch steps</strong>.
                                            </li>
                                            <li>
                                                Design changes post-confirmation
                                                will be charged extra.
                                            </li>
                                            <li>
                                                No warranty on glass after
                                                installation.
                                            </li>
                                            <li>
                                                Report manufacturing defects
                                                within <strong>48 hours</strong>{" "}
                                                of installation.
                                            </li>
                                            <li>
                                                Scaffolding, electricity, and
                                                storage provided by client.
                                            </li>
                                            <li>
                                                <strong>Payment:</strong> 70%
                                                Advance, 20% Before Dispatch,
                                                10% After Installation.
                                            </li>
                                            <li>
                                                <strong>Installation:</strong>{" "}
                                                40-45 Days from advance payment.
                                            </li>
                                            <li>
                                                Subject to Rajkot Jurisdiction.
                                                Transportation & GST Extra.
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Bank & Sign */}
                                    <div className="flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-3 text-sm">
                                                Bank Details
                                            </h4>
                                            <div className="grid grid-cols-[100px_auto] gap-y-1">
                                                <span className="text-gray-400 font-medium">
                                                    Bank
                                                </span>
                                                <span className="font-semibold text-gray-800">
                                                    STATE BANK OF INDIA
                                                </span>
                                                <span className="text-gray-400 font-medium">
                                                    Branch
                                                </span>
                                                <span className="font-semibold text-gray-800">
                                                    CHANDRESH NAGAR, MAVDI
                                                </span>
                                                <span className="text-gray-400 font-medium">
                                                    Account
                                                </span>
                                                <span className="font-bold text-gray-900">
                                                    34200993101
                                                </span>
                                                <span className="text-gray-400 font-medium">
                                                    IFSC
                                                </span>
                                                <span className="font-bold text-gray-900">
                                                    SBIN0060314
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-8">
                                            <div className="italic text-gray-400 text-[10px] mb-6 text-center border-t border-dashed border-gray-200 pt-2">
                                                "I hereby accept the estimate as
                                                per above specifications and
                                                agree to the terms."
                                            </div>
                                            <div className="flex justify-between items-end gap-4">
                                                <div className="flex-1 text-center">
                                                    <div className="h-12"></div>
                                                    <div className="border-t border-gray-300 pt-2 font-bold text-gray-900">
                                                        Authorised Signatory
                                                    </div>
                                                </div>
                                                <div className="flex-1 text-center">
                                                    <div className="h-12"></div>
                                                    <div className="border-t border-gray-300 pt-2 font-bold text-gray-900">
                                                        Customer Signature
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
