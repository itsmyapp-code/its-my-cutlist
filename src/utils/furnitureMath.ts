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

  // ── LAYER 2: CARCASS ────────────────────────────────────────
  pieces.push(...generateCarcass(dimensions, tolerances));

  // ── LAYER 3: DRAWERS / SHELVES ──────────────────────────────
  if (type === 'chest_of_drawers') {
    pieces.push(...generateDrawers(dimensions, tolerances, config.numberOfDrawers));
  } else {
    // Wardrobe: internal shelves
    pieces.push(...generateShelves(dimensions, tolerances, config.numberOfShelves));
  }

  return pieces;
}

// ═══════════════════════════════════════════════════════════════
// LAYER 2 — CARCASS PANELS
// ═══════════════════════════════════════════════════════════════

function generateCarcass(
  dim: FurnitureDimensions,
  tol: GlobalTolerances
): ComponentPiece[] {
  const pieces: ComponentPiece[] = [];

  // The model origin is at the center-bottom-front of the carcass.
  // X axis = width (left-right)
  // Y axis = height (bottom-top)
  // Z axis = depth (front-back, negative = into the furniture)

  const sideDepth = dim.depth - tol.backInset;
  const internalWidth = dim.width - 2 * tol.carcassThickness;
  const halfWidth = dim.width / 2;
  const halfHeight = dim.height / 2;
  const halfDepth = dim.depth / 2;

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
      -(tol.backInset / 2),
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
      -(tol.backInset / 2),
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
      -(tol.backInset / 2),
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
      -(tol.backInset / 2),
    ],
    rotation: [0, 0, 0],
    group: 'top_bottom',
  });

  // ── BACK PANEL ──────────────────────────────────────────────
  // Recessed into rebate/groove at the back
  const backWidth = dim.width - 2 * tol.backInset;
  const backHeight = dim.height - 2 * tol.backInset;
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
  numberOfShelves: number
): ComponentPiece[] {
  const pieces: ComponentPiece[] = [];

  if (numberOfShelves <= 0) return pieces;

  const sideDepth = dim.depth - tol.backInset;
  const internalWidth = dim.width - 2 * tol.carcassThickness;
  const internalHeight = dim.height - 2 * tol.carcassThickness;
  const halfHeight = dim.height / 2;

  // Divide internal height into (numberOfShelves + 1) equal compartments
  const compartmentHeight = internalHeight / (numberOfShelves + 1);

  for (let i = 0; i < numberOfShelves; i++) {
    const shelfY =
      -halfHeight +
      tol.carcassThickness +
      compartmentHeight * (i + 1) -
      tol.carcassThickness / 2;

    pieces.push({
      id: nextId('shelf'),
      name: `Shelf ${i + 1}`,
      width: internalWidth,
      height: tol.carcassThickness,
      thickness: sideDepth,
      quantity: 1,
      material: '18mm MDF',
      position: [0, shelfY, -(tol.backInset / 2)],
      rotation: [0, 0, 0],
      group: 'shelf',
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
  numberOfDrawers: number
): ComponentPiece[] {
  const pieces: ComponentPiece[] = [];

  if (numberOfDrawers <= 0) return pieces;

  const halfWidth = dim.width / 2;
  const halfHeight = dim.height / 2;

  // Available internal height between top and bottom carcass panels
  const internalHeight = dim.height - 2 * tol.carcassThickness;

  // Height slot per drawer
  const slotHeight = internalHeight / numberOfDrawers;

  // ── DRAWER FRONT DIMENSIONS ─────────────────────────────────
  const drawerFrontWidth = dim.width - 2 * tol.doorGap;
  const drawerFrontHeight = slotHeight - tol.drawerFrontGap;

  // ── DRAWER BOX DIMENSIONS ──────────────────────────────────
  // Safety clearance of 50mm behind the drawer for back panel space
  const drawerBoxSideDepth = dim.depth - tol.backPanelThickness - 50;
  const drawerBoxSideHeight = drawerFrontHeight - 40;

  // Front & back of drawer box: fits between sides minus runner clearance
  const drawerBoxFrontBackWidth =
    dim.width -
    2 * tol.carcassThickness -
    2 * tol.runnerClearance -
    2 * tol.drawerBoxThickness;

  // Drawer bottom: fits inside groove in the box (8mm up from bottom of sides)
  const drawerBottomWidth = drawerBoxFrontBackWidth;
  const drawerBottomDepth = drawerBoxSideDepth - 2 * tol.drawerBoxThickness;

  // Full drawer box outer width (for centering)
  const drawerBoxOuterWidth =
    dim.width - 2 * tol.carcassThickness - 2 * tol.runnerClearance;

  for (let i = 0; i < numberOfDrawers; i++) {
    // Y center of this drawer's slot (bottom-up stacking)
    const slotCenterY =
      -halfHeight + tol.carcassThickness + slotHeight * i + slotHeight / 2;

    // ── DRAWER FRONT ────────────────────────────────────────
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
    // Sits in an 8mm groove, resting 8mm up from the bottom of the side walls
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

    case 'drawer_box':
      // Pull drawer boxes forward along Z
      return [0, 0, spread * 1.2];

    case 'drawer_bottom':
      // Pull drawer bottoms forward, slightly less than box sides
      return [0, 0, spread * 1.2];

    default:
      return [0, 0, 0];
  }
}
