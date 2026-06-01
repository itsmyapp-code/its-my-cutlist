// ─────────────────────────────────────────────────────────────
// PARAMETRIC FURNITURE MATH ENGINE
// Pure utility — no React, no DOM, no side effects.
// All calculations in millimeters.
// ─────────────────────────────────────────────────────────────

import {
  FurnitureDimensions,
  GlobalTolerances,
  FurnitureType,
  FurnitureConfig,
  ComponentPiece,
} from '@/types/furniture';
import { getKitchenUnitSpec } from '@/utils/kitchenRegistry';

let idCounter = 0;
function nextId(prefix: string): string {
  return `${prefix}_${++idCounter}`;
}

/**
 * Master cutlist generator.
 * Takes dimensions, tolerances, furniture type, and configuration,
 * returns a fully-positioned array of ComponentPieces ready for
 * 3D rendering and BOM export.
 */
export function generateCutlist(config: FurnitureConfig): ComponentPiece[] {
  idCounter = 0;
  const pieces: ComponentPiece[] = [];
  const { dimensions, tolerances, type } = config;

  if (type === 'kitchen_unit') {
    pieces.push(...generateKitchenUnit(config));
  } else if (type === 'media_lowboard') {
    pieces.push(...generateMediaLowboard(config));
  } else if (type === 'storage_platform_bed') {
    pieces.push(...generateStoragePlatformBed(config));
  } else if (type === 'l_shaped_office_desk') {
    pieces.push(...generateLShapedOfficeDesk(config));
  } else if (type === 'alcove_unit') {
    pieces.push(...generateAlcoveUnit(config));
  } else if (type === 'wall_hung_vanity') {
    pieces.push(...generateWallHungVanity(config));
  } else if (type === 'slimline_storage_tower') {
    pieces.push(...generateSlimlineStorageTower(config));
  } else if (type === 'boot_bench') {
    pieces.push(...generateBootBench(config));
  } else if (type === 'broom_cupboard') {
    pieces.push(...generateBroomCupboard(config));
  } else if (type === 'scribe_filler_panel') {
    pieces.push(...generateScribeFillerPanel(config));
  } else if (type === 'corner_post') {
    pieces.push(...generateCornerPost(config));
  } else {
    // ── LAYER 2: CARCASS ────────────────────────────────────────
    pieces.push(...generateCarcass(dimensions, tolerances, config.backFit));

    // ── LAYER 3: DRAWERS / SHELVES ──────────────────────────────
    if (type === 'chest_of_drawers') {
      pieces.push(...generateDrawers(dimensions, tolerances, config.numberOfDrawers, config.drawerHeights));
    } else {
      // Wardrobe: internal shelves and optional doors
      pieces.push(...generateShelves(dimensions, tolerances, config.numberOfShelves, config.shelfPositions, config.shelfBase, config.backFit));
      if (config.showLineBoring && config.numberOfShelves > 0) {
        pieces.push(...generateLineBoringGrid(dimensions, tolerances, config.backFit));
      }
      pieces.push(...generateWardrobeDoors(dimensions, tolerances, config.hasDoors, config.doorStyle));
    }
  }

  return pieces;
}

function generateMediaLowboard(config: FurnitureConfig): ComponentPiece[] {
  const { dimensions: dim, tolerances: tol, backFit, numberOfShelves, shelfPositions, shelfBase, hasDoors, numberOfDrawers, drawerHeights, doorStyle, showLineBoring } = config;
  const pieces: ComponentPiece[] = [];

  pieces.push(...generateCarcass(dim, tol, backFit));

  const sideDepth = dim.depth - (backFit === 'nailed' ? tol.backPanelThickness : tol.backInset);
  const internalHeight = dim.height - 2 * tol.carcassThickness;
  const centerDividerHeight = Math.max(1, internalHeight);

  // Center divider improves stiffness on wider media units.
  pieces.push({
    id: nextId('ml-div'),
    name: 'Media Center Divider',
    width: tol.carcassThickness,
    height: centerDividerHeight,
    thickness: sideDepth,
    quantity: 1,
    material: '18mm MDF',
    position: [0, 0, -(sideDepth / 2)],
    rotation: [0, 0, 0],
    group: 'side',
  });

  pieces.push(...generateShelves(dim, tol, Math.max(0, numberOfShelves), shelfPositions, shelfBase, backFit));
  if (showLineBoring && numberOfShelves > 0) {
    pieces.push(...generateLineBoringGrid(dim, tol, backFit));
  }

  if (hasDoors) {
    pieces.push(...generateWardrobeDoors(dim, tol, true, doorStyle));
  }

  if (!hasDoors && numberOfDrawers > 0) {
    pieces.push(...generateDrawers(dim, tol, numberOfDrawers, drawerHeights));
  }

  return pieces;
}

function generateStoragePlatformBed(config: FurnitureConfig): ComponentPiece[] {
  const { dimensions: dim, tolerances: tol, numberOfShelves } = config;
  const pieces: ComponentPiece[] = [];

  const t = tol.carcassThickness;
  const halfWidth = dim.width / 2;
  const halfHeight = dim.height / 2;
  const halfDepth = dim.depth / 2;
  const internalWidth = Math.max(1, dim.width - 2 * t);
  const internalDepth = Math.max(1, dim.depth - 2 * t);
  const deckY = halfHeight - t / 2;

  // Side rails
  pieces.push({
    id: nextId('bed-side'),
    name: 'Bed Left Rail',
    width: t,
    height: dim.height,
    thickness: dim.depth,
    quantity: 1,
    material: '18mm MDF',
    position: [-(halfWidth - t / 2), 0, -halfDepth],
    rotation: [0, 0, 0],
    group: 'side',
  });

  pieces.push({
    id: nextId('bed-side'),
    name: 'Bed Right Rail',
    width: t,
    height: dim.height,
    thickness: dim.depth,
    quantity: 1,
    material: '18mm MDF',
    position: [halfWidth - t / 2, 0, -halfDepth],
    rotation: [0, 0, 0],
    group: 'side',
  });

  // Head and foot boards
  pieces.push({
    id: nextId('bed-end'),
    name: 'Bed Head Board',
    width: internalWidth,
    height: dim.height,
    thickness: t,
    quantity: 1,
    material: '18mm MDF',
    position: [0, 0, -(dim.depth - t / 2)],
    rotation: [0, 0, 0],
    group: 'top_bottom',
  });

  pieces.push({
    id: nextId('bed-end'),
    name: 'Bed Foot Board',
    width: internalWidth,
    height: dim.height,
    thickness: t,
    quantity: 1,
    material: '18mm MDF',
    position: [0, 0, -(t / 2)],
    rotation: [0, 0, 0],
    group: 'top_bottom',
  });

  // Two-piece intersecting deck for easier handling and assembly.
  const deckDepth = Math.max(1, internalDepth / 2 - t / 2);
  pieces.push({
    id: nextId('bed-deck'),
    name: 'Bed Platform Deck Front',
    width: internalWidth,
    height: t,
    thickness: deckDepth,
    quantity: 1,
    material: '18mm MDF',
    position: [0, deckY, -(t + deckDepth / 2)],
    rotation: [0, 0, 0],
    group: 'top_bottom',
  });

  pieces.push({
    id: nextId('bed-deck'),
    name: 'Bed Platform Deck Rear',
    width: internalWidth,
    height: t,
    thickness: deckDepth,
    quantity: 1,
    material: '18mm MDF',
    position: [0, deckY, -(dim.depth - t - deckDepth / 2)],
    rotation: [0, 0, 0],
    group: 'top_bottom',
  });

  // Center spine support.
  pieces.push({
    id: nextId('bed-spine'),
    name: 'Bed Center Spine',
    width: t,
    height: dim.height,
    thickness: internalDepth,
    quantity: 1,
    material: '18mm MDF',
    position: [0, 0, -halfDepth],
    rotation: [0, 0, 0],
    group: 'side',
  });

  const bayDividerCount = Math.max(0, Math.floor(numberOfShelves));
  for (let i = 1; i <= bayDividerCount; i++) {
    const x = -halfWidth + t + (internalWidth / (bayDividerCount + 1)) * i;
    pieces.push({
      id: nextId('bed-div'),
      name: `Bed Storage Divider ${i}`,
      width: t,
      height: dim.height,
      thickness: internalDepth,
      quantity: 1,
      material: '18mm MDF',
      position: [x, 0, -halfDepth],
      rotation: [0, 0, 0],
      group: 'side',
    });
  }

  return pieces;
}

