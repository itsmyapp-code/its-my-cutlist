'use client';

// ─────────────────────────────────────────────────────────────
// FURNITURE CANVAS — Interactive 3D viewer
// Uses @react-three/fiber + @react-three/drei to render
// parametric furniture models with exploded view and wireframe.
// ─────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Edges } from '@react-three/drei';

import type { ComponentPiece, ViewSettings } from '@/types/furniture';
import { getExplodedOffset } from '@/utils/furnitureMath';

// ── Props ──────────────────────────────────────────────────────

interface FurnitureCanvasProps {
  pieces: ComponentPiece[];
  viewSettings: ViewSettings;
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

function Scene({ pieces, viewSettings }: FurnitureCanvasProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[500, 800, 400]} intensity={0.8} />

      {/* Studio environment for subtle reflections */}
      <Environment preset="studio" />

      {/* Floor grid for spatial reference */}
      <gridHelper
        args={[2000, 20, '#334155', '#1e293b']}
        rotation={[0, 0, 0]}
      />

      {/* Camera controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={200}
        maxDistance={3000}
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

export default function FurnitureCanvas({ pieces, viewSettings }: FurnitureCanvasProps) {
  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [800, 600, 800], fov: 50 }}
        gl={{ antialias: true }}
        style={{ background: '#0f172a' }}
      >
        <Scene pieces={pieces} viewSettings={viewSettings} />
      </Canvas>
    </div>
  );
}
