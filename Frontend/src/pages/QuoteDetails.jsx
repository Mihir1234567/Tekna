// src/pages/QuotePreview.jsx
import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    Download,
    Phone,
    Mail,
    FileText,
    Calendar,
    User,
    Briefcase,
    CreditCard,
    Printer,
    Ruler,
    Wand2,
    Loader2,
    ChevronsUp,
    ChevronsDown,
    Plus,
    Minus,
    RotateCcw,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logo from "../assets/logo.png";
import { apiGet } from "../utils/api";
import { getToken } from "../utils/auth";

/* --- 1. Helper Functions --- */
const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(val || 0);
};

/* --- 2. Window Sketch Component --- */
const WindowSketch = ({ width, height, type = "normal" }) => {
    const boxSize = 120;
    const strokeColor = "#334155"; // Slate-700
    const glassColor = "#eff6ff"; // Blue-50

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

    const startX = (160 - drawW) / 2;
    const startY = (160 - drawH) / 2;

    return (
        <div className="relative flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-lg shadow-sm w-full h-full">
            {/* Dimensions Labels */}
            <div className="absolute top-1 text-[10px] font-bold text-slate-500">
                W: {width}"
            </div>
            <div
                className="absolute left-1 h-full flex items-center text-[10px] font-bold text-slate-500"
                style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                }}
            >
                H: {height}"
            </div>

            <svg width="160" height="160" viewBox="0 0 160 160">
                <rect
                    x={startX}
                    y={startY}
                    width={drawW}
                    height={drawH}
                    fill={glassColor}
                    stroke={strokeColor}
                    strokeWidth="2.5"
                />
                {type.toLowerCase().includes("slider") ||
                type.toLowerCase().includes("sliding") ? (
                    <>
                        <line
                            x1={startX + drawW / 2}
                            y1={startY}
                            x2={startX + drawW / 2}
                            y2={startY + drawH}
                            stroke={strokeColor}
                            strokeWidth="2"
                        />
                        <path
                            d={`M${startX + drawW * 0.25} ${
                                startY + drawH / 2
                            } l-5 0 l2 -2 m-2 2 l2 2`}
                            stroke="#94a3b8"
                            strokeWidth="1.5"
                            fill="none"
                        />
                        <path
                            d={`M${startX + drawW * 0.75} ${
                                startY + drawH / 2
                            } l5 0 l-2 -2 m2 2 l-2 2`}
                            stroke="#94a3b8"
                            strokeWidth="1.5"
                            fill="none"
                        />
                    </>
                ) : (
                    <>
                        <line
                            x1={startX + drawW / 2}
                            y1={startY + 10}
                            x2={startX + drawW / 2}
                            y2={startY + drawH - 10}
                            stroke="#cbd5e1"
                            strokeWidth="1"
                            strokeDasharray="4 2"
                        />
                        <line
                            x1={startX + 10}
                            y1={startY + drawH / 2}
                            x2={startX + drawW - 10}
                            y2={startY + drawH / 2}
                            stroke="#cbd5e1"
                            strokeWidth="1"
                            strokeDasharray="4 2"
                        />
                    </>
                )}
            </svg>
            <div className="mt-2 text-[10px] uppercase font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600 truncate max-w-full">
                {type}
            </div>
        </div>
    );
};

/* --- 3. Manual Spacer Component --- */
const ManualSpacer = ({ id, height, updateHeight, visible, pdfMode }) => {
    if ((pdfMode && height === 0) || (!pdfMode && !visible && height === 0))
        return null;

    const SMALL_STEP = 20;
    const BIG_STEP = 100;

    return (
        <div
            className="transition-all duration-200 ease-in-out my-2"
            style={{ height: `${height}px` }}
        >
            {!pdfMode && (
                <div className="h-10 bg-indigo-50 border border-dashed border-indigo-300 rounded flex items-center justify-center gap-2 text-indigo-700 select-none relative opacity-70 hover:opacity-100">
                    <div className="flex items-center bg-white rounded border border-indigo-200 overflow-hidden">
                        <button
                            onClick={() =>
                                updateHeight(id, Math.max(0, height - BIG_STEP))
                            }
                            className="p-1 hover:bg-indigo-100 border-r border-indigo-100"
                        >
                            <ChevronsUp size={14} />
                        </button>
                        <button
                            onClick={() =>
                                updateHeight(
                                    id,
                                    Math.max(0, height - SMALL_STEP)
                                )
                            }
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
                            onClick={() =>
                                updateHeight(id, height + SMALL_STEP)
                            }
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
                    <div className="absolute left-2 text-[9px] uppercase tracking-wider font-bold opacity-50">
                        Page Break Spacer
                    </div>
                </div>
            )}
        </div>
    );
};