function generateLShapedOfficeDesk(config: FurnitureConfig): ComponentPiece[] {
  const { dimensions: dim, tolerances: tol } = config;
  const pieces: ComponentPiece[] = [];

  const t = tol.carcassThickness;
  const halfHeight = dim.height / 2;
  const topY = halfHeight - t / 2;
  const legHeight = Math.max(1, dim.height - t);
  const mainTopDepth = Math.min(700, Math.max(500, dim.depth * 0.45));
  const returnTopWidth = Math.min(700, Math.max(500, dim.width * 0.4));
  const returnRunDepth = Math.max(900, dim.depth - mainTopDepth / 2);

  pieces.push({
    id: nextId('desk-top'),
    name: 'Desk Main Top',
    width: dim.width,
    height: t,
    thickness: mainTopDepth,
    quantity: 1,
    material: '18mm MDF',
    position: [0, topY, -(mainTopDepth / 2)],
    rotation: [0, 0, 0],
    group: 'top_bottom',
  });

  pieces.push({
    id: nextId('desk-top'),
    name: 'Desk Return Top',
    width: returnTopWidth,
    height: t,
    thickness: returnRunDepth,
    quantity: 1,
    material: '18mm MDF',
    position: [dim.width / 2 - returnTopWidth / 2, topY, -(returnRunDepth / 2)],
    rotation: [0, 0, 0],
    group: 'top_bottom',
  });

  const legDepth = t;
  const legWidth = t;
  const legY = -halfHeight + legHeight / 2;

  const legPositions: Array<[number, number, number]> = [
    [-(dim.width / 2 - legWidth / 2), legY, -(legDepth / 2)],
    [-(dim.width / 2 - legWidth / 2), legY, -(mainTopDepth - legDepth / 2)],
    [dim.width / 2 - returnTopWidth + legWidth / 2, legY, -(legDepth / 2)],
    [dim.width / 2 - legWidth / 2, legY, -(returnRunDepth - legDepth / 2)],
  ];

  legPositions.forEach((position, index) => {
    pieces.push({
      id: nextId('desk-leg'),
      name: `Desk Leg ${index + 1}`,
      width: legWidth,
      height: legHeight,
      thickness: legDepth,
      quantity: 1,
      material: '18mm MDF',
      position,
      rotation: [0, 0, 0],
      group: 'side',
    });
  });

  return pieces;
}

function offsetPieces(
  pieces: ComponentPiece[],
  offset: [number, number, number]
): ComponentPiece[] {
  return pieces.map((piece) => ({
    ...piece,
    position: [
      piece.position[0] + offset[0],
      piece.position[1] + offset[1],
      piece.position[2] + offset[2],
    ],
  }));
}

function addFaceFrame(
  dim: FurnitureDimensions,
  tol: GlobalTolerances,
  yOffset: number,
  label: string
): ComponentPiece[] {
  const frameWidth = 60;
  const frameThickness = tol.carcassThickness;
  const halfWidth = dim.width / 2;
  const halfHeight = dim.height / 2;
  const railWidth = Math.max(1, dim.width - 2 * frameWidth);

  return [
    {
      id: nextId('ff-stile'),
      name: `${label} Face Frame Left Stile`,
      width: frameWidth,
      height: dim.height,
      thickness: frameThickness,
      quantity: 1,
      material: '18mm MDF',
      position: [-(halfWidth - frameWidth / 2), yOffset, frameThickness / 2],
      rotation: [0, 0, 0],
      group: 'door',
    },
    {
      id: nextId('ff-stile'),
      name: `${label} Face Frame Right Stile`,
      width: frameWidth,
      height: dim.height,
      thickness: frameThickness,
      quantity: 1,
      material: '18mm MDF',
      position: [halfWidth - frameWidth / 2, yOffset, frameThickness / 2],
      rotation: [0, 0, 0],
      group: 'door',
    },
    {
      id: nextId('ff-rail'),
      name: `${label} Face Frame Top Rail`,
      width: railWidth,
      height: frameWidth,
      thickness: frameThickness,
      quantity: 1,
      material: '18mm MDF',
      position: [0, yOffset + halfHeight - frameWidth / 2, frameThickness / 2],
      rotation: [0, 0, 0],
      group: 'door',
    },
    {
      id: nextId('ff-rail'),
      name: `${label} Face Frame Bottom Rail`,
      width: railWidth,
      height: frameWidth,
      thickness: frameThickness,
      quantity: 1,
      material: '18mm MDF',
      position: [0, yOffset - halfHeight + frameWidth / 2, frameThickness / 2],
      rotation: [0, 0, 0],
      group: 'door',
    },
  ];
}

