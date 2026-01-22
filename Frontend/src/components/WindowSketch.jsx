import React from "react";

const WindowSketch = ({ width, height, type = "normal" }) => {
  const boxSize = 120;
  const frameColor = "#2E3A43"; // Match 3D frame color
  const glassColor = "#A5D6E7"; // Match 3D glass color
  const frameThickness = 3; // SVG frame thickness

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
  const endX = startX + drawW;
  const endY = startY + drawH;

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

  // Render different window types - exactly matching the 3D models
  const renderWindowContent = () => {
    // Draw the outer frame first
    const frameElements = [
      <rect
        key="frame"
        x={startX}
        y={startY}
        width={drawW}
        height={drawH}
        fill="none"
        stroke={frameColor}
        strokeWidth={frameThickness}
      />,
    ];

    // Check most specific types first
    if (normalizedType === "4 track sliding") {
      // 4-Track Sliding: 4 vertical panels with 3 center sashes
      const panelW = drawW / 4;
      return (
        <>
          {frameElements}
          {/* 4 Glass panels */}
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={`glass-${i}`}
              x={startX + i * panelW}
              y={startY}
              width={panelW}
              height={drawH}
              fill={glassColor}
              stroke="none"
            />
          ))}
          {/* 3 vertical sashes */}
          {[1, 2, 3].map((i) => (
            <line
              key={`sash-${i}`}
              x1={startX + i * panelW}
              y1={startY}
              x2={startX + i * panelW}
              y2={endY}
              stroke={frameColor}
              strokeWidth="1.5"
            />
          ))}
        </>
      );
    } else if (normalizedType === "slider") {
      // Slider: 2 panels with center sash
      const midX = startX + drawW / 2;
      return (
        <>
          {frameElements}
          {/* Left glass panel */}
          <rect
            x={startX}
            y={startY}
            width={drawW / 2}
            height={drawH}
            fill={glassColor}
            stroke="none"
          />
          {/* Right glass panel */}
          <rect
            x={midX}
            y={startY}
            width={drawW / 2}
            height={drawH}
            fill={glassColor}
            stroke="none"
          />
          {/* Center vertical sash */}
          <line x1={midX} y1={startY} x2={midX} y2={endY} stroke={frameColor} strokeWidth="1.5" />
        </>
      );
    } else if (normalizedType === "fix left") {
      // Fix Left: 3 columns (left openable, center fixed, right fixed)
      const colW = drawW / 3;
      return (
        <>
          {frameElements}
          {/* Left, center, right glass panels */}
          <rect x={startX} y={startY} width={colW} height={drawH} fill={glassColor} stroke="none" />
          <rect x={startX + colW} y={startY} width={colW} height={drawH} fill={glassColor} stroke="none" />
          <rect x={startX + 2 * colW} y={startY} width={colW} height={drawH} fill={glassColor} stroke="none" />
          {/* Vertical sashes */}
          <line x1={startX + colW} y1={startY} x2={startX + colW} y2={endY} stroke={frameColor} strokeWidth="1.5" />
          <line x1={startX + 2 * colW} y1={startY} x2={startX + 2 * colW} y2={endY} stroke={frameColor} strokeWidth="1.5" />
          {/* Openable indicator (X) on left panel */}
          <line x1={startX + 2} y1={startY + 2} x2={startX + colW - 2} y2={endY - 2} stroke="#94a3b8" strokeWidth="0.8" opacity="0.5" />
          <line x1={startX + colW - 2} y1={startY + 2} x2={startX + 2} y2={endY - 2} stroke="#94a3b8" strokeWidth="0.8" opacity="0.5" />
        </>
      );
    } else if (normalizedType === "fix right") {
      // Fix Right: 2 columns (left fixed, right openable)
      const colW = drawW / 2;
      return (
        <>
          {frameElements}
          {/* Left, right glass panels */}
          <rect x={startX} y={startY} width={colW} height={drawH} fill={glassColor} stroke="none" />
          <rect x={startX + colW} y={startY} width={colW} height={drawH} fill={glassColor} stroke="none" />
          {/* Center vertical sash */}
          <line x1={startX + colW} y1={startY} x2={startX + colW} y2={endY} stroke={frameColor} strokeWidth="1.5" />
          {/* Openable indicator (X) on right panel */}
          <line x1={startX + colW + 2} y1={startY + 2} x2={endX - 2} y2={endY - 2} stroke="#94a3b8" strokeWidth="0.8" opacity="0.5" />
          <line x1={endX - 2} y1={startY + 2} x2={startX + colW + 2} y2={endY - 2} stroke="#94a3b8" strokeWidth="0.8" opacity="0.5" />
        </>
      );
    } else if (normalizedType === "fix partision door") {
      // Fix Partition Door: 3x3 grid on left, transom top-right, door bottom-right
      const colW = drawW / 3;
      const rowH = drawH / 3;
      return (
        <>
          {frameElements}
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
                stroke="none"
              />
            ))
          )}
          {/* Transom on right top */}
          <rect x={startX + 2 * colW} y={startY} width={colW} height={rowH} fill={glassColor} stroke="none" />
          {/* Door on right bottom (2 rows) */}
          <rect x={startX + 2 * colW} y={startY + rowH} width={colW} height={2 * rowH} fill={glassColor} stroke="none" />
          
          {/* Vertical mullions */}
          <line x1={startX + colW} y1={startY} x2={startX + colW} y2={endY} stroke={frameColor} strokeWidth="1.5" />
          <line x1={startX + 2 * colW} y1={startY} x2={startX + 2 * colW} y2={endY} stroke={frameColor} strokeWidth="1.5" />
          
          {/* Horizontal mullions */}
          <line x1={startX} y1={startY + rowH} x2={endX} y2={startY + rowH} stroke={frameColor} strokeWidth="1.5" />
          <line x1={startX} y1={startY + 2 * rowH} x2={endX} y2={startY + 2 * rowH} stroke={frameColor} strokeWidth="1.5" />
          
          {/* Door handle indicator */}
          <circle cx={startX + 2 * colW + colW * 0.15} cy={startY + rowH + rowH} r="1" fill={frameColor} />
        </>
      );
    } else if (normalizedType === "fix sliding") {
      // Fix Sliding: 3 panels with 2 center sashes
      const panelW = drawW / 3;
      return (
        <>
          {frameElements}
          {/* 3 Glass panels */}
          {[0, 1, 2].map((i) => (
            <rect
              key={`glass-${i}`}
              x={startX + i * panelW}
              y={startY}
              width={panelW}
              height={drawH}
              fill={glassColor}
              stroke="none"
            />
          ))}
          {/* 2 vertical sashes */}
          {[1, 2].map((i) => (
            <line
              key={`sash-${i}`}
              x1={startX + i * panelW}
              y1={startY}
              x2={startX + i * panelW}
              y2={endY}
              stroke={frameColor}
              strokeWidth="1.5"
            />
          ))}
        </>
      );
    } else if (normalizedType === "bathroom window with top vent") {
      // Bathroom: Top vent (32%) + bottom main (68%) with horizontal divider
      const topH = drawH * 0.32;
      const bottomH = drawH - topH;
      const dividerY = startY + topH;
      return (
        <>
          {frameElements}
          {/* Top vent glass */}
          <rect x={startX} y={startY} width={drawW} height={topH} fill={glassColor} stroke="none" />
          {/* Bottom main glass */}
          <rect x={startX} y={dividerY} width={drawW} height={bottomH} fill={glassColor} stroke="none" />
          
          {/* Horizontal divider (mullion) */}
          <line x1={startX} y1={dividerY} x2={endX} y2={dividerY} stroke={frameColor} strokeWidth="2" />
          
          {/* Vertical center divider on top */}
          <line x1={startX + drawW / 2} y1={startY} x2={startX + drawW / 2} y2={dividerY} stroke={frameColor} strokeWidth="1.5" />
          {/* Vertical center divider on bottom */}
          <line x1={startX + drawW / 2} y1={dividerY} x2={startX + drawW / 2} y2={endY} stroke={frameColor} strokeWidth="1.5" />
        </>
      );
    } else {
      // Default/Normal: Single glass panel (no internal divisions)
      return (
        <>
          {frameElements}
          <rect x={startX} y={startY} width={drawW} height={drawH} fill={glassColor} stroke="none" />
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

export default WindowSketch;
