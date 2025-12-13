import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Text, Line } from "@react-three/drei";
import * as THREE from "three";

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

    // Gap between object and dimension line
    const dimGap = 0.3;

    return (
        <div className="w-full h-full min-h-[500px]">
            {/* Camera positioned straight on for "Blueprint" feel initially */}
            <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 2]}>
                <Environment files="/hdr/potsdamer_platz_1k.hdr"  />

                {/* ✅ ALIGNMENT FIX: 
           We are NOT using <Center>. 
           We are drawing centered at (0,0,0) manually.
        */}
                <group>
                    {/* 1. Draw The Window Frame */}
                    {renderFrameParts(W, H, frameDepth, frameThickness)}

                    {/* 2. Draw Window Interiors */}
                    {windowType === "slider" && (
                        <group>
                            <mesh
                                position={[0, 0, 0]}
                                material={materials.frame}
                            >
                                <boxGeometry
                                    args={[
                                        sashThickness,
                                        H - frameThickness * 2,
                                        frameDepth / 2,
                                    ]}
                                />
                            </mesh>
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
                    )}

                    {windowType !== "slider" && (
                        <mesh position={[0, 0, 0]} material={materials.glass}>
                            <boxGeometry
                                args={[
                                    W - frameThickness * 2,
                                    H - frameThickness * 2,
                                    0.02,
                                ]}
                            />
                        </mesh>
                    )}
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