function generateAlcoveUnit(config: FurnitureConfig): ComponentPiece[] {
  const { dimensions: dim, tolerances: tol, backFit, numberOfShelves, hasDoors, doorStyle, useFaceFrame, showLineBoring } = config;
  const pieces: ComponentPiece[] = [];

  const lowerDepth = Math.min(600, Math.max(500, dim.depth));
  const upperDepth = Math.min(300, Math.max(250, dim.depth - 300));
  const lowerHeight = Math.min(900, Math.max(500, Math.round(dim.height * 0.36)));
  const upperHeight = Math.max(1, dim.height - lowerHeight - 40);
  const lowerYOffset = -dim.height / 2 + lowerHeight / 2;
  const upperBottomY = -dim.height / 2 + lowerHeight + 40;

  const lowerDim: FurnitureDimensions = {
    width: dim.width,
    height: lowerHeight,
    depth: lowerDepth,
  };

  pieces.push(...offsetPieces(generateCarcass(lowerDim, tol, backFit), [0, lowerYOffset, 0]));
  pieces.push(...offsetPieces(generateWardrobeDoors(lowerDim, tol, hasDoors, doorStyle), [0, lowerYOffset, 0]));

  if (useFaceFrame) {
    pieces.push(...addFaceFrame(lowerDim, tol, lowerYOffset, 'Lower Cabinet'));
  }

  const shelfCount = Math.max(1, numberOfShelves || 3);
  const shelfWidth = dim.width - 12;
  for (let i = 0; i < shelfCount; i++) {
    const y = upperBottomY + ((i + 1) / (shelfCount + 1)) * upperHeight;
    pieces.push({
      id: nextId('alcove-shelf'),
      name: `Floating Alcove Shelf ${i + 1}`,
      width: shelfWidth,
      height: tol.carcassThickness,
      thickness: upperDepth,
      quantity: 1,
      material: '18mm MDF',
      position: [0, y, -(upperDepth / 2)],
      rotation: [0, 0, 0],
      group: 'shelf',
    });

    pieces.push({
      id: nextId('alcove-cleat'),
      name: `Shelf Cleat ${i + 1}`,
      width: shelfWidth - 30,
      height: tol.carcassThickness,
      thickness: 40,
      quantity: 1,
      material: '18mm MDF',
      position: [0, y - tol.carcassThickness / 2, -(upperDepth - 20)],
      rotation: [0, 0, 0],
      group: 'top_bottom',
    });
  }

  if (showLineBoring && shelfCount > 0) {
    pieces.push(...offsetPieces(generateLineBoringGrid({ width: dim.width, height: upperHeight, depth: upperDepth }, tol, backFit), [0, upperBottomY + upperHeight / 2, 0]));
  }

  return pieces;
}

function generateWallHungVanity(config: FurnitureConfig): ComponentPiece[] {
  const { dimensions: dim, tolerances: tol, numberOfShelves, shelfPositions, shelfBase, hasDoors, doorStyle, showLineBoring } = config;
  const pieces: ComponentPiece[] = [];

  pieces.push(...generateCarcass(dim, tol, 'dado_joint'));
  pieces.push(...generateShelves(dim, tol, numberOfShelves, shelfPositions, shelfBase, 'dado_joint'));
  pieces.push(...generateWardrobeDoors(dim, tol, hasDoors, doorStyle));

  const internalWidth = dim.width - 2 * tol.carcassThickness;
  const railDepth = 120;
  const railYTop = dim.height / 2 - tol.carcassThickness * 1.5;
  const railYBot = railYTop - 120;

  pieces.push({
    id: nextId('vanity-rail'),
    name: 'Vanity Rear Service Rail Top',
    width: internalWidth,
    height: tol.carcassThickness,
    thickness: railDepth,
    quantity: 1,
    material: '18mm MDF',
    position: [0, railYTop, -(dim.depth - railDepth / 2)],
    rotation: [0, 0, 0],
    group: 'top_bottom',
  });

  pieces.push({
    id: nextId('vanity-rail'),
    name: 'Vanity Rear Service Rail Bottom',
    width: internalWidth,
    height: tol.carcassThickness,
    thickness: railDepth,
    quantity: 1,
    material: '18mm MDF',
    position: [0, railYBot, -(dim.depth - railDepth / 2)],
    rotation: [0, 0, 0],
    group: 'top_bottom',
  });

  if (showLineBoring && numberOfShelves > 0) {
    pieces.push(...generateLineBoringGrid(dim, tol, 'dado_joint'));
  }

  return pieces;
}

function generateSlimlineStorageTower(config: FurnitureConfig): ComponentPiece[] {
  const { dimensions: dim, tolerances: tol, numberOfShelves, shelfPositions, shelfBase, hasDoors, doorStyle, showLineBoring } = config;
  const pieces: ComponentPiece[] = [];
  const slimDim = { ...dim, depth: 300 };

  pieces.push(...generateCarcass(slimDim, tol, 'dado_joint'));
  pieces.push(...generateShelves(slimDim, tol, Math.max(2, numberOfShelves), shelfPositions, shelfBase, 'dado_joint'));
  pieces.push(...generateWardrobeDoors(slimDim, tol, hasDoors, doorStyle));

  if (showLineBoring) {
    pieces.push(...generateLineBoringGrid(slimDim, tol, 'dado_joint'));
  }

  return pieces;
}

function generateBootBench(config: FurnitureConfig): ComponentPiece[] {
  const { dimensions: dim, tolerances: tol, numberOfShelves, numberOfDrawers, drawerHeights } = config;
  const pieces: ComponentPiece[] = [];
  const benchHeight = Math.min(500, Math.max(450, dim.height));
  const benchDim = { ...dim, height: benchHeight, depth: Math.max(500, dim.depth) };

  pieces.push(...generateCarcass(benchDim, tol, 'dado_joint'));

  const internalWidth = benchDim.width - 2 * tol.carcassThickness;
  const reinforcedDepth = Math.max(1, benchDim.depth - 2 * tol.carcassThickness);
  pieces.push({
    id: nextId('bench-reinf'),
    name: 'Boot Bench Reinforcement Rail Front',
    width: internalWidth,
    height: tol.carcassThickness,
    thickness: 100,
    quantity: 1,
    material: '18mm MDF',
    position: [0, benchDim.height / 2 - tol.carcassThickness * 1.5, -50],
    rotation: [0, 0, 0],
    group: 'top_bottom',
  });

  pieces.push({
    id: nextId('bench-reinf'),
    name: 'Boot Bench Reinforcement Rail Rear',
    width: internalWidth,
    height: tol.carcassThickness,
    thickness: 100,
    quantity: 1,
    material: '18mm MDF',
    position: [0, benchDim.height / 2 - tol.carcassThickness * 1.5, -(reinforcedDepth - 50)],
    rotation: [0, 0, 0],
    group: 'top_bottom',
  });

  const cubbyCount = Math.max(0, Math.floor(numberOfShelves));
  for (let i = 1; i <= cubbyCount; i++) {
    const x = -benchDim.width / 2 + tol.carcassThickness + (internalWidth / (cubbyCount + 1)) * i;
    pieces.push({
      id: nextId('bench-div'),
      name: `Boot Bench Cubbie Divider ${i}`,
      width: tol.carcassThickness,
      height: benchDim.height - 2 * tol.carcassThickness,
      thickness: reinforcedDepth,
      quantity: 1,
      material: '18mm MDF',
      position: [x, 0, -(benchDim.depth / 2)],
      rotation: [0, 0, 0],
      group: 'side',
    });
  }

  if (numberOfDrawers > 0) {
    pieces.push(...generateDrawers(benchDim, tol, numberOfDrawers, drawerHeights));
  }

  return pieces;
}

