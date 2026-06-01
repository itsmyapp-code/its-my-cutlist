'use client';

// ─────────────────────────────────────────────────────────────
// FURNITURE CANVAS — Interactive 3D viewer
// Uses @react-three/fiber + @react-three/drei to render
// parametric furniture models with exploded view and wireframe.
// ─────────────────────────────────────────────────────────────

import { useMemo, useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';
import { Vector3 } from 'three';

import type { ComponentPiece, ViewSettings } from '@/types/furniture';
import { getExplodedOffset } from '@/utils/furnitureMath';

// ── Props ──────────────────────────────────────────────────────

interface FurnitureCanvasProps {
  pieces: ComponentPiece[];
  viewSettings: ViewSettings;
  type: string;
}

interface SceneProps {
  pieces: ComponentPiece[];
  viewSettings: ViewSettings;
  center: [number, number, number];
  size: [number, number, number];
  type: string;
  isPrinting: boolean;
}

// ── Color palette by component group ───────────────────────────

const GROUP_MATERIALS: Record<
  ComponentPiece['group'],
  { color: string; roughness: number }
> = {
  side:           { color: '#c4956a', roughness: 0.7 },
  top_bottom:     { color: '#c4956a', roughness: 0.7 },
  shelf:          { color: '#c4956a', roughness: 0.7 },
  back:           { color: '#d4b896', roughness: 0.8 },
  drawer_front:   { color: '#8B6914', roughness: 0.5 },
  drawer_box:     { color: '#e8d5b7', roughness: 0.7 },
  drawer_bottom:  { color: '#f0e6d3', roughness: 0.8 },
  door:           { color: '#8B5A2B', roughness: 0.6 },
  bore_marker:    { color: '#60a5fa', roughness: 0.4 },
};

// ── Individual piece mesh ──────────────────────────────────────

interface FurniturePieceProps {
  piece: ComponentPiece;
  wireframe: boolean;
  explodedFactor: number;
}

function FurniturePiece({ piece, wireframe, explodedFactor }: FurniturePieceProps) {
  // Compute final position: base position + exploded offset
  const position = useMemo<[number, number, number]>(() => {
    const offset = getExplodedOffset(piece, explodedFactor);
    return [
      piece.position[0] + offset[0],
      piece.position[1] + offset[1],
      piece.position[2] + offset[2],
    ];
  }, [piece, explodedFactor]);

  const { color, roughness } = GROUP_MATERIALS[piece.group];

  return (
    <mesh position={position} rotation={piece.rotation}>
      <boxGeometry args={[piece.width, piece.height, piece.thickness]} />
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={0.1}
      />
      {wireframe && (
        <Edges color="#22d3ee" threshold={15} />
      )}
    </mesh>
  );
}

// ── Scene contents (rendered inside Canvas) ────────────────────

interface CameraControllerProps {
  center: [number, number, number];
  size: [number, number, number];
  type: string;
  controls: any;
  isPrinting: boolean;
}

function CameraController({ center, size, type, controls, isPrinting }: CameraControllerProps) {
  const { camera, size: domSize } = useThree();
  const lastType = useRef<string | null>(null);
  const isInitialized = useRef(false);
  const savedState = useRef<{ position: Vector3; target: Vector3 } | null>(null);

  useEffect(() => {
    const maxDim = Math.max(size[0], size[1], size[2]);
    if (maxDim <= 0) return; // Wait until pieces are loaded and bounds are valid

    const typeChanged = lastType.current !== type;

    if (isPrinting) {
      // Save current screen view before print resize
      if (controls && !savedState.current) {
        savedState.current = {
          position: camera.position.clone(),
          target: controls.target.clone(),
        };
      }

      // Compute optimal distance to fit the model bounds in the current viewport aspect ratio
      const aspect = domSize.width / domSize.height;
      let factor = 2.2;
      if (aspect < 1) {
        // Portrait / narrow screen adjustment to prevent horizontal clipping
        factor = 2.2 / aspect;
      }
      const distance = Math.max(maxDim * factor, 900);

      const targetX = center[0];
      const targetY = center[1];
      const targetZ = center[2];

      const posX = targetX + distance;
      const posY = targetY + distance * 0.75;
      const posZ = targetZ + distance;

      camera.position.set(posX, posY, posZ);
      
      if (controls) {
        controls.target.set(targetX, targetY, targetZ);
        controls.update();
      } else {
        camera.lookAt(targetX, targetY, targetZ);
      }
    } else if (savedState.current) {
      // Restore user's saved interactive screen camera state
      camera.position.copy(savedState.current.position);
      if (controls) {
        controls.target.copy(savedState.current.target);
        controls.update();
      }
      savedState.current = null;
    } else if (!isInitialized.current || typeChanged) {
      isInitialized.current = true;
      lastType.current = type;

      // Compute optimal distance to fit the model bounds in the current viewport aspect ratio
      const aspect = domSize.width / domSize.height;
      let factor = 2.2;
      if (aspect < 1) {
        // Portrait / narrow screen adjustment to prevent horizontal clipping
        factor = 2.2 / aspect;
      }
      const distance = Math.max(maxDim * factor, 900);

      const targetX = center[0];
      const targetY = center[1];
      const targetZ = center[2];

      const posX = targetX + distance;
      const posY = targetY + distance * 0.75;
      const posZ = targetZ + distance;

      camera.position.set(posX, posY, posZ);
      
      if (controls) {
        controls.target.set(targetX, targetY, targetZ);
        controls.update();
      } else {
        camera.lookAt(targetX, targetY, targetZ);
      }
    } else {
      // Sliders adjusted - shift target and camera together to keep centering
      if (controls) {
        const oldTarget = controls.target.clone();
        const newTarget = new Vector3(center[0], center[1], center[2]);
        const shift = newTarget.clone().sub(oldTarget);

        camera.position.add(shift);
        controls.target.copy(newTarget);
        controls.update();
      }
    }
  }, [type, center, size, camera, controls, isPrinting, domSize.width, domSize.height]);

  return null;
}

function Scene({ pieces, viewSettings, center, size, type, isPrinting }: SceneProps) {
  const controlsTarget = useMemo(() => new Vector3(center[0], center[1], center[2]), [center]);
  const [controls, setControls] = useState<any>(null);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[500, 800, 400]} intensity={0.8} />

      {/* Floor grid dynamically positioned exactly under the bottom of the cabinet */}
      <gridHelper
        args={[2000, 20, '#334155', '#1e293b']}
        position={[center[0], center[1] - size[1] / 2, center[2]]}
        rotation={[0, 0, 0]}
      />

      {/* Camera controls */}
      <OrbitControls
        ref={setControls}
        makeDefault
        target={controlsTarget}
        enableDamping
        dampingFactor={0.08}
        minDistance={200}
        maxDistance={10000}
      />

      {/* Camera controller to fit model on screen and synchronize slider updates */}
      <CameraController
        center={center}
        size={size}
        type={type}
        controls={controls}
        isPrinting={isPrinting}
      />

      {/* Render all pieces */}
      {pieces.map((piece) => (
        <FurniturePiece
          key={piece.id}
          piece={piece}
          wireframe={viewSettings.wireframe}
          explodedFactor={viewSettings.explodedFactor}
        />
      ))}
    </>
  );
}

