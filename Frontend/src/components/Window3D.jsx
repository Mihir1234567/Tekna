import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Text, Line } from "@react-three/drei";
import * as THREE from "three";

// ✅ Window Type Mapping - Normalize dropdown values to lowercase enum
const WINDOW_TYPES = {
    NORMAL: "normal",
    SLIDER: "slider",
    FIX_LEFT: "fix_left",
    FIX_RIGHT: "fix_right",
    FIX_PARTITION_DOOR: "fix_partition_door",
    BATHROOM_WINDOW_WITH_TOP_VENT: "bathroom_window_with_top_vent",
    FIX_SLIDING: "fix_sliding",
    FOUR_TRACK_SLIDING: "4_track_sliding",
};

// Map dropdown display values to enum values
const normalizeWindowType = (type) => {
    const typeMap = {
        "Normal": WINDOW_TYPES.NORMAL,
        "Slider": WINDOW_TYPES.SLIDER,
        "fix left": WINDOW_TYPES.FIX_LEFT,
        "Bathroom window with top vent": WINDOW_TYPES.BATHROOM_WINDOW_WITH_TOP_VENT,
        "fix right": WINDOW_TYPES.FIX_RIGHT,
        "fix partision door": WINDOW_TYPES.FIX_PARTITION_DOOR,
        "fix sliding": WINDOW_TYPES.FIX_SLIDING,
        "4 track sliding": WINDOW_TYPES.FOUR_TRACK_SLIDING,
    };
    return typeMap[type] || WINDOW_TYPES.NORMAL;
};

// ✅ NEW: Precise Dimension Component (CAD Style)
const DimensionLine = ({ start, end, text, isVertical = false }) => {
    const color = "#000000";
    const offset = 0.05; // Gap between measurement line and object

    // Calculate mid-point for text
    const midX = (start[0] + end[0]) / 2;
    const midY = (start[1] + end[1]) / 2;

    return (
        <group>
            {/* 1. The Measurement Line */}
            <Line
                points={[start, end]}
                color={color}
                lineWidth={1}
                dashed={true}
                dashScale={20}
                dashSize={0.05}
                gapSize={0.05}
            />

            {/* 2. Extension Lines (Little legs connecting to object) */}
            {/* We draw these slightly perpendicular to show where the measure starts/ends */}
            <Line
                points={[
                    isVertical
                        ? [start[0] - 0.1, start[1], 0]
                        : [start[0], start[1] - 0.1, 0], // Inner point
                    start, // Outer point
                ]}
                color={color}
                lineWidth={0.5}
                transparent
                opacity={0.5}
            />
            <Line
                points={[
                    isVertical
                        ? [end[0] - 0.1, end[1], 0]
                        : [end[0], end[1] - 0.1, 0], // Inner point
                    end, // Outer point
                ]}
                color={color}
                lineWidth={0.5}
                transparent
                opacity={0.5}
            />

            {/* 3. End Ticks (Architectural Slashes) */}
            <Line
                points={[
                    [start[0] - 0.03, start[1] - 0.03, 0],
                    [start[0] + 0.03, start[1] + 0.03, 0],
                ]}
                color={color}
                lineWidth={2}
            />
            <Line
                points={[
                    [end[0] - 0.03, end[1] - 0.03, 0],
                    [end[0] + 0.03, end[1] + 0.03, 0],
                ]}
                color={color}
                lineWidth={2}
            />

            {/* 4. The Text Label */}
            <Text
                position={[midX, midY, 0]}
                fontSize={0.12}
                color="black"
                anchorX="center"
                anchorY="middle"
                // ✅ FIXED: Locking rotation so it doesn't spin with camera
                rotation={[0, 0, isVertical ? -Math.PI / 2 : 0]}
                backgroundColor="white"
                padding={0.02} // Creates a box around text so line doesn't cut through
            >
                {text}
            </Text>
        </group>
    );
};