function generateBroomCupboard(config: FurnitureConfig): ComponentPiece[] {
  const { dimensions: dim, tolerances: tol, hasDoors, doorStyle, showLineBoring } = config;
  const pieces: ComponentPiece[] = [];
  pieces.push(...generateCarcass(dim, tol, 'dado_joint'));
  pieces.push(...generateWardrobeDoors(dim, tol, hasDoors, doorStyle));

  const sideDepth = dim.depth - tol.backInset;
  const dividerX = -dim.width / 2 + tol.carcassThickness + (dim.width - 2 * tol.carcassThickness) * 0.62;
  pieces.push({
    id: nextId('broom-div'),
    name: 'Broom Cupboard Full Divider',
    width: tol.carcassThickness,
    height: dim.height - 2 * tol.carcassThickness,
    thickness: sideDepth,
    quantity: 1,
    material: '18mm MDF',
    position: [dividerX, 0, -(sideDepth / 2)],
    rotation: [0, 0, 0],
    group: 'side',
  });

  const shelfBayWidth = dim.width / 2 - tol.carcassThickness;
  const shelfDepth = Math.max(1, sideDepth - 20);
  [0.28, 0.48, 0.68].forEach((ratio, idx) => {
    const y = -dim.height / 2 + tol.carcassThickness + ratio * (dim.height - 2 * tol.carcassThickness);
    pieces.push({
      id: nextId('broom-shelf'),
      name: `Broom Side Shelf ${idx + 1}`,
      width: shelfBayWidth,
      height: tol.carcassThickness,
      thickness: shelfDepth,
      quantity: 1,
      material: '18mm MDF',
      position: [dim.width / 4, y, -(shelfDepth / 2)],
      rotation: [0, 0, 0],
      group: 'shelf',
    });
  });

  // Visual markers for localized charging/cable cutouts.
  pieces.push({
    id: nextId('broom-cutout'),
    name: 'Cable Routing Cutout Marker 1',
    width: 60,
    height: 20,
    thickness: 2,
    quantity: 1,
    material: '6mm Ply',
    position: [-(dim.width / 2) + 120, -dim.height / 2 + 120, -(dim.depth - 10)],
    rotation: [0, 0, 0],
    group: 'bore_marker',
  });

  pieces.push({
    id: nextId('broom-cutout'),
    name: 'Cable Routing Cutout Marker 2',
    width: 60,
    height: 20,
    thickness: 2,
    quantity: 1,
    material: '6mm Ply',
    position: [-(dim.width / 2) + 240, -dim.height / 2 + 120, -(dim.depth - 10)],
    rotation: [0, 0, 0],
    group: 'bore_marker',
  });

  if (showLineBoring) {
    pieces.push(...generateLineBoringGrid(dim, tol, 'dado_joint'));
  }

  return pieces;
}

function generateScribeFillerPanel(config: FurnitureConfig): ComponentPiece[] {
  const { dimensions: dim } = config;
  return [
    {
      id: nextId('scribe-panel'),
      name: 'Scribe/Filler Panel',
      width: dim.width,
      height: dim.height,
      thickness: dim.depth,
      quantity: 1,
      material: '18mm MDF',
      position: [0, 0, -(dim.depth / 2)],
      rotation: [0, 0, 0],
      group: 'side',
    },
  ];
}

function generateCornerPost(config: FurnitureConfig): ComponentPiece[] {
  const { dimensions: dim, tolerances: tol } = config;
  const t = Math.min(dim.depth, tol.carcassThickness);
  const leg = Math.max(dim.width, dim.depth);

  return [
    {
      id: nextId('corner-post'),
      name: 'Corner Post Leg X',
      width: leg,
      height: dim.height,
      thickness: t,
      quantity: 1,
      material: '18mm MDF',
      position: [-(leg / 2 - t / 2), 0, -(t / 2)],
      rotation: [0, 0, 0],
      group: 'side',
    },
    {
      id: nextId('corner-post'),
      name: 'Corner Post Leg Z',
      width: t,
      height: dim.height,
      thickness: leg,
      quantity: 1,
      material: '18mm MDF',
      position: [-(t / 2), 0, -(leg / 2 - t / 2)],
      rotation: [0, 0, 0],
      group: 'side',
    },
  ];
}