// ── Main canvas wrapper ────────────────────────────────────────

export default function FurnitureCanvas({ pieces, viewSettings, type }: FurnitureCanvasProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  // Monitor print events to toggle inline height style
  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);
    
    const handleCustomStart = () => setIsPrinting(true);
    const handleCustomEnd = () => setIsPrinting(false);

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    window.addEventListener('furniture-print-start', handleCustomStart);
    window.addEventListener('furniture-print-end', handleCustomEnd);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      window.removeEventListener('furniture-print-start', handleCustomStart);
      window.removeEventListener('furniture-print-end', handleCustomEnd);
    };
  }, []);

  // Compute model bounding box center and size reactively based on panels list
  const bounds = useMemo(() => {
    if (pieces.length === 0) {
      return {
        center: [0, 0, 0] as [number, number, number],
        size: [0, 0, 0] as [number, number, number]
      };
    }
    
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    pieces.forEach((p) => {
      const halfW = p.width / 2;
      const halfH = p.height / 2;
      const halfD = p.thickness / 2; // depth is mapped to piece.thickness

      minX = Math.min(minX, p.position[0] - halfW);
      maxX = Math.max(maxX, p.position[0] + halfW);
      minY = Math.min(minY, p.position[1] - halfH);
      maxY = Math.max(maxY, p.position[1] + halfH);
      minZ = Math.min(minZ, p.position[2] - halfD);
      maxZ = Math.max(maxZ, p.position[2] + halfD);
    });

    const calculated = {
      center: [
        (minX + maxX) / 2,
        (minY + maxY) / 2,
        (minZ + maxZ) / 2
      ] as [number, number, number],
      size: [
        maxX - minX,
        maxY - minY,
        maxZ - minZ
      ] as [number, number, number]
    };
    
    return calculated;
  }, [pieces]);

  return (
    <div className="h-full w-full print:h-[400px] print:block">
      <Canvas
        camera={{ fov: 50, far: 10000 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        style={{ height: isPrinting ? '400px' : '100%', width: '100%' }}
        className="bg-[#0f172a] print:!bg-white print:!h-[400px] print:!w-full"
      >
        <Scene
          pieces={pieces}
          viewSettings={viewSettings}
          center={bounds.center}
          size={bounds.size}
          type={type}
          isPrinting={isPrinting}
        />
      </Canvas>
    </div>
  );
}