const Window3D = ({ width, height, windowType = "normal" }) => {
    // Normalize window type from dropdown values
    const normalizedType = normalizeWindowType(windowType);

    // Scaling factors
    const scale = 0.025;
    const W = width * scale;
    const H = height * scale;

    // Half-sizes for perfect centering calculations
    const halfW = W / 2;
    const halfH = H / 2;

    const frameThickness = 0.07;
    const frameDepth = 0.1;
    const sashThickness = 0.05;

    const materials = useMemo(() => {
        return {
            frame: new THREE.MeshStandardMaterial({
                color: "#2E3A43",
                roughness: 0.2,
                metalness: 0.8,
            }),
            glass: new THREE.MeshPhysicalMaterial({
                color: "#A5D6E7",
                metalness: 0,
                roughness: 0.05,
                transmission: 1,
                thickness: 0.1,
                ior: 1.5,
                transparent: true,
                opacity: 1,
            }),
        };
    }, []);

    const renderFrameParts = (w, h, depth, thickness) => (
        <group>
            {/* Top Frame */}
            <mesh
                position={[0, h / 2 - thickness / 2, 0]}
                material={materials.frame}
            >
                <boxGeometry args={[w, thickness, depth]} />
            </mesh>
            {/* Bottom Frame */}
            <mesh
                position={[0, -h / 2 + thickness / 2, 0]}
                material={materials.frame}
            >
                <boxGeometry args={[w, thickness, depth]} />
            </mesh>
            {/* Left Frame */}
            <mesh
                position={[-w / 2 + thickness / 2, 0, 0]}
                material={materials.frame}
            >
                <boxGeometry args={[thickness, h - thickness * 2, depth]} />
            </mesh>
            {/* Right Frame */}
            <mesh
                position={[w / 2 - thickness / 2, 0, 0]}
                material={materials.frame}
            >
                <boxGeometry args={[thickness, h - thickness * 2, depth]} />
            </mesh>
        </group>
    );

    // ✅ RENDER FUNCTIONS FOR EACH WINDOW TYPE

    const renderNormal = () => (
        <mesh position={[0, 0, 0]} material={materials.glass}>
            <boxGeometry
                args={[
                    W - frameThickness * 2,
                    H - frameThickness * 2,
                    0.02,
                ]}
            />
        </mesh>
    );

    const renderSlider = () => (
        <group>
            {/* Center Sash */}
            <mesh position={[0, 0, 0]} material={materials.frame}>
                <boxGeometry
                    args={[
                        sashThickness,
                        H - frameThickness * 2,
                        frameDepth / 2,
                    ]}
                />
            </mesh>
            {/* Left Glass Panel */}
            <mesh
                position={[-W / 4, 0, -0.01]}
                material={materials.glass}
            >
                <boxGeometry
                    args={[
                        W / 2 - frameThickness,
                        H - frameThickness * 2,
                        0.02,
                    ]}
                />
            </mesh>
            {/* Right Glass Panel */}
            <mesh
                position={[W / 4, 0, 0.01]}
                material={materials.glass}
            >
                <boxGeometry
                    args={[
                        W / 2 - frameThickness,
                        H - frameThickness * 2,
                        0.02,
                    ]}
                />
            </mesh>
        </group>
    );

    const renderFixLeft = () => {
        // 3-Panel window: Left (openable) | Center (fixed) | Right (openable)
        const panelWidth = (W - frameThickness * 1) / 2;
        const mullionThickness = sashThickness * 0.6;

        return (
            <group>
                {/* Right Openable Panel */}
                <mesh position={[-W / 2 + frameThickness + panelWidth / 2, 0, 0]} material={materials.glass}>
                    <boxGeometry
                        args={[panelWidth - mullionThickness, H - frameThickness * 2, 0.02]}
                    />
                </mesh>
                {/* Diagonal cross on left panel (shows openable) */}
                <Line
                    points={[[-W / 2 + frameThickness, H / 2 - frameThickness, 0.015], [-W / 2 + frameThickness + panelWidth, -(H / 2 - frameThickness), 0.015]]}
                    color="#666666"
                    lineWidth={0.5}
                />
                <Line
                    points={[[-W / 2 + frameThickness + panelWidth, H / 2 - frameThickness, 0.015], [-W / 2 + frameThickness, -(H / 2 - frameThickness), 0.015]]}
                    color="#666666"
                    lineWidth={0.5}
                />

                {/* Center Mullion (Vertical Divider) */}
                <mesh position={[-W / 2 + frameThickness + panelWidth, 0, 0]} material={materials.frame}>
                    <boxGeometry
                        args={[mullionThickness, H - frameThickness * 2, frameDepth / 2]}
                    />
                </mesh>

                {/* Center Fixed Panel */}
                <mesh position={[-W / 2 + frameThickness + 1.5 * panelWidth, 0, 0]} material={materials.glass}>
                    <boxGeometry
                        args={[panelWidth - mullionThickness, H - frameThickness * 2, 0.02]}
                    />
                </mesh>


            </group>
        );
    };

    const renderFixRight = () => {
    // 2-Panel window: Left Fixed | Right Openable
    const panelWidth = (W - frameThickness * 2) / 2;
    const mullionThickness = sashThickness * 0.6;

    const leftX =
        -W / 2 + frameThickness + panelWidth / 2;
    const rightX =
        -W / 2 + frameThickness + 1.5 * panelWidth;

    return (
        <group>
            {/* LEFT FIXED PANEL */}
            <mesh position={[leftX, 0, 0]} material={materials.glass}>
                <boxGeometry
                    args={[
                        panelWidth - mullionThickness,
                        H - frameThickness * 2,
                        0.02,
                    ]}
                />
            </mesh>

            {/* CENTER MULLION */}
            <mesh
                position={[
                    -W / 2 + frameThickness + panelWidth,
                    0,
                    0,
                ]}
                material={materials.frame}
            >
                <boxGeometry
                    args={[
                        mullionThickness,
                        H - frameThickness * 2,
                        frameDepth / 2,
                    ]}
                />
            </mesh>

            {/* RIGHT OPENABLE PANEL */}
            <mesh position={[rightX, 0, 0]} material={materials.glass}>
                <boxGeometry
                    args={[
                        panelWidth - mullionThickness,
                        H - frameThickness * 2,
                        0.02,
                    ]}
                />
            </mesh>

            {/* OPENABLE DIAGONAL CROSS (RIGHT SIDE) */}
            <Line
                points={[
                    [
                        rightX - panelWidth / 2,
                        H / 2 - frameThickness,
                        0.015,
                    ],
                    [
                        rightX + panelWidth / 2,
                        -(H / 2 - frameThickness),
                        0.015,
                    ],
                ]}
                color="#666"
                lineWidth={0.5}
            />
            <Line
                points={[
                    [
                        rightX + panelWidth / 2,
                        H / 2 - frameThickness,
                        0.015,
                    ],
                    [
                        rightX - panelWidth / 2,
                        -(H / 2 - frameThickness),
                        0.015,
                    ],
                ]}
                color="#666"
                lineWidth={0.5}
            />
        </group>
    );
};


    const renderFixPartitionDoor = () => {
        // Dimensions
        const colCount = 3;
        const rowCount = 3;
        const colWidth = (W - frameThickness * 2) / colCount;
        const rowHeight = (H - frameThickness * 2) / rowCount;

        // Thickness vars
        const mullionThickness = sashThickness * 0.8;
        const doorFrameThickness = sashThickness; // The frame of the door itself
        const doorZOffset = 0.02; // Pop the door out slightly

        // --- 1. FIXED GLASS PANES (Left & Center Columns) ---
        const fixedGlass = [];
        const fixedHorizMullions = [];

        // Loop through first 2 columns (Left and Middle)
        for (let col = 0; col < 2; col++) {
            const xPos = -W / 2 + frameThickness + (col + 0.5) * colWidth;

            // Create 3 stacked panes per column
            for (let row = 0; row < 3; row++) {
                const yPos = H / 2 - frameThickness - (row + 0.5) * rowHeight;

                fixedGlass.push(
                    <mesh key={`glass-col-${col}-row-${row}`} position={[xPos, yPos, 0]} material={materials.glass}>
                        <boxGeometry args={[colWidth - mullionThickness, rowHeight - mullionThickness, 0.02]} />
                    </mesh>
                );
            }

            // Add Horizontal Mullions (Separators between rows 0-1 and 1-2)
            for (let i = 1; i < 3; i++) {
                const yDivPos = H / 2 - frameThickness - i * rowHeight;
                fixedHorizMullions.push(
                    <mesh key={`h-mull-col-${col}-${i}`} position={[xPos, yDivPos, 0]} material={materials.frame}>
                        <boxGeometry args={[colWidth, mullionThickness, frameDepth / 2]} />
                    </mesh>
                );
            }
        }

        // --- 2. TRANSOM (Top Right Pane) ---
        // The small fixed window above the door
        const transomX = -W / 2 + frameThickness + (2.5) * colWidth;
        const transomY = H / 2 - frameThickness - (0.5) * rowHeight;

        const transomGlass = (
            <mesh key="transom-glass" position={[transomX, transomY, 0]} material={materials.glass}>
                <boxGeometry args={[colWidth - mullionThickness, rowHeight - mullionThickness, 0.02]} />
            </mesh>
        );

        // --- 3. THE DOOR (Bottom Right, spanning 2 rows) ---
        const doorHeight = (rowHeight * 2);
        const doorWidth = colWidth;
        // Center of the bottom 2/3rds of the right column
        const doorX = -W / 2 + frameThickness + (2.5) * colWidth;
        const doorY = H / 2 - frameThickness - rowHeight - (doorHeight / 2);

        // A. Door Glass
        const doorGlass = (
            <mesh key="door-glass" position={[doorX, doorY, doorZOffset]} material={materials.glass}>
                <boxGeometry args={[doorWidth - doorFrameThickness * 2, doorHeight - doorFrameThickness * 2, 0.02]} />
            </mesh>
        );

        // B. Door Sash (The frame moving with the door)
        const doorSash = (
            <group position={[doorX, doorY, doorZOffset]}>
                {/* Left Sash */}
                <mesh position={[-doorWidth / 2 + doorFrameThickness / 2, 0, 0]} material={materials.frame}>
                    <boxGeometry args={[doorFrameThickness, doorHeight, frameDepth / 2]} />
                </mesh>
                {/* Right Sash */}
                <mesh position={[doorWidth / 2 - doorFrameThickness / 2, 0, 0]} material={materials.frame}>
                    <boxGeometry args={[doorFrameThickness, doorHeight, frameDepth / 2]} />
                </mesh>
                {/* Top Sash */}
                <mesh position={[0, doorHeight / 2 - doorFrameThickness / 2, 0]} material={materials.frame}>
                    <boxGeometry args={[doorWidth, doorFrameThickness, frameDepth / 2]} />
                </mesh>
                {/* Bottom Sash */}
                <mesh position={[0, -doorHeight / 2 + doorFrameThickness / 2, 0]} material={materials.frame}>
                    <boxGeometry args={[doorWidth, doorFrameThickness, frameDepth / 2]} />
                </mesh>
            </group>
        );

        // C. Door Handle (Lever Style)
        // Handle position: Left side of the door, vertically centered on the door sash
        const handleY = 0.1; // Slightly above center of door
        const handleXOffset = -doorWidth / 2 + doorFrameThickness + 0.05;

        const doorHandle = (
            <group position={[doorX + handleXOffset, doorY + handleY, doorZOffset + 0.04]}>
                {/* Base plate */}
                <mesh material={materials.frame}>
                    <boxGeometry args={[0.04, 0.12, 0.01]} />
                </mesh>
                {/* The Lever */}
                <mesh position={[0.06, 0, 0.04]} rotation={[0, 0, 0]} material={materials.frame}>
                    <boxGeometry args={[0.14, 0.025, 0.015]} />
                </mesh>
                {/* Connector */}
                <mesh position={[0, 0, 0.02]} rotation={[0, 1.57, 0]} material={materials.frame}>
                    <cylinderGeometry args={[0.01, 0.01, 0.05, 8]} />
                </mesh>
            </group>
        );

        // --- 4. MAIN VERTICAL STRUCTURE ---
        // Two long vertical mullions separating the 3 columns
        const vertMullions = [];
        for (let i = 1; i < 3; i++) {
            const vxPos = -W / 2 + frameThickness + i * colWidth;
            vertMullions.push(
                <mesh key={`vert-mull-${i}`} position={[vxPos, 0, 0]} material={materials.frame}>
                    <boxGeometry args={[mullionThickness, H - frameThickness * 2, frameDepth]} />
                </mesh>
            );
        }

        // Horizontal divider above the door (Between Transom and Door)
        const doorHeaderMullion = (
            <mesh
                key="door-header-mullion"
                position={[transomX, H / 2 - frameThickness - rowHeight, 0]}
                material={materials.frame}
            >
                <boxGeometry args={[colWidth, mullionThickness, frameDepth]} />
            </mesh>
        );

        return (
            <group>
                {/* Left/Middle Fixed Section */}
                {fixedGlass}
                {fixedHorizMullions}

                {/* Main Structure */}
                {vertMullions}

                {/* Right Column Components */}
                {transomGlass}
                {doorHeaderMullion}
                {doorGlass}
                {doorSash}
                {doorHandle}
            </group>
        );
    };

    const renderFixSliding = () => {
        // 3-Track Sliding Window
        const panelWidth = (W - frameThickness * 2) / 3;

        return (
            <group>
                {/* Track indicators (horizontal guide lines) */}
                <Line
                    points={[[-W / 2 + frameThickness, H / 2 - frameThickness * 0.8, 0], [W / 2 - frameThickness, H / 2 - frameThickness * 0.8, 0]]}
                    color="#333333"
                    lineWidth={0.5}
                />
                <Line
                    points={[[-W / 2 + frameThickness, -(H / 2 - frameThickness * 0.8), 0], [W / 2 - frameThickness, -(H / 2 - frameThickness * 0.8), 0]]}
                    color="#333333"
                    lineWidth={0.5}
                />

                {/* Vertical Track 1 (Left) */}
                <mesh position={[-W / 2 + frameThickness + panelWidth, 0, 0]} material={materials.frame}>
                    <boxGeometry
                        args={[sashThickness, H - frameThickness * 2, frameDepth / 2]}
                    />
                </mesh>

                {/* Vertical Track 2 (Center) */}
                <mesh position={[-W / 2 + frameThickness + 2 * panelWidth, 0, 0]} material={materials.frame}>
                    <boxGeometry
                        args={[sashThickness, H - frameThickness * 2, frameDepth / 2]}
                    />
                </mesh>

                {/* Glass Panel 1 (Far Left - Fixed) */}
                <mesh position={[-W / 2 + frameThickness + panelWidth / 2, 0, 0]} material={materials.glass}>
                    <boxGeometry
                        args={[panelWidth - sashThickness, H - frameThickness * 2, 0.02]}
                    />
                </mesh>

                {/* Glass Panel 2 (Center - Sliding) */}
                <mesh position={[-W / 2 + frameThickness + 1.5 * panelWidth, 0, 0.01]} material={materials.glass}>
                    <boxGeometry
                        args={[panelWidth - sashThickness, H - frameThickness * 2, 0.02]}
                    />
                </mesh>

                {/* Glass Panel 3 (Right - Sliding) */}
                <mesh position={[-W / 2 + frameThickness + 2.5 * panelWidth, 0, 0.02]} material={materials.glass}>
                    <boxGeometry
                        args={[panelWidth - sashThickness, H - frameThickness * 2, 0.02]}
                    />
                </mesh>
            </group>
        );
    };

    const renderFourTrackSliding = () => {
        // 4-Track Sliding Window
        const panelWidth = (W - frameThickness * 2) / 4;

        const tracks = [];
        const panels = [];

        // Create 3 vertical tracks
        for (let i = 1; i < 4; i++) {
            const trackXPos = -W / 2 + frameThickness + i * panelWidth;
            tracks.push(
                <mesh key={`track-${i}`} position={[trackXPos, 0, 0]} material={materials.frame}>
                    <boxGeometry
                        args={[sashThickness, H - frameThickness * 2, frameDepth / 2]}
                    />
                </mesh>
            );
        }

        // Create 4 glass panels with Z-offsets
        for (let i = 0; i < 4; i++) {
            const panelXPos = -W / 2 + frameThickness + (i + 0.5) * panelWidth;
            const panelZPos = i * 0.01; // Progressive Z-offset for layering effect

            panels.push(
                <mesh key={`panel-${i}`} position={[panelXPos, 0, panelZPos]} material={materials.glass}>
                    <boxGeometry
                        args={[panelWidth - sashThickness, H - frameThickness * 2, 0.02]}
                    />
                </mesh>
            );
        }

        // Track guide lines (top and bottom)
        const trackLines = [
            <Line
                key="track-top"
                points={[[-W / 2 + frameThickness, H / 2 - frameThickness * 0.8, 0], [W / 2 - frameThickness, H / 2 - frameThickness * 0.8, 0]]}
                color="#333333"
                lineWidth={0.5}
            />,
            <Line
                key="track-bottom"
                points={[[-W / 2 + frameThickness, -(H / 2 - frameThickness * 0.8), 0], [W / 2 - frameThickness, -(H / 2 - frameThickness * 0.8), 0]]}
                color="#333333"
                lineWidth={0.5}
            />,
        ];

        return (
            <group>
                {tracks}
                {panels}
                {trackLines}
            </group>
        );
    };

const renderBathroomWindowWithTopVent = () => {
    // --- Configuration ---
    const topSectionRatio = 0.35; // Top section takes up 35% of the height
    const holeRadius = 0.20;      // Radius of the circular cutout (approx 20cm)
    const glassThickness = 0.02;  
    
    // Derived Dimensions
    const innerH = H - frameThickness * 2;
    const innerW = W - frameThickness * 2;
    const topPaneH = innerH * topSectionRatio;
    const bottomPaneH = innerH * (1 - topSectionRatio) - sashThickness; 
    const mullionY = H / 2 - frameThickness - topPaneH - (sashThickness / 2);
    
    // The center position for the Top Pane (Glass + Fan)
    const topPaneCenterY = H / 2 - frameThickness - topPaneH / 2;

    // --- NEW: Fan Component ---
    const RenderFan = () => {
        // Material for the fan (White Plastic)
        const fanMaterial = new THREE.MeshStandardMaterial({ 
            color: "#EEEEEE", 
            roughness: 0.4,
            metalness: 0.1
        });

        // return (
        //     <group position={[0, topPaneCenterY, 0]}>
        //         {/* 1. Outer Ring (Frame inside the hole) */}
        //         <mesh rotation={[Math.PI / 2, 0, 0]} material={fanMaterial}>
        //             <torusGeometry args={[holeRadius - 0.01, 0.015, 12, 64]} />
        //         </mesh>

        //         {/* 2. Center Hub (Motor) */}
        //         <mesh rotation={[Math.PI / 2, 0, 0]} material={fanMaterial}>
        //             <cylinderGeometry args={[0.05, 0.05, 0.06, 32]} />
        //         </mesh>
        //         {/* Small cap on motor */}
        //         <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]} material={new THREE.MeshStandardMaterial({ color: "#999999" })}>
        //             <cylinderGeometry args={[0.02, 0.02, 0.01, 16]} />
        //         </mesh>

        //         {/* 3. Fan Blades (5 Blades) */}
        //         <group position={[0, 0, -0.01]}>
        //             {[0, 1, 2, 3, 4].map((i) => (
        //                 <mesh 
        //                     key={i} 
        //                     rotation={[0, 0, (Math.PI * 2 / 5) * i]} 
        //                     material={fanMaterial}
        //                 >
        //                     {/* Blade Geometry: Shifted out from center and angled */}
        //                     <group position={[holeRadius * 0.4, 0, 0]} rotation={[0.4, 0, 0]}>
        //                         <boxGeometry args={[holeRadius * 0.7, 0.05, 0.005]} />
        //                     </group>
        //                 </mesh>
        //             ))}
        //         </group>

        //         {/* 4. Support Spokes (The 'X' or '+' shape holding the motor) */}
        //         <mesh position={[0, 0, 0.015]} material={fanMaterial}>
        //             <boxGeometry args={[holeRadius * 2, 0.012, 0.005]} />
        //         </mesh>
        //         <mesh position={[0, 0, 0.015]} material={fanMaterial}>
        //             <boxGeometry args={[0.012, holeRadius * 2, 0.005]} />
        //         </mesh>
        //     </group>
        // );
    };

    return (
        <group>
            {/* Top Pane with Glass and Fan */}
            <mesh position={[0, topPaneCenterY, 0]} material={materials.glass}>
                <primitive object={glassWithHoleGeometry} />
            </mesh>
            <RenderFan />

            {/* Horizontal Mullion (Divider between top and bottom) */}
            <mesh position={[0, mullionY, 0]} material={materials.frame}>
                <boxGeometry args={[innerW, sashThickness, frameDepth / 2]} />
            </mesh>

            {/* Bottom Pane (Regular glass) */}
            <mesh position={[0, H / 2 - frameThickness - topPaneH - sashThickness - bottomPaneH / 2, 0]} material={materials.glass}>
                <boxGeometry args={[innerW, bottomPaneH, 0.02]} />
            </mesh>
        </group>
    );
};

    


    // ✅ Select appropriate render function based on type
    const renderWindowContent = () => {
        switch (normalizedType) {
            case WINDOW_TYPES.SLIDER:
                return renderSlider();
            case WINDOW_TYPES.FIX_LEFT:
                return renderFixLeft();
            case WINDOW_TYPES.BATHROOM_WINDOW_WITH_TOP_VENT:
                return renderBathroomWindowWithTopVent();
            case WINDOW_TYPES.FIX_RIGHT:
                return renderFixRight();
            case WINDOW_TYPES.FIX_PARTITION_DOOR:
                return renderFixPartitionDoor();
            case WINDOW_TYPES.FIX_SLIDING:
                return renderFixSliding();
            case WINDOW_TYPES.FOUR_TRACK_SLIDING:
                return renderFourTrackSliding();
            case WINDOW_TYPES.NORMAL:
            default:
                return renderNormal();
        }
    };

    // Gap between object and dimension line
    const dimGap = 0.3;

    return (
        <div className="w-full h-full min-h-[500px]">
            {/* Camera positioned straight on for "Blueprint" feel initially */}
            <Canvas 
                camera={{ position: [0, 0, 5], fov: 50 }} 
                dpr={[1, 2]}
                onContextLost={(e) => e.preventDefault()}
            >
                <Environment files="/hdr/potsdamer_platz_1k.hdr" />

                {/* ✅ ALIGNMENT FIX: 
           We are NOT using <Center>. 
           We are drawing centered at (0,0,0) manually.
        */}
                <group>
                    {/* 1. Draw The Window Frame */}
                    {renderFrameParts(W, H, frameDepth, frameThickness)}

                    {/* 2. Draw Window Interiors - Render based on type */}
                    {renderWindowContent()}
                </group>

                {/* ✅ DIMENSIONS - Drawn relative to absolute center (0,0,0) */}

                {/* WIDTH LINE (Top) */}
                <DimensionLine
                    start={[-halfW, halfH + dimGap, 0]}
                    end={[halfW, halfH + dimGap, 0]}
                    text={`${width} IN`}
                    isVertical={false}
                />

                {/* HEIGHT LINE (Right Side) */}
                <DimensionLine
                    start={[halfW + dimGap, halfH, 0]}
                    end={[halfW + dimGap, -halfH, 0]}
                    text={`${height} IN`}
                    isVertical={true}
                />

                <OrbitControls
                    makeDefault
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI}
                />
            </Canvas>
        </div>
    );
};

export default Window3D;