function generateKitchenUnit(config: FurnitureConfig): ComponentPiece[] {
  const pieces: ComponentPiece[] = [];
  const spec = getKitchenUnitSpec(config.kitchenUnitCode);
  const tol = config.tolerances;
  const isInsetDoors = config.doorStyle === 'inset';
  const isWallLike = spec.family === 'wall' || spec.family === 'bridge_wall' || spec.family === 'open_wall';
  const serviceVoid = spec.serviceVoid ?? (isWallLike ? 0 : 50);
  const kitchenBackThickness = 18;
  const includeBottomPanel = spec.includeBottomPanel !== false;
  const includeTopPanel = spec.includeTopPanel !== false;
  const includeBackPanel = spec.includeBackPanel !== false;
  const frontStretcherDepth = spec.frontStretcherDepth ?? 90;
  const rearStretcherDepth = spec.rearStretcherDepth ?? 90;
  const dim = {
    width: spec.width,
    height: spec.height,
    depth: spec.depth,
  };

  const sideDepth = dim.depth;
  const internalWidth = dim.width - 2 * tol.carcassThickness;
  const internalHeight = dim.height - 2 * tol.carcassThickness;
  const halfWidth = dim.width / 2;
  const halfHeight = dim.height / 2;
  const internalRearDepth = dim.depth - serviceVoid;

  pieces.push({
    id: nextId('k-side'),
    name: `${spec.code} Left Side Panel`,
    width: tol.carcassThickness,
    height: dim.height,
    thickness: sideDepth,
    quantity: 1,
    material: '18mm MDF',
    position: [-(halfWidth - tol.carcassThickness / 2), 0, -(sideDepth / 2)],
    rotation: [0, 0, 0],
    group: 'side',
  });

  pieces.push({
    id: nextId('k-side'),
    name: `${spec.code} Right Side Panel`,
    width: tol.carcassThickness,
    height: dim.height,
    thickness: sideDepth,
    quantity: 1,
    material: '18mm MDF',
    position: [halfWidth - tol.carcassThickness / 2, 0, -(sideDepth / 2)],
    rotation: [0, 0, 0],
    group: 'side',
  });

  if (spec.usesTopStretchers) {
    if (includeBottomPanel) {
      pieces.push({
        id: nextId('k-bot'),
        name: `${spec.code} Bottom Panel`,
        width: internalWidth,
        height: tol.carcassThickness,
        thickness: internalRearDepth,
        quantity: 1,
        material: '18mm MDF',
        position: [0, -(halfHeight - tol.carcassThickness / 2), -(internalRearDepth / 2)],
        rotation: [0, 0, 0],
        group: 'top_bottom',
      });
    }

    const frontDepth = Math.min(frontStretcherDepth, internalRearDepth);
    const rearDepth = Math.min(rearStretcherDepth, internalRearDepth);

    pieces.push({
      id: nextId('k-top'),
      name: `${spec.code} Front Stretcher`,
      width: internalWidth,
      height: tol.carcassThickness,
      thickness: frontDepth,
      quantity: 1,
      material: '18mm MDF',
      position: [0, halfHeight - tol.carcassThickness / 2, -(serviceVoid + frontDepth / 2)],
      rotation: [0, 0, 0],
      group: 'top_bottom',
    });

    pieces.push({
      id: nextId('k-top'),
      name: `${spec.code} Rear Stretcher`,
      width: internalWidth,
      height: tol.carcassThickness,
      thickness: rearDepth,
      quantity: 1,
      material: '18mm MDF',
      position: [0, halfHeight - tol.carcassThickness / 2, -(internalRearDepth - rearDepth / 2)],
      rotation: [0, 0, 0],
      group: 'top_bottom',
    });
  } else {
    if (includeTopPanel) {
      pieces.push({
        id: nextId('k-top'),
        name: `${spec.code} Top Panel`,
        width: internalWidth,
        height: tol.carcassThickness,
        thickness: internalRearDepth,
        quantity: 1,
        material: '18mm MDF',
        position: [0, halfHeight - tol.carcassThickness / 2, -(internalRearDepth / 2)],
        rotation: [0, 0, 0],
        group: 'top_bottom',
      });
    }

    if (includeBottomPanel) {
      pieces.push({
        id: nextId('k-bot'),
        name: `${spec.code} Bottom Panel`,
        width: internalWidth,
        height: tol.carcassThickness,
        thickness: internalRearDepth,
        quantity: 1,
        material: '18mm MDF',
        position: [0, -(halfHeight - tol.carcassThickness / 2), -(internalRearDepth / 2)],
        rotation: [0, 0, 0],
        group: 'top_bottom',
      });
    }
  }

  if (getKitchenShelfCount(spec) > 0) {
    pieces.push(...generateKitchenShelves(spec, dim, tol, serviceVoid));
    if (config.showLineBoring) {
      pieces.push(...generateLineBoringGrid(dim, tol, 'dado_joint'));
    }
  }

  if (includeBackPanel) {
    const backWidth = dim.width - 2 * tol.backInset;
    const backHeight = dim.height - 2 * tol.backInset;
    pieces.push({
      id: nextId('k-back'),
      name: `${spec.code} Back Panel`,
      width: backWidth,
      height: backHeight,
      thickness: kitchenBackThickness,
      quantity: 1,
      material: '18mm MDF',
      position: [0, 0, -(dim.depth - serviceVoid - kitchenBackThickness / 2)],
      rotation: [0, 0, 0],
      group: 'back',
    });
  }

  const frontGap = tol.doorGap;
  let accumulatedY = -halfHeight + tol.carcassThickness;
  spec.frontLayout.forEach((front, index) => {
    for (let i = 0; i < front.quantity; i++) {
      if (front.kind === 'blank') {
        accumulatedY += front.height;
        return;
      }

      const isPairedDoor = front.kind === 'door' && front.paired === true && front.quantity === 2;
      const isFullHeightSingleDoor = front.kind === 'door' && front.quantity === 1 && front.height >= dim.height - 1;
      const frontHeight = isFullHeightSingleDoor
        ? (isInsetDoors ? internalHeight - (2 * frontGap) : dim.height - (2 * frontGap))
        : front.height - frontGap;
      const openingWidth = Math.max(1, internalWidth);
      const frontWidth = isPairedDoor
        ? ((isInsetDoors ? openingWidth : dim.width) - 3 * frontGap) / 2
        : (isInsetDoors ? openingWidth : dim.width) - 2 * frontGap;
      const xOffset = isPairedDoor
        ? (i === 0 ? -(frontWidth / 2 + frontGap / 2) : frontWidth / 2 + frontGap / 2)
        : 0;
      const yCenter = isFullHeightSingleDoor
        ? 0
        : isPairedDoor
          ? accumulatedY + front.height / 2
          : accumulatedY + front.height / 2 + i * front.height;

      pieces.push({
        id: nextId(`k-front-${index}`),
        name: `${spec.code} ${front.label}${front.quantity === 2 ? ` ${i + 1}` : ''}`,
        width: frontWidth,
        height: frontHeight,
        thickness: tol.carcassThickness,
        quantity: 1,
        material: '18mm MDF',
        position: [xOffset, yCenter, isInsetDoors ? -(tol.carcassThickness / 2) : tol.carcassThickness / 2],
        rotation: [0, 0, 0],
        group: front.kind === 'drawer_front' ? 'drawer_front' : 'door',
      });
    }

    if (front.kind !== 'blank') {
      accumulatedY += front.kind === 'door' && front.paired === true && front.quantity === 2
        ? front.height
        : front.height * front.quantity;
    }
  });

  return pieces;
}

