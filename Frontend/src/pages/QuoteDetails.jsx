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
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logo from "../assets/logo.png";
import { apiGet } from "../utils/api";
import { getToken } from "../utils/auth";
// import { API_BASE_URL } from "../utils/config";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE || "https://tekna-ryyc.onrender.com";

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

  // Normalize type for comparison
  const normalizedType = type?.toLowerCase() || "normal";

  // Helper to draw dimension lines
  const DimensionLines = () => (
    <>
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
    </>
  );

  // Render different window types
  const renderWindowContent = () => {
    // Check most specific types first
    if (normalizedType.includes("4 track sliding")) {
      // 4-Track Sliding: 4 vertical panels
      const panelW = drawW / 4;
      return (
        <>
          {/* Glass panels */}
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={`panel-${i}`}
              x={startX + i * panelW}
              y={startY}
              width={panelW}
              height={drawH}
              fill={glassColor}
              stroke={strokeColor}
              strokeWidth="1.5"
            />
          ))}
          {/* Vertical track lines */}
          {[1, 2, 3].map((i) => (
            <line
              key={`track-${i}`}
              x1={startX + i * panelW}
              y1={startY}
              x2={startX + i * panelW}
              y2={startY + drawH}
              stroke={strokeColor}
              strokeWidth="2"
            />
          ))}
          {/* Arrows indicating sliding panels */}
          {[0.5, 2.5].map((pos) => (
            <g key={`arrow-${pos}`}>
              <path
                d={`M${startX + pos * panelW - 5} ${startY + drawH / 2} l3 -2 m-3 2 l3 2`}
                stroke="#94a3b8"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d={`M${startX + pos * panelW + 5} ${startY + drawH / 2} l-3 -2 m3 2 l-3 2`}
                stroke="#94a3b8"
                strokeWidth="1.5"
                fill="none"
              />
            </g>
          ))}
        </>
      );
    } else if (normalizedType === "slider") {
      // 2-Panel Slider: Center divider with sliding arrows
      return (
        <>
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
            x1={startX + drawW / 2}
            y1={startY}
            x2={startX + drawW / 2}
            y2={startY + drawH}
            stroke={strokeColor}
            strokeWidth="2"
          />
          {/* Left sliding arrow */}
          <path
            d={`M${startX + drawW * 0.25} ${startY + drawH / 2} l-3 -2 m3 2 l-3 2`}
            stroke="#94a3b8"
            strokeWidth="1.5"
            fill="none"
          />
          {/* Right sliding arrow */}
          <path
            d={`M${startX + drawW * 0.75} ${startY + drawH / 2} l3 -2 m-3 2 l3 2`}
            stroke="#94a3b8"
            strokeWidth="1.5"
            fill="none"
          />
        </>
      );
    } else if (normalizedType === "fix left") {
      // Fix left: Left openable, center and right fixed
      const colW = drawW / 3;
      return (
        <>
          {/* Left openable with X */}
          <rect
            x={startX}
            y={startY}
            width={colW}
            height={drawH}
            fill={glassColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          <line
            x1={startX}
            y1={startY}
            x2={startX + colW}
            y2={startY + drawH}
            stroke="#cbd5e1"
            strokeWidth="1"
          />
          <line
            x1={startX + colW}
            y1={startY}
            x2={startX}
            y2={startY + drawH}
            stroke="#cbd5e1"
            strokeWidth="1"
          />
          {/* Center fixed */}
          <rect
            x={startX + colW}
            y={startY}
            width={colW}
            height={drawH}
            fill={glassColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          {/* Right fixed */}
          <rect
            x={startX + 2 * colW}
            y={startY}
            width={colW}
            height={drawH}
            fill={glassColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          {/* Vertical dividers */}
          <line
            x1={startX + colW}
            y1={startY}
            x2={startX + colW}
            y2={startY + drawH}
            stroke={strokeColor}
            strokeWidth="2"
          />
          <line
            x1={startX + 2 * colW}
            y1={startY}
            x2={startX + 2 * colW}
            y2={startY + drawH}
            stroke={strokeColor}
            strokeWidth="2"
          />
        </>
      );
    } else if (normalizedType.includes("fix right")) {
      // Fix right: Left fixed, right openable
      const colW = drawW / 2;
      return (
        <>
          {/* Left fixed */}
          <rect
            x={startX}
            y={startY}
            width={colW}
            height={drawH}
            fill={glassColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          {/* Right openable with X */}
          <rect
            x={startX + colW}
            y={startY}
            width={colW}
            height={drawH}
            fill={glassColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          <line
            x1={startX + colW}
            y1={startY}
            x2={startX + 2 * colW}
            y2={startY + drawH}
            stroke="#cbd5e1"
            strokeWidth="1"
          />
          <line
            x1={startX + 2 * colW}
            y1={startY}
            x2={startX + colW}
            y2={startY + drawH}
            stroke="#cbd5e1"
            strokeWidth="1"
          />
          {/* Center divider */}
          <line
            x1={startX + colW}
            y1={startY}
            x2={startX + colW}
            y2={startY + drawH}
            stroke={strokeColor}
            strokeWidth="2"
          />
        </>
      );
    } else if (normalizedType === "fix partision door") {
      // Fix partition door: Grid with door on right
      const colW = drawW / 3;
      const rowH = drawH / 3;
      return (
        <>
          {/* Left 2 columns: 3x3 grid */}
          {[0, 1].map((col) =>
            [0, 1, 2].map((row) => (
              <rect
                key={`grid-${col}-${row}`}
                x={startX + col * colW}
                y={startY + row * rowH}
                width={colW}
                height={rowH}
                fill={glassColor}
                stroke={strokeColor}
                strokeWidth="1"
              />
            ))
          )}
          {/* Door on right (bottom 2 rows) */}
          <rect
            x={startX + 2 * colW}
            y={startY + rowH}
            width={colW}
            height={2 * rowH}
            fill={glassColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          {/* Transom (top right) */}
          <rect
            x={startX + 2 * colW}
            y={startY}
            width={colW}
            height={rowH}
            fill={glassColor}
            stroke={strokeColor}
            strokeWidth="1"
          />
          {/* Door handle */}
          <circle
            cx={startX + 2 * colW + colW * 0.2}
            cy={startY + rowH + rowH}
            r="1.5"
            fill={strokeColor}
          />
          {/* Vertical mullions */}
          {[1, 2].map((col) => (
            <line
              key={`vmull-${col}`}
              x1={startX + col * colW}
              y1={startY}
              x2={startX + col * colW}
              y2={startY + drawH}
              stroke={strokeColor}
              strokeWidth="1.5"
            />
          ))}
          {/* Horizontal mullions */}
          {[1, 2].map((row) => (
            <line
              key={`hmull-${row}`}
              x1={startX}
              y1={startY + row * rowH}
              x2={startX + drawW}
              y2={startY + row * rowH}
              stroke={strokeColor}
              strokeWidth="1.5"
            />
          ))}
        </>
      );
    } else if (normalizedType === "fix sliding") {
      // 3-Track Sliding: 3 vertical panels
      const panelW = drawW / 3;
      return (
        <>
          {/* Glass panels */}
          {[0, 1, 2].map((i) => (
            <rect
              key={`panel-${i}`}
              x={startX + i * panelW}
              y={startY}
              width={panelW}
              height={drawH}
              fill={glassColor}
              stroke={strokeColor}
              strokeWidth="1.5"
            />
          ))}
          {/* Vertical track lines */}
          {[1, 2].map((i) => (
            <line
              key={`track-${i}`}
              x1={startX + i * panelW}
              y1={startY}
              x2={startX + i * panelW}
              y2={startY + drawH}
              stroke={strokeColor}
              strokeWidth="2"
            />
          ))}
          {/* Arrows indicating sliding panels */}
          {[0.5, 1.5].map((pos) => (
            <g key={`arrow-${pos}`}>
              <path
                d={`M${startX + pos * panelW - 4} ${startY + drawH / 2} l2 -1.5 m-2 1.5 l2 1.5`}
                stroke="#94a3b8"
                strokeWidth="1"
                fill="none"
              />
              <path
                d={`M${startX + pos * panelW + 4} ${startY + drawH / 2} l-2 -1.5 m2 1.5 l-2 1.5`}
                stroke="#94a3b8"
                strokeWidth="1"
                fill="none"
              />
            </g>
          ))}
        </>
      );
    } else if (normalizedType === "bathroom window with top vent") {
      // Bathroom window: Top vent + bottom main window
      const topHeight = drawH * 0.3;
      const bottomHeight = drawH * 0.7;
      return (
        <>
          {/* Top vent (small window) */}
          <rect
            x={startX}
            y={startY}
            width={drawW}
            height={topHeight}
            fill={glassColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          {/* Bottom main window */}
          <rect
            x={startX}
            y={startY + topHeight}
            width={drawW}
            height={bottomHeight}
            fill={glassColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          {/* Horizontal divider */}
          <line
            x1={startX}
            y1={startY + topHeight}
            x2={startX + drawW}
            y2={startY + topHeight}
            stroke={strokeColor}
            strokeWidth="2"
          />
          {/* Center dividers for openable panels */}
          <line
            x1={startX + drawW / 2}
            y1={startY}
            x2={startX + drawW / 2}
            y2={startY + topHeight}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          <line
            x1={startX + drawW / 2}
            y1={startY + topHeight}
            x2={startX + drawW / 2}
            y2={startY + drawH}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          {/* Sliding arrows for bottom */}
          <path
            d={`M${startX + drawW * 0.25} ${startY + topHeight + bottomHeight / 2} l-3 -2 m3 2 l-3 2`}
            stroke="#94a3b8"
            strokeWidth="1"
            fill="none"
          />
          <path
            d={`M${startX + drawW * 0.75} ${startY + topHeight + bottomHeight / 2} l3 -2 m-3 2 l3 2`}
            stroke="#94a3b8"
            strokeWidth="1"
            fill="none"
          />
        </>
      );
    } else {
      // Default/Normal: Simple 4-pane window
      const halfW = drawW / 2;
      const halfH = drawH / 2;
      return (
        <>
          {/* Four panes */}
          <rect
            x={startX}
            y={startY}
            width={halfW}
            height={halfH}
            fill={glassColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          <rect
            x={startX + halfW}
            y={startY}
            width={halfW}
            height={halfH}
            fill={glassColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          <rect
            x={startX}
            y={startY + halfH}
            width={halfW}
            height={halfH}
            fill={glassColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          <rect
            x={startX + halfW}
            y={startY + halfH}
            width={halfW}
            height={halfH}
            fill={glassColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          {/* Center cross dividers */}
          <line
            x1={startX + halfW}
            y1={startY}
            x2={startX + halfW}
            y2={startY + drawH}
            stroke={strokeColor}
            strokeWidth="2"
          />
          <line
            x1={startX}
            y1={startY + halfH}
            x2={startX + drawW}
            y2={startY + halfH}
            stroke={strokeColor}
            strokeWidth="2"
          />
        </>
      );
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <DimensionLines />
        {renderWindowContent()}
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

/* --- 2. The Reusable Template --- */
const QuoteTemplate = React.forwardRef(
  (
    {
      data,
      financials,
      actions,
      spacers,
      showSpacers,
      updateSpacer,
      isPDFMode,
      itemRefs,
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
        {/* HEADER [cite: 1-5] */}
        <header
          ref={(el) => setRef("header", el)}
          className="flex justify-between items-start pb-6 border-b-2 border-gray-900 mb-8"
        >
          <div className="flex flex-col items-start text-left w-2/3">
            <h1 className="text-3xl font-extrabold tracking-wide text-gray-900 mb-1">
              TEKNA WINDOW SYSTEM
            </h1>
            <p className="text-sm text-gray-700">VAVDI INDUSTRY AREA</p>
            <p className="text-sm text-gray-700 mb-4">VAVDI MAIN ROAD</p>
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
            {/* Date from PDF example [cite: 14] */}
            <div className="mt-4 px-3 py-1.5 text-sm font-bold text-gray-800">
              Date: {new Date().toLocaleDateString("en-IN")}
            </div>
          </div>
        </header>

        {/* CLIENT INFO [cite: 6] */}
        <section className="mb-10">
          <div className="grid grid-cols-4 gap-4 text-sm bg-slate-50 p-4 rounded border border-slate-200">
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                Client Name
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
                Quotation No.
              </span>
              <span className="font-bold text-indigo-700 font-mono">
                {data.id ? `QE/TK/${data.id}` : "—"}
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
                      Location: W{index + 1}
                    </span>
                    <span className="font-bold text-slate-600 uppercase tracking-wider">
                      {win.windowType}
                    </span>
                  </div>
                  <div className="grid grid-cols-[85px_1fr] gap-y-1.5 leading-tight">
                    <span className="font-bold text-slate-500">
                      Size (Inch):
                    </span>
                    <span>
                      W {win.width} x H {win.height}
                    </span>
                    <span className="font-bold text-slate-500">
                      Profile System:
                    </span>
                    <span className="uppercase">
                      {win.profileSystem || "-"}
                    </span>
                    <span className="font-bold text-slate-500">Design:</span>
                    <span className="uppercase">{win.design || "-"}</span>
                    <span className="font-bold text-slate-500">Glass:</span>
                    <span className="uppercase">{win.glassType || "-"}</span>
                    <span className="font-bold text-slate-500">Mess:</span>
                    <span className="uppercase">{win.mess || ""}</span>
                    <span className="font-bold text-slate-500">Locking:</span>
                    <span className="uppercase">{win.locking || ""}</span>
                    <span className="font-bold text-slate-500">Grill:</span>
                    <span className="uppercase">{win.grill || ""}</span>
                  </div>
                </div>
                <div className="w-[140px] border-l border-gray-300 bg-slate-50 p-4 flex flex-col justify-center gap-2 text-right">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">
                      Sq.ft per Window
                    </span>
                    <span className="font-bold text-slate-800">
                      {Number(win.sqFt).toFixed(2)} Sq.ft.
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">
                      Rate sq.ft
                    </span>
                    <span className="font-bold text-slate-800">
                      {win.pricePerFt} Rs.
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">
                      Quantity
                    </span>
                    <span className="font-bold text-slate-800">
                      {win.quantity} pcs
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-300">
                    <span className="block text-[10px] font-bold text-indigo-600 uppercase">
                      Value
                    </span>
                    <span className="font-bold text-lg text-indigo-900">
                      {Number(win.amount).toFixed(2)} Rs.
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

        {/* SUMMARY WITH EMBEDDED INPUTS [cite: 66] */}
        <section
          ref={(el) => setRef("totals", el)}
          className="break-inside-avoid flex justify-end mb-10"
        >
          <div className="w-1/2 border border-slate-900 p-0">
            <div className="bg-slate-900 text-white px-4 py-2 text-sm font-bold uppercase tracking-wider">
              Quote Total
            </div>
            <div className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Windows</span>
                <span className="font-bold">{windowList.length} pcs</span>
              </div>
              <div className="flex justify-between">
                <span>Total Sq.ft:</span>
                <span className="font-bold">
                  {Number(totalSqFt).toFixed(2)} Sq.ft.
                </span>
              </div>
              <div className="border-t border-slate-200 my-2"></div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span>{subtotal.toFixed(2)} Rs.</span>
              </div>

              {/* Packing Charges */}
              <div className="flex justify-between text-slate-600 items-center">
                <span>Packing And Forwarding Charges :</span>
                {isPDFMode ? (
                  <span>{packingCharges} Rs.</span>
                ) : (
                  <div className="flex items-center border-b border-slate-300 group focus-within:border-indigo-500 transition-colors">
                    <input
                      type="number"
                      value={packingCharges}
                      onChange={(e) =>
                        actions.setPackingCharges(Number(e.target.value))
                      }
                      className="w-20 text-right outline-none bg-transparent font-semibold text-slate-700 focus:text-indigo-700"
                    />
                    <span className="text-gray-500 ml-1 text-xs">Rs.</span>
                  </div>
                )}
              </div>

              {/* GST Logic */}
              {applyGST && (
                <>
                  {/* CGST */}
                  <div className="flex justify-between text-slate-600 items-center">
                    <div className="flex items-center gap-1">
                      {isPDFMode ? (
                        <span>CGST @ {cgstPerc}</span>
                      ) : (
                        <div className="flex items-center">
                          <span>CGST @ </span>
                          <input
                            type="number"
                            value={cgstPerc}
                            onChange={(e) =>
                              actions.setCgstPerc(Number(e.target.value))
                            }
                            className="w-8 text-center border-b border-slate-300 text-xs mx-0.5 bg-transparent outline-none font-bold text-indigo-600 focus:border-indigo-500"
                          />
                        </div>
                      )}
                    </div>
                    <span>{cgstAmount.toFixed(1)} Rs.</span>
                  </div>

                  {/* SGST */}
                  <div className="flex justify-between text-slate-600 items-center">
                    <div className="flex items-center gap-1">
                      {isPDFMode ? (
                        <span>SGST @ {sgstPerc}</span>
                      ) : (
                        <div className="flex items-center">
                          <span>SGST @ </span>
                          <input
                            type="number"
                            value={sgstPerc}
                            onChange={(e) =>
                              actions.setSgstPerc(Number(e.target.value))
                            }
                            className="w-8 text-center border-b border-slate-300 text-xs mx-0.5 bg-transparent outline-none font-bold text-indigo-600 focus:border-indigo-500"
                          />
                        </div>
                      )}
                    </div>
                    <span>{sgstAmount.toFixed(1)} Rs.</span>
                  </div>
                </>
              )}

              <div className="border-t-2 border-slate-900 pt-2 mt-2 flex justify-between items-center">
                <span className="font-bold text-lg">Grand Total :</span>
                <span className="font-bold text-xl text-indigo-700">
                  {Math.round(grandTotal)} Rs.
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

        {/* FOOTER  */}
        <section
          ref={(el) => setRef("footer", el)}
          className="break-inside-avoid pt-4 border-t border-gray-200"
        >
          <div className="grid grid-cols-2 gap-8">
            <div className="text-[10px] text-gray-600 leading-relaxed">
              <h5 className="font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1 uppercase">
                Terms & Condition:
              </h5>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>
                  QUOTATION ARE VALID UPTO 1 WEEK(RATE MAY CHANGE DEPENDING ON
                  MATERIAL PRICE CHANGE).
                </li>
                <li>SIZE IS CALCULATED IN WIDTH AND HEIGHT IN 3 INCH STEPS.</li>
                <li>
                  THE DESIGN AND STYLE OF PRODUCT REMAINS UNCHANGED. THE
                  CUSTOMER WILL BE CHARGED FOR THAT.
                </li>
                <li>
                  THERE IS NO WARRANTY FOR GLASS ONCE INSTALLATION IS DONE.
                </li>
                <li>
                  FOR MANUFACTURING DEFECT, CLIENT HAS TO INFORM US WITHIN 48
                  HOURS AFTER INSTALLATION. AFTER THE TIME PERIOD, TEKNA WINDOW
                  SYSTEM WILL BE NOT LIABLE FOR ANY DEFECTS.
                </li>
                <li>
                  SCAFFOLDING/CRANE SERVICE, ELECTRICITY, STORAGE FOR MATERIAL
                  AND CLEANING OF GLASS & WINDOW WILL BE UNDER CUSTOMER'S SCOPE.
                </li>
                <li>
                  ANY DAMAGE OR BREACKAGE OF STONE WILL NOT BE OUR
                  RESPONSIBILITY.
                </li>
                <li>
                  AFTER HANDOVERING WINDOWS, IF ANY SERVICE REQUIRE RELATED TO
                  WINDOWS & DOORS, THAT SHOULD BE CHARGEABLE.
                </li>
                <li>
                  INSTALLATION TIME: 40-45 DAYS. (DELIVERY TIME WILL BE
                  SCHEDULED AT THE TIME OF ADVANCE PAYMENT RECEIVED).
                </li>
                <li>
                  PAYMENT TERMS: 70% ADVANCE TO CONFIRM ORDER. 20% AGAINST
                  MATERIAL AT READY TO DISPATCH. 10% AFTER SUCCESSFUL
                  INSTALLATION.
                </li>
                <li>
                  ALL DISPUTES SHALL BE SUBJECT RAJKOT CITY JURISDICTION ONLY.
                </li>
                <li>TRANSPORTATION AND GST EXTRA.</li>
              </ul>
            </div>
            <div>
              <div className="bg-slate-50 p-3 border border-slate-200 rounded mb-6 text-xs">
                <h5 className="font-bold text-gray-900 mb-2 border-b border-slate-200 pb-1 uppercase">
                  BANK DETAILS
                </h5>
                <div className="grid grid-cols-[110px_1fr] gap-y-1">
                  <span className="text-slate-500">BANK NAME :</span>
                  <span className="font-bold">STATE BANK OF INDIA</span>
                  <span className="text-slate-500">BRANCH :</span>
                  <span className="font-bold">CHANDRESH NAGAR, MAVDI PLOT</span>
                  <span className="text-slate-500">CURRENT A/C NO. :</span>
                  <span className="font-mono font-bold">34200993101</span>
                  <span className="text-slate-500">IFSC CODE :</span>
                  <span className="font-mono font-bold">SBIN0060314</span>
                </div>
              </div>

              {/* Acceptance Text [cite: 90-91] */}
              <div className="text-[9px] font-bold text-gray-800 mb-4 leading-tight">
                I HEREBY ACCEPT THE ESTIMATE AS PER ABOVE MENTIONED PRICE AND
                SPECIFICATIONS. I HAVE READ AND UNDERSTOOD THE TERMS &
                CONDITIONS AND AGREE TO THEM.
              </div>

              <div className="flex justify-between items-end gap-4 text-xs font-bold text-center">
                <div className="flex-1">
                  <div className="h-10 border-b border-gray-400 mb-1"></div>
                  <p>Authorised Signatory</p>
                </div>
                <div className="flex-1">
                  <div className="h-10 border-b border-gray-400 mb-1"></div>
                  <p>Signature of Customer</p>
                </div>
              </div>
            </div>
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

  const mainRef = useRef(null);
  const mainRefPrint = useRef(null);
  const itemRefs = useRef({});

  const [windowList, setWindowList] = useState([]);
  const [selectedWindowType, setSelectedWindowType] = useState(""); // Track selected window type for PDF
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

  // Filter windows based on selected type for PDF display
  const filteredWindowList = selectedWindowType
    ? windowList.filter(w => w.windowType === selectedWindowType)
    : windowList;

  const subtotal = filteredWindowList.reduce((s, w) => s + Number(w.amount || 0), 0);
  const totalSqFt = filteredWindowList.reduce((s, w) => s + Number(w.sqFt || 0), 0);
  const cgstAmount = applyGST ? (subtotal * cgstPerc) / 100 : 0;
  const sgstAmount = applyGST ? (subtotal * sgstPerc) / 100 : 0;
  const grandTotal = subtotal + packingCharges + cgstAmount + sgstAmount;

  // --- Fetch Data ---
  useEffect(() => {
    const fetchData = async () => {
      if (state?.windowList) {
        setWindowList(state.windowList);
        if (state.clientInfo) setClientDetails(state.clientInfo);
        if (state.selectedWindowType) setSelectedWindowType(state.selectedWindowType);
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
            if (data.quote.selectedWindowType) {
              setSelectedWindowType(data.quote.selectedWindowType);
            }
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
      const res = await fetch(`${API_BASE_URL}/api/quotes/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Quote Saved Successfully!");
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Error saving quote.");
    } finally {
      setIsSaving(false);
    }
  };

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

  const downloadPDF = async () => {
    const printNode = mainRefPrint.current;
    if (!printNode) return;

    setIsPDFMode(true);
    await new Promise((r) => setTimeout(r, 200));

    const originalDPR = window.devicePixelRatio;
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
        scale: 2,
        width: 794,
        useCORS: true,
        scrollY: 0,
        windowWidth: 1200,
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
      Object.defineProperty(window, "devicePixelRatio", {
        writable: true,
        configurable: true,
        value: originalDPR,
      });
      setIsPDFMode(false);
    }
  };

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

  const templateProps = {
    data: { windowList: filteredWindowList, clientDetails, id },
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
    actions: { setApplyGST, setCgstPerc, setSgstPerc, setPackingCharges },
    spacers,
    showSpacers,
    updateSpacer,
    isPDFMode,
  };

  // Get unique window types for filtering
  const uniqueWindowTypes = [...new Set(windowList.map(w => w.windowType))].filter(Boolean);

  return (
    <div className="bg-gray-100 p-4 font-sans text-gray-800 h-screen overflow-y-auto w-full">
      {/* --- Toolbar --- */}
      <div className="max-w-[794px] mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-xl font-bold text-gray-800">Preview</h1>
        <div className="flex flex-wrap justify-center gap-2 items-center">
          {/* Window Type Filter Selector */}
          {uniqueWindowTypes.length > 1 && (
            <div className="flex items-center bg-white border rounded px-3 py-1.5 shadow-sm text-xs">
              <label className="mr-2 font-medium text-gray-600">Filter by Type:</label>
              <select
                value={selectedWindowType}
                onChange={(e) => setSelectedWindowType(e.target.value)}
                className="text-xs font-medium text-gray-700 bg-white border-0 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Types</option>
                {uniqueWindowTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          )}

          {/* Only GST Enable Toggle remains in Toolbar */}
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

      {/* --- VISIBLE SCREEN PREVIEW --- */}
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
            <QuoteTemplate
              ref={mainRef}
              {...templateProps}
              itemRefs={itemRefs}
            />
          </div>
        </div>
      </div>

      {/* --- HIDDEN PRINT PREVIEW --- */}
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
        <QuoteTemplate
          ref={mainRefPrint}
          {...templateProps}
          itemRefs={null}
          isPDFMode={true}
        />
      </div>
    </div>
  );
}