/* --- 4. Main Component --- */
export default function QuotePreview() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();
    const mainRef = useRef(null);
    const itemRefs = useRef({});

    // --- State ---
    const [windowList, setWindowList] = useState([]);
    const [clientDetails, setClientDetails] = useState({
        clientName: "",
        project: "",
        finish: "",
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // UI/PDF State
    const [isPDFMode, setIsPDFMode] = useState(false);
    const [scale, setScale] = useState(1);
    const [spacers, setSpacers] = useState({});
    const [showSpacers, setShowSpacers] = useState(false);
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [pageBreaks, setPageBreaks] = useState([]);

    // Financial State
    const [applyGST, setApplyGST] = useState(true);
    const [cgstPerc, setCgstPerc] = useState(9);
    const [sgstPerc, setSgstPerc] = useState(9);
    const [packingCharges, setPackingCharges] = useState(0);

    // --- Fetch Data ---
    useEffect(() => {
        const fetchData = async () => {
            if (state?.windowList) {
                setWindowList(state.windowList);
                if (state.clientInfo) {
                    setClientDetails(state.clientInfo);
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
                    // Optional: Load stored pricing config here if API supports it
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

    // --- Calculations ---
    const subtotal = windowList.reduce((s, w) => s + Number(w.amount || 0), 0);
    const totalSqFt = windowList.reduce((s, w) => s + Number(w.sqFt || 0), 0);
    const cgstAmount = applyGST ? (subtotal * cgstPerc) / 100 : 0;
    const sgstAmount = applyGST ? (subtotal * sgstPerc) / 100 : 0;
    const grandTotal = subtotal + packingCharges + cgstAmount + sgstAmount;

    // --- PDF Logic ---
    const downloadPDF = async () => {
        const container = mainRef.current;
        if (!container) return;

        setIsPDFMode(true);
        setShowSpacers(false);
        await new Promise((r) => setTimeout(r, 200)); // Wait for re-render

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

        pdf.save(
            `${clientDetails.clientName || "Quotation"}_${id || "Draft"}.pdf`
        );
        setIsPDFMode(false);
    };

    // --- Spacer Logic ---
    const updateSpacer = (key, val) =>
        setSpacers((prev) => ({ ...prev, [key]: val }));

    const handleAutoAdjust = () => {
        if (!mainRef.current) return;
        setIsAdjusting(true);
        setShowSpacers(true);
        setSpacers({}); // Reset

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
            calculatePageBreaks();
        }, 200);
    };

    const calculatePageBreaks = () => {
        if (!mainRef.current) return;
        const containerHeight = mainRef.current.scrollHeight;
        const containerWidth = mainRef.current.offsetWidth;
        const pageHeightPx = containerWidth * 1.4142;
        const breaks = [];
        let currentH = pageHeightPx;
        while (currentH < containerHeight + 500) {
            breaks.push(currentH);
            currentH += pageHeightPx;
        }
        setPageBreaks(breaks);
    };

    useEffect(() => {
        // Initial Scale for screen
        const handleResize = () => {
            const w = window.innerWidth - 32;
            const target = 1024; // A4 px width rough equivalent
            setScale(w < target ? w / target : 1);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (!loading && windowList.length > 0)
            setTimeout(handleAutoAdjust, 500);
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

    return (
        <div
            className={`bg-slate-100 p-4 font-sans text-slate-800 ${
                isPDFMode ? "min-h-screen" : "h-screen overflow-y-auto w-full"
            }`}
        >
            {/* --- Toolbar (Hidden in PDF) --- */}
            <div
                className={`max-w-[1024px] mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4 ${
                    isPDFMode ? "hidden" : ""
                }`}
            >
                <h1 className="text-xl font-bold text-slate-800">Preview</h1>
                <div className="flex flex-wrap justify-center gap-2">
                    <div className="flex items-center bg-white border rounded px-2 py-1 shadow-sm text-xs">
                        <label className="flex items-center gap-2 cursor-pointer font-medium">
                            <input
                                type="checkbox"
                                checked={applyGST}
                                onChange={(e) => setApplyGST(e.target.checked)}
                                className="w-3 h-3"
                            />
                            GST Mode
                        </label>
                    </div>
                    <button
                        onClick={handleAutoAdjust}
                        disabled={isAdjusting}
                        className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-700 rounded text-xs font-medium hover:bg-indigo-50 flex items-center gap-1"
                    >
                        {isAdjusting ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Wand2 size={14} />
                        )}{" "}
                        Auto-Layout
                    </button>
                    <button
                        onClick={() => setShowSpacers(!showSpacers)}
                        className={`px-3 py-1.5 border rounded text-xs font-medium flex items-center gap-1 ${
                            showSpacers
                                ? "bg-indigo-600 text-white"
                                : "bg-white"
                        }`}
                    >
                        <Ruler size={14} />{" "}
                        {showSpacers ? "Hide Controls" : "Manual Layout"}
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-3 py-1.5 bg-white border rounded text-xs font-medium hover:bg-slate-50"
                    >
                        Back
                    </button>
                    <button
                        onClick={downloadPDF}
                        className="px-4 py-1.5 bg-slate-800 text-white rounded text-xs font-medium hover:bg-slate-900 flex items-center gap-2"
                    >
                        <Printer size={14} /> Save PDF
                    </button>
                </div>
            </div>

            {/* --- A4 Paper Container --- */}
            <div className="flex justify-center pb-20">
                <div
                    style={{
                        transform: `scale(${scale})`,
                        transformOrigin: "top center",
                        width: "1024px",
                    }}
                >
                    <div className="relative">
                        {/* Red Page Break Lines (Visual Aid) */}
                        {!isPDFMode &&
                            showSpacers &&
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

                        <div
                            ref={mainRef}
                            className="bg-white shadow-2xl w-full min-h-[297mm] p-10 relative"
                        >
                            {/* 1. HEADER */}
                            <header
                                ref={(el) => (itemRefs.current["header"] = el)}
                                className="flex justify-between items-start pb-6 border-b-2 border-slate-800 mb-8"
                            >
                                <div className="w-1/2">
                                    <div className="flex items-center gap-3 mb-2">
                                        {logo ? (
                                            <img
                                                src={logo}
                                                alt="Logo"
                                                className="h-10 w-auto object-contain"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xl">
                                                T
                                            </div>
                                        )}
                                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                                            TEKNA
                                        </h1>
                                    </div>
                                    <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mb-2">
                                        Window Systems
                                    </p>
                                    <div className="text-xs text-slate-500 leading-relaxed">
                                        <p>VAVDI INDUSTRY AREA</p>
                                        <p>VAVDI MAIN ROAD, RAJKOT</p>
                                        <p className="mt-2 font-semibold text-slate-700">
                                            GSTIN: 24AMIPS5762R1Z4
                                        </p>
                                    </div>
                                </div>
                                <div className="w-1/2 flex flex-col items-end text-right space-y-2">
                                    <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                        <Phone
                                            size={12}
                                            className="text-indigo-600"
                                        />{" "}
                                        87588 02598
                                    </div>
                                    <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                        <Mail
                                            size={12}
                                            className="text-indigo-600"
                                        />{" "}
                                        TEKNAWIN01@GMAIL.COM
                                    </div>
                                    <div className="text-xs text-slate-400 mt-2">
                                        Date:{" "}
                                        {new Date().toLocaleDateString("en-IN")}
                                    </div>
                                </div>
                            </header>

                            {/* 2. CLIENT GRID */}
                            <section className="grid grid-cols-4 gap-4 mb-10 bg-slate-50 p-5 rounded-xl border border-slate-100">
                                <div className="col-span-1">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                                        <User size={10} /> Client
                                    </span>
                                    <p className="font-bold text-slate-800 text-sm truncate">
                                        {clientDetails.clientName || "—"}
                                    </p>
                                </div>
                                <div className="col-span-1">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                                        <Briefcase size={10} /> Project
                                    </span>
                                    <p className="font-bold text-slate-800 text-sm truncate">
                                        {clientDetails.project || "—"}
                                    </p>
                                </div>
                                <div className="col-span-1">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                                        <FileText size={10} /> Quote No
                                    </span>
                                    <p className="font-mono font-bold text-indigo-600 text-sm">
                                        {id || "DRAFT"}
                                    </p>
                                </div>
                                <div className="col-span-1">
                                    <span className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                                        <Calendar size={10} /> Finish
                                    </span>
                                    <p className="font-bold text-slate-800 text-sm truncate">
                                        {clientDetails.finish || "—"}
                                    </p>
                                </div>
                            </section>

                            {/* 3. WINDOWS LIST */}
                            <section className="mb-10">
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                        Window Specifications
                                    </h3>
                                </div>

                                <div className="space-y-6">
                                    {windowList.map((win, index) => (
                                        <React.Fragment key={index}>
                                            <ManualSpacer
                                                id={`w-${index}`}
                                                visible={showSpacers}
                                                pdfMode={isPDFMode}
                                                height={
                                                    spacers[`w-${index}`] || 0
                                                }
                                                updateHeight={updateSpacer}
                                            />

                                            <div
                                                ref={(el) =>
                                                    (itemRefs.current[
                                                        `w-${index}`
                                                    ] = el)
                                                }
                                                className="break-inside-avoid flex flex-row border border-slate-200 rounded-xl overflow-hidden"
                                            >
                                                {/* Left: Sketch */}
                                                <div className="w-[200px] bg-slate-50 p-4 flex items-center justify-center border-r border-slate-200">
                                                    <WindowSketch
                                                        width={win.width}
                                                        height={win.height}
                                                        type={win.windowType}
                                                    />
                                                </div>

                                                {/* Middle: Specs */}
                                                <div className="flex-1 p-5 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                                                    <div className="col-span-2 flex justify-between items-start mb-2 border-b border-slate-100 pb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="bg-slate-800 text-white font-bold px-2 py-0.5 rounded text-[10px]">
                                                                Window{" "}
                                                                {index + 1}
                                                            </span>
                                                            <span className="font-bold text-slate-700 text-sm uppercase">
                                                                {win.windowType}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="text-slate-500 font-medium">
                                                        Dimensions
                                                    </div>
                                                    <div className="font-bold text-slate-900">
                                                        W: {win.width}" x H:{" "}
                                                        {win.height}"
                                                    </div>

                                                    <div className="text-slate-500 font-medium">
                                                        Profile
                                                    </div>
                                                    <div className="font-semibold text-slate-800 uppercase">
                                                        {win.profileSystem ||
                                                            "-"}
                                                    </div>

                                                    <div className="text-slate-500 font-medium">
                                                        Glass
                                                    </div>
                                                    <div className="font-semibold text-slate-800 uppercase">
                                                        {win.glassType || "-"}
                                                    </div>

                                                    <div className="text-slate-500 font-medium">
                                                        Hardware
                                                    </div>
                                                    <div className="font-semibold text-slate-800 uppercase">
                                                        {win.hardware ||
                                                            "Premium"}
                                                    </div>

                                                    <div className="col-span-2 mt-2 text-slate-400 text-[10px] italic pt-2 border-t border-dashed border-slate-100">
                                                        Additional:{" "}
                                                        {win.mess
                                                            ? `Mesh: ${win.mess}, `
                                                            : ""}{" "}
                                                        {win.locking
                                                            ? `Lock: ${win.locking}, `
                                                            : ""}{" "}
                                                        {win.grill
                                                            ? `Grill: ${win.grill}`
                                                            : ""}
                                                    </div>
                                                </div>

                                                {/* Right: Financials */}
                                                <div className="w-[160px] bg-slate-50 p-4 flex flex-col justify-center gap-3 border-l border-slate-200 text-right">
                                                    <div>
                                                        <span className="block text-[10px] text-slate-400 uppercase font-bold">
                                                            Area
                                                        </span>
                                                        <span className="font-bold text-slate-700">
                                                            {Number(
                                                                win.sqFt
                                                            ).toFixed(2)}{" "}
                                                            sq.ft
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[10px] text-slate-400 uppercase font-bold">
                                                            Rate
                                                        </span>
                                                        <span className="font-bold text-slate-700">
                                                            ₹{win.pricePerFt}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-[10px] text-slate-400 uppercase font-bold">
                                                            Qty
                                                        </span>
                                                        <span className="font-bold text-slate-700">
                                                            {win.quantity} pcs
                                                        </span>
                                                    </div>
                                                    <div className="mt-2 pt-2 border-t border-slate-200">
                                                        <span className="block text-[10px] text-indigo-600 font-bold uppercase">
                                                            Total
                                                        </span>
                                                        <span className="font-bold text-lg text-indigo-700">
                                                            {formatINR(
                                                                win.amount
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </section>

                            <ManualSpacer
                                id="spacer-totals"
                                visible={showSpacers}
                                pdfMode={isPDFMode}
                                height={spacers["spacer-totals"] || 0}
                                updateHeight={updateSpacer}
                            />

                            {/* 4. SUMMARY */}
                            <section
                                ref={(el) => (itemRefs.current["totals"] = el)}
                                className="break-inside-avoid flex justify-end mb-12"
                            >
                                <div className="w-1/2 bg-slate-900 text-white rounded-xl p-6 shadow-lg">
                                    <h4 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4 border-b border-slate-700 pb-2">
                                        Quote Summary
                                    </h4>

                                    <div className="flex justify-between mb-2 text-sm">
                                        <span className="text-slate-300">
                                            Total Windows
                                        </span>
                                        <span className="font-bold">
                                            {windowList.length} Units
                                        </span>
                                    </div>
                                    <div className="flex justify-between mb-2 text-sm">
                                        <span className="text-slate-300">
                                            Total Area
                                        </span>
                                        <span className="font-bold">
                                            {Number(totalSqFt).toFixed(2)} Sq.ft
                                        </span>
                                    </div>
                                    <div className="flex justify-between mb-4 text-sm">
                                        <span className="text-slate-300">
                                            Subtotal
                                        </span>
                                        <span className="font-bold">
                                            {formatINR(subtotal)}
                                        </span>
                                    </div>

                                    <div className="space-y-1 border-t border-slate-700 pt-2 mb-4">
                                        <div className="flex justify-between text-xs text-slate-400 items-center">
                                            <span>Packing Charges</span>
                                            {isPDFMode ? (
                                                <span>
                                                    {formatINR(packingCharges)}
                                                </span>
                                            ) : (
                                                <input
                                                    type="number"
                                                    value={packingCharges}
                                                    onChange={(e) =>
                                                        setPackingCharges(
                                                            Number(
                                                                e.target.value
                                                            )
                                                        )
                                                    }
                                                    className="bg-slate-800 border border-slate-600 rounded w-20 text-right px-1 text-white"
                                                />
                                            )}
                                        </div>
                                        {applyGST && (
                                            <>
                                                <div className="flex justify-between text-xs text-slate-400 items-center">
                                                    <span>
                                                        CGST ({cgstPerc}%)
                                                    </span>
                                                    {isPDFMode ? (
                                                        <span>
                                                            {formatINR(
                                                                cgstAmount
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            value={cgstPerc}
                                                            onChange={(e) =>
                                                                setCgstPerc(
                                                                    Number(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                )
                                                            }
                                                            className="bg-slate-800 border border-slate-600 rounded w-10 text-center text-white"
                                                        />
                                                    )}
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-400 items-center">
                                                    <span>
                                                        SGST ({sgstPerc}%)
                                                    </span>
                                                    {isPDFMode ? (
                                                        <span>
                                                            {formatINR(
                                                                sgstAmount
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            value={sgstPerc}
                                                            onChange={(e) =>
                                                                setSgstPerc(
                                                                    Number(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                )
                                                            }
                                                            className="bg-slate-800 border border-slate-600 rounded w-10 text-center text-white"
                                                        />
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center border-t border-slate-700 pt-4">
                                        <span className="text-lg font-light">
                                            Grand Total
                                        </span>
                                        <span className="text-2xl font-bold text-indigo-400">
                                            {formatINR(grandTotal)}
                                        </span>
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

                            {/* 5. FOOTER (Terms & Bank) */}
                            <section
                                ref={(el) => (itemRefs.current["footer"] = el)}
                                className="break-inside-avoid grid grid-cols-2 gap-8 border-t border-slate-200 pt-8"
                            >
                                <div className="text-[10px] text-slate-500 leading-relaxed">
                                    <h5 className="font-bold text-slate-800 uppercase mb-2 flex items-center gap-2">
                                        <FileText size={12} /> Terms &
                                        Conditions
                                    </h5>
                                    <ul className="list-disc pl-3 space-y-1">
                                        <li>
                                            Quotation valid for{" "}
                                            <strong>1 week</strong>. Rates
                                            subject to material price change.
                                        </li>
                                        <li>
                                            Size calculated in{" "}
                                            <strong>3-inch steps</strong>.
                                        </li>
                                        <li>
                                            Design changes post-confirmation
                                            charged extra.
                                        </li>
                                        <li>
                                            No warranty on glass after
                                            installation.
                                        </li>
                                        <li>
                                            Defects must be reported within{" "}
                                            <strong>48 hours</strong>.
                                        </li>
                                        <li>
                                            Scaffolding/electricity under
                                            customer scope.
                                        </li>
                                        <li>
                                            <strong>Payment:</strong> 70%
                                            Advance, 20% Dispatch, 10%
                                            Installation.
                                        </li>
                                        <li>
                                            <strong>Delivery:</strong> 40-45
                                            Days.
                                        </li>
                                        <li>Subject to Rajkot Jurisdiction.</li>
                                    </ul>
                                </div>

                                <div>
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                                        <h5 className="font-bold text-slate-800 uppercase mb-3 text-xs flex items-center gap-2">
                                            <CreditCard size={12} /> Bank
                                            Details
                                        </h5>
                                        <div className="grid grid-cols-[80px_1fr] gap-y-1 text-xs">
                                            <span className="text-slate-500">
                                                Bank:
                                            </span>
                                            <span className="font-bold text-slate-800">
                                                STATE BANK OF INDIA
                                            </span>
                                            <span className="text-slate-500">
                                                Branch:
                                            </span>
                                            <span className="text-slate-800">
                                                CHANDRESH NAGAR, MAVDI
                                            </span>
                                            <span className="text-slate-500">
                                                A/C No:
                                            </span>
                                            <span className="font-mono font-bold text-slate-800">
                                                34200993101
                                            </span>
                                            <span className="text-slate-500">
                                                IFSC:
                                            </span>
                                            <span className="font-mono font-bold text-slate-800">
                                                SBIN0060314
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end pt-4 gap-4">
                                        <div className="text-center flex-1">
                                            <div className="h-12 border-b border-slate-300 mb-1"></div>
                                            <p className="text-[10px] font-bold text-slate-900 uppercase">
                                                Auth. Signatory
                                            </p>
                                        </div>
                                        <div className="text-center flex-1">
                                            <div className="h-12 border-b border-slate-300 mb-1"></div>
                                            <p className="text-[10px] font-bold text-slate-900 uppercase">
                                                Customer Sign
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="mt-12 text-center text-[10px] text-slate-400">
                                <p>
                                    Thank you for choosing TEKNA Window Systems.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