function generateKitchenShelves(
  spec: ReturnType<typeof getKitchenUnitSpec>,
  dim: { width: number; height: number; depth: number },
  tol: GlobalTolerances,
  serviceVoid: number
): ComponentPiece[] {
  const pieces: ComponentPiece[] = [];
  const shelfCount = getKitchenShelfCount(spec);
  if (shelfCount <= 0) return pieces;

  const internalWidth = dim.width - 2 * tol.carcassThickness;
  const internalRearDepth = dim.depth - serviceVoid;
  const shelfDepthReduction = spec.shelfDepthReduction ?? 20;
  const shelfFrontSetback = spec.shelfFrontSetback ?? 2;
  const shelfSideClipClearance = spec.shelfSideClipClearance ?? 4;
  const shelfDepth = Math.max(1, internalRearDepth - shelfDepthReduction);
  const shelfWidth = Math.max(1, internalWidth - shelfSideClipClearance);
  const halfHeight = dim.height / 2;

  const shelfPositions = spec.shelfPositions && spec.shelfPositions.length === shelfCount
    ? spec.shelfPositions
    : Array.from({ length: shelfCount }, (_, i) => ((i + 1) / (shelfCount + 1)) * dim.height);

  shelfPositions.forEach((pos, index) => {
    pieces.push({
      id: nextId(`k-shelf-${index}`),
      name: `${spec.code} Shelf ${index + 1}`,
      width: shelfWidth,
      height: tol.carcassThickness,
      thickness: shelfDepth,
      quantity: 1,
      material: '18mm MDF',
      // Keep adjustable shelves off the door line and clear of the back panel.
      position: [0, pos - halfHeight, -(shelfDepth / 2) - shelfFrontSetback],
      rotation: [0, 0, 0],
      group: 'shelf',
    });
  });

  return pieces;
}

function getKitchenShelfCount(spec: ReturnType<typeof getKitchenUnitSpec>): number {
  if (typeof spec.shelfCount === 'number') {
    return Math.max(0, Math.floor(spec.shelfCount));
  }
  if (spec.family === 'wall') return 1;
  if (spec.family === 'tall') return 2;
  return 0;
}

// ═══════════════════════════════════════════════════════════════
// LAYER 2.5 — WARDROBE DOORS
// ═══════════════════════════════════════════════════════════════

function generateWardrobeDoors(
  dim: FurnitureDimensions,
  tol: GlobalTolerances,
  hasDoors: boolean,
  doorStyle: FurnitureConfig['doorStyle'] = 'overlay',
  offset: [number, number, number] = [0, 0, 0]
): ComponentPiece[] {
  const pieces: ComponentPiece[] = [];
  if (!hasDoors) return pieces;

  const isInset = doorStyle === 'inset';
  const openingWidth = Math.max(1, dim.width - 2 * tol.carcassThickness);
  const openingHeight = Math.max(1, dim.height - 2 * tol.carcassThickness);
  const doorHeight = (isInset ? openingHeight : dim.height) - 2 * tol.doorGap;
  const doorThickness = tol.carcassThickness; // 18mm
  const doorZ = isInset ? -(doorThickness / 2) : doorThickness / 2;

  if (dim.width <= 600) {
    // Single door
    const doorWidth = (isInset ? openingWidth : dim.width) - 2 * tol.doorGap;
    pieces.push({
      id: nextId('door'),
      name: 'Wardrobe Door',
      width: doorWidth,
      height: doorHeight,
      thickness: doorThickness,
      quantity: 1,
      material: '18mm MDF',
      position: [offset[0], offset[1], doorZ + offset[2]],
      rotation: [0, 0, 0],
      group: 'door',
    });
  } else {
    // Double doors
    const totalWidth = isInset ? openingWidth : dim.width;
    const doorWidth = (totalWidth - 3 * tol.doorGap) / 2;
    const halfGap = tol.doorGap / 2;
    
    // Left Door
    pieces.push({
      id: nextId('door'),
      name: 'Left Wardrobe Door',
      width: doorWidth,
      height: doorHeight,
      thickness: doorThickness,
      quantity: 1,
      material: '18mm MDF',
      position: [-(doorWidth / 2 + halfGap) + offset[0], offset[1], doorZ + offset[2]],
      rotation: [0, 0, 0],
      group: 'door',
    });

    // Right Door
    pieces.push({
      id: nextId('door'),
      name: 'Right Wardrobe Door',
      width: doorWidth,
      height: doorHeight,
      thickness: doorThickness,
      quantity: 1,
      material: '18mm MDF',
      position: [doorWidth / 2 + halfGap + offset[0], offset[1], doorZ + offset[2]],
      rotation: [0, 0, 0],
      group: 'door',
    });
  }

  return pieces;
}

// ═══════════════════════════════════════════════════════════════
// LAYER 2 — CARCASS PANELS
// ═══════════════════════════════════════════════════════════════

function generateCarcass(
  dim: FurnitureDimensions,
  tol: GlobalTolerances,
  backFit: 'nailed' | 'dado_joint' = 'nailed'
): ComponentPiece[] {
  const pieces: ComponentPiece[] = [];

  // The model origin is at the center-bottom-front of the carcass.
  // X axis = width (left-right)
  // Y axis = height (bottom-top)
  // Z axis = depth (front-back, negative = into the furniture)

  const sideDepth = dim.depth - (backFit === 'nailed' ? tol.backPanelThickness : tol.backInset);
  const internalWidth = dim.width - 2 * tol.carcassThickness;
  const halfWidth = dim.width / 2;
  const halfHeight = dim.height / 2;

  // ── LEFT SIDE PANEL ─────────────────────────────────────────
  pieces.push({
    id: nextId('side'),
    name: 'Left Side Panel',
    width: tol.carcassThickness,
    height: dim.height,
    thickness: sideDepth,
    quantity: 1,
    material: '18mm MDF',
    position: [
      -(halfWidth - tol.carcassThickness / 2),
      0,
      -(sideDepth / 2),
    ],
    rotation: [0, 0, 0],
    group: 'side',
  });

  // ── RIGHT SIDE PANEL ────────────────────────────────────────
  pieces.push({
    id: nextId('side'),
    name: 'Right Side Panel',
    width: tol.carcassThickness,
    height: dim.height,
    thickness: sideDepth,
    quantity: 1,
    material: '18mm MDF',
    position: [
      halfWidth - tol.carcassThickness / 2,
      0,
      -(sideDepth / 2),
    ],
    rotation: [0, 0, 0],
    group: 'side',
  });

  // ── TOP PANEL ───────────────────────────────────────────────
  // Sits flush between the two side panels, at the top
  pieces.push({
    id: nextId('top'),
    name: 'Top Panel',
    width: internalWidth,
    height: tol.carcassThickness,
    thickness: sideDepth,
    quantity: 1,
    material: '18mm MDF',
    position: [
      0,
      halfHeight - tol.carcassThickness / 2,
      -(sideDepth / 2),
    ],
    rotation: [0, 0, 0],
    group: 'top_bottom',
  });

  // ── BOTTOM PANEL ────────────────────────────────────────────
  pieces.push({
    id: nextId('bottom'),
    name: 'Bottom Panel',
    width: internalWidth,
    height: tol.carcassThickness,
    thickness: sideDepth,
    quantity: 1,
    material: '18mm MDF',
    position: [
      0,
      -(halfHeight - tol.carcassThickness / 2),
      -(sideDepth / 2),
    ],
    rotation: [0, 0, 0],
    group: 'top_bottom',
  });

  // ── BACK PANEL ──────────────────────────────────────────────
  // Recessed into rebate/groove at the back, or nailed directly to rear
  const backWidth = backFit === 'nailed' ? dim.width : dim.width - 2 * tol.backInset;
  const backHeight = backFit === 'nailed' ? dim.height : dim.height - 2 * tol.backInset;
  pieces.push({
    id: nextId('back'),
    name: 'Back Panel',
    width: backWidth,
    height: backHeight,
    thickness: tol.backPanelThickness,
    quantity: 1,
    material: '6mm Ply',
    position: [
      0,
      0,
      -(dim.depth - tol.backPanelThickness / 2),
    ],
    rotation: [0, 0, 0],
    group: 'back',
  });

  return pieces;
}

