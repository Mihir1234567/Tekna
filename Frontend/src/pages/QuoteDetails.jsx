// src/pages/QuotePreview.jsx
import React, { useEffect, useRef, useState, useLayoutEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
    Loader2,
    RotateCcw,
    ChevronsUp,
    ChevronsDown,
    Plus,
    Minus,
    Ruler,
    Wand2,
    Printer,
    Download,
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

/* --- 2. Window Sketch Component (Traditional Look) --- */
const WindowSketch = ({ width, height, type = "normal" }) => {
    // Retaining basic logic but simplifying output for the traditional look
    const boxSize = 150;
    const strokeColor = "#000000";
    const glassColor = "#ffffff";

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

    const startX = 20;
    const startY = 20;

    return (
        <div className="relative flex flex-col items-start justify-start p-2 w-full h-full">
            {/* Height Label (Left) */}
            <div
                className="absolute left-0 top-1/2 transform -translate-y-1/2 -rotate-90 text-sm font-semibold text-gray-800 whitespace-nowrap"
                style={{ transformOrigin: "center" }}
            >
                {height}"
            </div>

            {/* Width Label (Bottom) */}
            <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 text-sm font-semibold text-gray-800">
                {width}"
            </div>

            <svg width="200" height="200" viewBox="0 0 200 200">
                {/* Outer Dimension lines */}
                <path
                    d={`M${startX} ${startY + drawH} L${startX} ${startY} L${
                        startX + drawW
                    } ${startY} L${startX + drawW} ${startY + drawH}`}
                    stroke="black"
                    strokeWidth="1"
                    fill="none"
                />

                <rect
                    x={startX}
                    y={startY}
                    width={drawW}
                    height={drawH}
                    fill={glassColor}
                    stroke={strokeColor}
                    strokeWidth="1.5"
                />

                {/* Simple Crosshair (Mimics placeholder lines in original image) */}
                <line
                    x1={startX}
                    y1={startY + drawH / 2}
                    x2={startX + drawW}
                    y2={startY + drawH / 2}
                    stroke="#ccc"
                    strokeWidth="0.5"
                    strokeDasharray="3 2"
                />
                <line
                    x1={startX + drawW / 2}
                    y1={startY}
                    x2={startX + drawW / 2}
                    y2={startY + drawH}
                    stroke="#ccc"
                    strokeWidth="0.5"
                    strokeDasharray="3 2"
                />
            </svg>
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
    // <-- CORRECTED FUNCTION NAME
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

    // --- Core Layout/Spacer Logic ---
    const updateSpacer = (key, val) =>
        setSpacers((prev) => ({ ...prev, [key]: val }));

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
            calculatePageBreaks();
        }, 200);
    };

    // --- Effects for Scale and Auto-Adjust ---
    useEffect(() => {
        const handleResize = () => {
            const w = window.innerWidth - 32;
            const target = 1024;
            setScale(w < target ? w / target : 1);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useLayoutEffect(() => {
        if (!loading && windowList.length > 0)
            setTimeout(handleAutoAdjust, 500);
    }, [loading, windowList]);

    // --- PDF Logic ---
    const downloadPDF = async () => {
        const container = mainRef.current;
        if (!container) return;

        setIsPDFMode(true);
        setShowSpacers(false);
        await new Promise((r) => setTimeout(r, 200));

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
            className={`bg-gray-100 p-4 font-sans text-gray-800 ${
                isPDFMode ? "min-h-screen" : "h-screen overflow-y-auto w-full"
            }`}
        >
            {/* --- Toolbar (Hidden in PDF) --- */}
            <div
                className={`max-w-[1024px] mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4 ${
                    isPDFMode ? "hidden" : ""
                }`}
            >
                <h1 className="text-xl font-bold text-gray-800">Preview</h1>
                <div className="flex flex-wrap justify-center gap-2">
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
                        className="px-3 py-1.5 bg-white border rounded text-xs font-medium hover:bg-gray-50"
                    >
                        Back
                    </button>
                    <button
                        onClick={downloadPDF}
                        className="px-4 py-1.5 bg-gray-800 text-white rounded text-xs font-medium hover:bg-gray-900 flex items-center gap-2"
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
                            className="bg-white shadow-2xl w-full min-h-[297mm] p-10 relative text-gray-900"
                        >
                            {/* 1. HEADER (Traditional Block Style - Centered) */}
                            <header
                                ref={(el) => (itemRefs.current["header"] = el)}
                                className="flex flex-col items-center text-center pb-6 border-b-2 border-gray-900 mb-8"
                            >
                                <div className="mb-2">
                                    {/* Logo Placeholder/Image */}
                                    {logo ? (
                                        <img
                                            src={logo}
                                            alt="Logo"
                                            className="h-16 w-16 object-contain mx-auto"
                                        />
                                    ) : (
                                        <div className="h-16 w-16 bg-red-100 border border-red-300 text-red-500 rounded flex items-center justify-center text-xs mx-auto">
                                            TWS
                                        </div>
                                    )}
                                </div>
                                <h1 className="text-3xl font-extrabold tracking-wide text-gray-900">
                                    TEKNA WINDOW SYSTEM
                                </h1>
                                <p className="text-sm text-gray-700 mt-2">
                                    VAVDI INDUSTRY AREA, VAVDI MAIN ROAD
                                </p>
                                <p className="text-sm text-gray-700">
                                    RAJKOT, GUJARAT
                                </p>

                                <div className="mt-4 flex flex-col items-center space-y-1 text-sm">
                                    <p className="flex items-center space-x-1">
                                        <span className="text-gray-500">
                                            Mobile:
                                        </span>{" "}
                                        9825256525
                                    </p>
                                    <p className="flex items-center space-x-1">
                                        <span className="text-gray-500">
                                            Email:
                                        </span>{" "}
                                        TEKNAWIN01@GMAIL.COM
                                    </p>
                                    <p className="flex items-center space-x-1 font-semibold">
                                        <span className="text-gray-500">
                                            GSTIN:
                                        </span>{" "}
                                        24AMIPS5762R1Z4
                                    </p>
                                </div>
                                <div className="absolute top-8 right-10 text-sm font-semibold text-gray-700">
                                    Date:{" "}
                                    {new Date().toLocaleDateString("en-IN")}
                                </div>
                            </header>

                            {/* 2. CLIENT INFO (Simple block, mimicking implicit structure) */}
                            <section className="mb-8 text-sm text-gray-700">
                                <h3 className="font-bold text-lg mb-4 border-b border-gray-200 pb-2">
                                    Client Details
                                </h3>
                                <p>
                                    <strong>Client:</strong>{" "}
                                    {clientDetails.clientName || "—"}
                                </p>
                                <p>
                                    <strong>Project:</strong>{" "}
                                    {clientDetails.project || "—"}
                                </p>
                                <p>
                                    <strong>Quotation No:</strong>{" "}
                                    {id || "Q-0000"}
                                </p>
                                <p>
                                    <strong>Finish:</strong>{" "}
                                    {clientDetails.finish || "—"}
                                </p>
                            </section>

                            {/* 3. WINDOWS LIST (Traditional Layout) */}
                            <section className="mb-10 space-y-8">
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
                                            ref={(el) =>
                                                (itemRefs.current[
                                                    `w-${index}`
                                                ] = el)
                                            }
                                            className="break-inside-avoid border border-gray-300 p-4"
                                        >
                                            <h4 className="font-bold text-md mb-3 border-b border-gray-200 pb-2">
                                                Window {index + 1} (
                                                {win.windowType || "NORMAL"})
                                            </h4>

                                            <div className="flex">
                                                {/* Left: Sketch */}
                                                <div className="w-1/3 flex items-center justify-center p-2">
                                                    <WindowSketch
                                                        width={win.width}
                                                        height={win.height}
                                                        type={win.windowType}
                                                    />
                                                </div>

                                                {/* Middle: Specs (Vertical List) */}
                                                <div className="w-1/3 p-2 space-y-1.5 text-sm text-gray-700">
                                                    <p>
                                                        <strong>Size:</strong> W{" "}
                                                        {win.width}" x H{" "}
                                                        {win.height}"
                                                    </p>
                                                    <p>
                                                        <strong>
                                                            Profile System:
                                                        </strong>{" "}
                                                        {win.profileSystem ||
                                                            "—"}
                                                    </p>
                                                    <p>
                                                        <strong>Design:</strong>{" "}
                                                        {win.design || "—"}
                                                    </p>
                                                    <p>
                                                        <strong>Glass:</strong>{" "}
                                                        {win.glassType || "—"}
                                                    </p>
                                                    <p>
                                                        <strong>Grill:</strong>{" "}
                                                        {win.grill || "—"}
                                                    </p>
                                                    <p>
                                                        <strong>
                                                            Locking:
                                                        </strong>{" "}
                                                        {win.locking || "—"}
                                                    </p>
                                                    <p>
                                                        <strong>Mess:</strong>{" "}
                                                        {win.mess || "—"}
                                                    </p>
                                                    <p>
                                                        <strong>
                                                            Hardware:
                                                        </strong>{" "}
                                                        {win.hardware || "—"}
                                                    </p>
                                                </div>

                                                {/* Right: Financials (COMPUTED VALUES BLOCK) */}
                                                <div className="w-1/3 p-2 border-l border-gray-200 text-sm">
                                                    <h5 className="font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">
                                                        COMPUTED VALUES
                                                    </h5>
                                                    <div className="space-y-3">
                                                        <div className="text-lg font-bold text-gray-900">
                                                            Value:{" "}
                                                            {formatINR(
                                                                win.amount
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-700">
                                                            Sq.ft:{" "}
                                                            {Number(
                                                                win.sqFt
                                                            ).toFixed(2)}
                                                        </div>
                                                        <div className="text-sm text-gray-700">
                                                            Rate:{" "}
                                                            {win.pricePerFt}
                                                        </div>
                                                        <div className="text-sm text-gray-700">
                                                            Qty: {win.quantity}{" "}
                                                            pcs
                                                        </div>
                                                    </div>
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

                            {/* 4. SUMMARY & GRAND TOTAL */}
                            <section
                                ref={(el) => (itemRefs.current["totals"] = el)}
                                className="break-inside-avoid flex justify-end mb-12"
                            >
                                <div className="w-full md:w-2/3 lg:w-1/2 p-4 border border-gray-400">
                                    <h5 className="font-bold text-gray-800 mb-3 border-b border-gray-400 pb-1">
                                        Quote Summary
                                    </h5>

                                    <div className="space-y-1.5 text-sm">
                                        <div className="flex justify-between">
                                            <span>Total Windows</span>
                                            <span>{windowList.length} pcs</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Total Sq.ft</span>
                                            <span>
                                                {Number(totalSqFt).toFixed(2)}{" "}
                                                Sq.ft.
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Subtotal Amount</span>
                                            <span>{formatINR(subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Packing & Forwarding</span>
                                            <span>
                                                {formatINR(packingCharges)}
                                            </span>
                                        </div>

                                        {applyGST && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span>
                                                        CGST (@{cgstPerc}%)
                                                    </span>
                                                    <span>
                                                        {formatINR(cgstAmount)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>
                                                        SGST (@{sgstPerc}%)
                                                    </span>
                                                    <span>
                                                        {formatINR(sgstAmount)}
                                                    </span>
                                                </div>
                                            </>
                                        )}

                                        <div className="pt-3 flex justify-between items-baseline border-t border-gray-900">
                                            <span className="font-bold text-md">
                                                GRAND TOTAL
                                            </span>
                                            <span className="text-xl font-extrabold text-gray-900">
                                                {formatINR(grandTotal)}
                                            </span>
                                        </div>
                                        <div className="text-right text-xs text-gray-500">
                                            Avg Rate:{" "}
                                            {totalSqFt > 0
                                                ? formatINR(
                                                      grandTotal / totalSqFt
                                                  )
                                                : formatINR(0)}
                                            /sq.ft
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

                            {/* 5. FOOTER (Traditional Blocks) */}
                            <section
                                ref={(el) => (itemRefs.current["footer"] = el)}
                                className="break-inside-avoid pt-8 space-y-8"
                            >
                                {/* Terms & Conditions */}
                                <div className="text-xs text-gray-700">
                                    <h5 className="font-bold text-gray-800 mb-2 border-b border-gray-400 pb-1">
                                        TERMS & CONDITIONS
                                    </h5>
                                    <ul className="list-disc pl-4 space-y-1">
                                        <li>
                                            QUOTATION VALID UPTO 1 WEEK (RATES
                                            MAY CHANGE).
                                        </li>
                                        <li>
                                            SIZE CALCULATED IN WIDTH/HEIGHT IN 3
                                            INCH STEPS.
                                        </li>
                                        <li>
                                            DESIGN/STYLE REMAINS UNCHANGED;
                                            CHANGES CHARGEABLE.
                                        </li>
                                        <li>
                                            NO WARRANTY FOR GLASS
                                            POST-INSTALLATION.
                                        </li>
                                        <li>
                                            MANUFACTURING DEFECTS: REPORT WITHIN
                                            48 HOURS.
                                        </li>
                                        <li>
                                            SCAFFOLDING/CRANE/ELECTRICITY/CLEANING:
                                            CUSTOMER SCOPE.
                                        </li>
                                        <li>
                                            STONE DAMAGE/BREAKAGE: NOT OUR
                                            RESPONSIBILITY.
                                        </li>
                                        <li>
                                            POST-HANDOVER SERVICE IS CHARGEABLE.
                                        </li>
                                        <li>
                                            INSTALLATION: 40-45 DAYS FROM
                                            ADVANCE PAYMENT.
                                        </li>
                                        <li>
                                            PAYMENT: 70% ADVANCE, 20% BEFORE
                                            DISPATCH, 10% AFTER INSTALL.
                                        </li>
                                        <li>
                                            DISPUTES SUBJECT TO RAJKOT
                                            JURISDICTION ONLY.
                                        </li>
                                        <li>TRANSPORTATION AND GST EXTRA.</li>
                                    </ul>
                                </div>

                                {/* Bank Details */}
                                <div className="text-xs">
                                    <h5 className="font-bold text-gray-800 mb-2 border-b border-gray-400 pb-1">
                                        BANK DETAILS
                                    </h5>
                                    <div className="grid grid-cols-2 gap-y-1">
                                        <p>
                                            <strong>BANK NAME:</strong> STATE
                                            BANK OF INDIA
                                        </p>
                                        <p>
                                            <strong>BRANCH:</strong> CHANDRESH
                                            NAGAR, MAVDI PLOT
                                        </p>
                                        <p>
                                            <strong>CURRENT A/C:</strong>{" "}
                                            34200993101
                                        </p>
                                        <p>
                                            <strong>IFSC CODE:</strong>{" "}
                                            SBIN0060314
                                        </p>
                                    </div>
                                </div>

                                {/* Signatures */}
                                <div className="pt-8 flex justify-between text-xs font-bold">
                                    <div className="text-center">
                                        <div className="h-12 border-b border-gray-600 w-40 mb-1 mx-auto"></div>
                                        <p>TEKNA WINDOW SYSTEM</p>
                                        <p>Authorised Signatory</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="h-12 border-b border-gray-600 w-40 mb-1 mx-auto"></div>
                                        <p>I ACCEPT THE ESTIMATE & TERMS</p>
                                        <p>Signature of Customer</p>
                                    </div>
                                </div>
                                <div className="text-right text-[10px] text-gray-400 italic mt-4">
                                    .
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