// ═══════════════════════════════════════════════════════════════
// LAYER 2 — INTERNAL SHELVES (wardrobe mode)
// ═══════════════════════════════════════════════════════════════

function generateShelves(
  dim: FurnitureDimensions,
  tol: GlobalTolerances,
  numberOfShelves: number,
  shelfPositions?: number[],
  shelfBase: 'router_slots' | 'solid_12mm_biscuits' = 'router_slots',
  backFit: 'nailed' | 'dado_joint' = 'nailed'
): ComponentPiece[] {
  const pieces: ComponentPiece[] = [];

  if (numberOfShelves <= 0) return pieces;

  const sideDepth = dim.depth - (backFit === 'nailed' ? tol.backPanelThickness : tol.backInset);
  const internalWidth = dim.width - 2 * tol.carcassThickness;
  const internalHeight = dim.height - 2 * tol.carcassThickness;
  const halfHeight = dim.height / 2;

  // Spacing positions relative to the top face of the bottom carcass panel
  const positions = (shelfPositions && shelfPositions.length === numberOfShelves)
    ? shelfPositions
    : Array(numberOfShelves).fill(0).map((_, i) => (internalHeight / (numberOfShelves + 1)) * (i + 1) - tol.carcassThickness / 2);

  const shelfWidth = shelfBase === 'router_slots' ? internalWidth + 12 : internalWidth;
  const shelfThickness = shelfBase === 'solid_12mm_biscuits' ? 12 : tol.carcassThickness;
  const shelfMaterial = shelfBase === 'solid_12mm_biscuits' ? '12mm Drawer Box' : '18mm MDF';

  for (let i = 0; i < numberOfShelves; i++) {
    const shelfY = -halfHeight + tol.carcassThickness + positions[i];

    pieces.push({
      id: nextId('shelf'),
      name: `Shelf ${i + 1}`,
      width: shelfWidth,
      height: shelfThickness,
      thickness: sideDepth,
      quantity: 1,
      material: shelfMaterial,
      position: [0, shelfY, -(sideDepth / 2)],
      rotation: [0, 0, 0],
      group: 'shelf',
    });
  }

  return pieces;
}

function generateLineBoringGrid(
  dim: FurnitureDimensions,
  tol: GlobalTolerances,
  backFit: 'nailed' | 'dado_joint' = 'nailed'
): ComponentPiece[] {
  const pieces: ComponentPiece[] = [];

  const sideDepth = dim.depth - (backFit === 'nailed' ? tol.backPanelThickness : tol.backInset);
  const halfWidth = dim.width / 2;
  const halfHeight = dim.height / 2;
  const markerSize = 5;
  const markerDepth = 2;
  const frontOffset = Math.min(37, Math.max(20, sideDepth / 4));
  const rearOffset = Math.min(37, Math.max(20, sideDepth / 4));

  const leftX = -(halfWidth - tol.carcassThickness - markerSize / 2);
  const rightX = halfWidth - tol.carcassThickness - markerSize / 2;
  const rowZs = [
    -frontOffset,
    -(Math.max(frontOffset + markerDepth, sideDepth - rearOffset)),
  ];

  const firstY = -halfHeight + tol.carcassThickness + 64;
  const lastY = halfHeight - tol.carcassThickness - 64;
  const pitch = 32;

  for (let y = firstY; y <= lastY; y += pitch) {
    [leftX, rightX].forEach((x, sideIndex) => {
      rowZs.forEach((z, rowIndex) => {
        pieces.push({
          id: nextId(`lb-${sideIndex}-${rowIndex}`),
          name: `Line-Bore Marker ${Math.round(y)}mm`,
          width: markerSize,
          height: markerSize,
          thickness: markerDepth,
          quantity: 1,
          material: '6mm Ply',
          position: [x, y, z],
          rotation: [0, 0, 0],
          group: 'bore_marker',
        });
      });
    });
  }

  return pieces;
}

// ═══════════════════════════════════════════════════════════════
// LAYER 3 — DRAWER BOXES & FRONTS
// ═══════════════════════════════════════════════════════════════

function generateDrawers(
  dim: FurnitureDimensions,
  tol: GlobalTolerances,
  numberOfDrawers: number,
  drawerHeights?: number[]
): ComponentPiece[] {
  const pieces: ComponentPiece[] = [];

  if (numberOfDrawers <= 0) return pieces;

  // Available internal height between top and bottom carcass panels
  const internalHeight = dim.height - 2 * tol.carcassThickness;

  // Resolve drawer heights: use custom heights if provided and matching quantity, otherwise equal heights
  let heights = (drawerHeights && drawerHeights.length === numberOfDrawers)
    ? drawerHeights
    : Array(numberOfDrawers).fill(internalHeight / numberOfDrawers);

  // Normalize heights just in case the sum differs from internalHeight due to roundings
  const sumHeights = heights.reduce((sum, h) => sum + h, 0);
  if (Math.abs(sumHeights - internalHeight) > 1) {
    const scale = internalHeight / sumHeights;
    heights = heights.map((h) => h * scale);
  }

  // ── DRAWER BOX DIMENSIONS ──────────────────────────────────
  // Safety clearance of 50mm behind the drawer for back panel space
  const drawerBoxSideDepth = dim.depth - tol.backPanelThickness - 50;
  const drawerBoxOuterWidth = dim.width - 2 * tol.carcassThickness - 2 * tol.runnerClearance;
  const drawerBoxFrontBackWidth = dim.width - 2 * tol.carcassThickness - 2 * tol.runnerClearance - 2 * tol.drawerBoxThickness;
  const drawerBottomWidth = drawerBoxFrontBackWidth;
  const drawerBottomDepth = drawerBoxSideDepth - 2 * tol.drawerBoxThickness;

  // Drawer fronts should span the full external face, not just the carcass opening.
  // We keep the proportions from the requested drawer heights, then fit that stack
  // to the full external height minus only the inter-front gaps.
  const totalFrontGap = Math.max(0, (numberOfDrawers - 1) * tol.drawerFrontGap);
  const availableFrontHeight = dim.height - totalFrontGap;
  const frontHeightSourceSum = heights.reduce((sum, h) => sum + h, 0) || 1;
  const frontHeights = heights.map((h) => (h / frontHeightSourceSum) * availableFrontHeight);

  let stackTopY = dim.height / 2;

  for (let i = 0; i < numberOfDrawers; i++) {
    const slotHeight = heights[i];
    const drawerFrontHeight = frontHeights[i];
    const slotCenterY = stackTopY - drawerFrontHeight / 2;
    stackTopY -= drawerFrontHeight + (i < numberOfDrawers - 1 ? tol.drawerFrontGap : 0);

    // ── DRAWER FRONT DIMENSIONS ─────────────────────────────────
    const drawerFrontWidth = dim.width - 2 * tol.doorGap;

    pieces.push({
      id: nextId('df'),
      name: `Drawer ${i + 1} Front`,
      width: drawerFrontWidth,
      height: drawerFrontHeight,
      thickness: tol.carcassThickness,
      quantity: 1,
      material: '18mm MDF',
      position: [0, slotCenterY, tol.carcassThickness / 2],
      rotation: [0, 0, 0],
      group: 'drawer_front',
      drawerIndex: i,
    });

    // Drawer box Z center (box sits behind the front panel)
    const boxZCenter = -(drawerBoxSideDepth / 2);

    // Drawer box Y center (box is slightly lower than front, centered on box height)
    const drawerBoxSideHeight = Math.max(20, slotHeight - 40);
    const boxYCenter = slotCenterY - (drawerFrontHeight - drawerBoxSideHeight) / 2;

    // ── DRAWER BOX — LEFT SIDE ──────────────────────────────
    pieces.push({
      id: nextId('dbl'),
      name: `Drawer ${i + 1} Box Left`,
      width: tol.drawerBoxThickness,
      height: drawerBoxSideHeight,
      thickness: drawerBoxSideDepth,
      quantity: 1,
      material: '12mm Drawer Box',
      position: [
        -(drawerBoxOuterWidth / 2 - tol.drawerBoxThickness / 2),
        boxYCenter,
        boxZCenter,
      ],
      rotation: [0, 0, 0],
      group: 'drawer_box',
      drawerIndex: i,
    });

    // ── DRAWER BOX — RIGHT SIDE ─────────────────────────────
    pieces.push({
      id: nextId('dbr'),
      name: `Drawer ${i + 1} Box Right`,
      width: tol.drawerBoxThickness,
      height: drawerBoxSideHeight,
      thickness: drawerBoxSideDepth,
      quantity: 1,
      material: '12mm Drawer Box',
      position: [
        drawerBoxOuterWidth / 2 - tol.drawerBoxThickness / 2,
        boxYCenter,
        boxZCenter,
      ],
      rotation: [0, 0, 0],
      group: 'drawer_box',
      drawerIndex: i,
    });

    // ── DRAWER BOX — FRONT PIECE ────────────────────────────
    pieces.push({
      id: nextId('dbf'),
      name: `Drawer ${i + 1} Box Front`,
      width: drawerBoxFrontBackWidth,
      height: drawerBoxSideHeight,
      thickness: tol.drawerBoxThickness,
      quantity: 1,
      material: '12mm Drawer Box',
      position: [
        0,
        boxYCenter,
        -(tol.drawerBoxThickness / 2),
      ],
      rotation: [0, 0, 0],
      group: 'drawer_box',
      drawerIndex: i,
    });

    // ── DRAWER BOX — BACK PIECE ─────────────────────────────
    pieces.push({
      id: nextId('dbb'),
      name: `Drawer ${i + 1} Box Back`,
      width: drawerBoxFrontBackWidth,
      height: drawerBoxSideHeight,
      thickness: tol.drawerBoxThickness,
      quantity: 1,
      material: '12mm Drawer Box',
      position: [
        0,
        boxYCenter,
        -(drawerBoxSideDepth - tol.drawerBoxThickness / 2),
      ],
      rotation: [0, 0, 0],
      group: 'drawer_box',
      drawerIndex: i,
    });

    // ── DRAWER BOTTOM ───────────────────────────────────────
    const bottomY = boxYCenter - drawerBoxSideHeight / 2 + 8 + tol.backPanelThickness / 2;
    pieces.push({
      id: nextId('dbot'),
      name: `Drawer ${i + 1} Bottom`,
      width: drawerBottomWidth,
      height: tol.backPanelThickness,
      thickness: drawerBottomDepth,
      quantity: 1,
      material: '6mm Ply',
      position: [
        0,
        bottomY,
        -(drawerBoxSideDepth / 2),
      ],
      rotation: [0, 0, 0],
      group: 'drawer_bottom',
      drawerIndex: i,
    });
  }

  return pieces;
}

/**
 * Calculate the exploded position offset for a component piece.
 * Shifts parts outward from the model center based on their group.
 */
export function getExplodedOffset(
  piece: ComponentPiece,
  factor: number
): [number, number, number] {
  if (factor <= 0) return [0, 0, 0];

  const spread = factor * 150; // Max 150mm spread at factor=1.0

  switch (piece.group) {
    case 'side':
      // Push side panels outward along X
      return [Math.sign(piece.position[0]) * spread, 0, 0];

    case 'top_bottom':
      // Push top/bottom outward along Y
      return [0, Math.sign(piece.position[1]) * spread, 0];

    case 'back':
      // Push back panel backward along Z
      return [0, 0, -spread];

    case 'shelf':
      // Push shelves slightly upward based on their position
      return [0, Math.sign(piece.position[1] || 1) * spread * 0.3, 0];

    case 'drawer_front':
      // Pull drawer fronts forward (out of the carcass)
      return [0, 0, spread * 1.5];

    case 'door':
      // Pull doors forward (out of the carcass), slightly more than drawer fronts
      return [0, 0, spread * 1.8];

    case 'drawer_box':
      // Pull drawer boxes forward along Z
      return [0, 0, spread * 1.2];

    case 'drawer_bottom':
      // Pull drawer bottoms forward, slightly less than box sides
      return [0, 0, spread * 1.2];

    case 'bore_marker':
      // Keep bore markers close to source panels for readability.
      return [0, 0, spread * 0.15];

    default:
      return [0, 0, 0];
  }
}
