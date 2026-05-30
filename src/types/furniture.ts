// ─────────────────────────────────────────────────────────────
// PARAMETRIC FURNITURE MODELER — TYPE DEFINITIONS
// Zero-server, client-only architecture. All units in mm.
// ─────────────────────────────────────────────────────────────

/** Overall external dimensions of the furniture piece (mm) */
export interface FurnitureDimensions {
  width: number;
  height: number;
  depth: number;
}

/** Hardware & material tolerance values used by the math engine (mm) */
export interface GlobalTolerances {
  /** Thickness of carcass side/top/bottom panels */
  carcassThickness: number;
  /** Thickness of the recessed back panel */
  backPanelThickness: number;
  /** Clearance per side for drawer runner hardware */
  runnerClearance: number;
  /** Gap between door/drawer front and carcass edge */
  doorGap: number;
  /** Vertical gap between adjacent drawer fronts */
  drawerFrontGap: number;
  /** Inset distance for back panel rebate/groove */
  backInset: number;
  /** Wall thickness of drawer box sides/front/back */
  drawerBoxThickness: number;
}

/** Supported furniture archetypes */
export type FurnitureType = 'wardrobe' | 'chest_of_drawers';

/** Material classification for filtering and export */
export type MaterialType =
  | '18mm MDF'
  | '6mm Ply'
  | '12mm Drawer Box'
  | 'All Parts';

/** A single manufactured component with 3D placement data */
export interface ComponentPiece {
  /** Unique identifier */
  id: string;
  /** Human-readable name (e.g. "Left Side Panel") */
  name: string;
  /** Cut width of this piece (mm) */
  width: number;
  /** Cut height of this piece (mm) */
  height: number;
  /** Material thickness (mm) */
  thickness: number;
  /** Number of identical pieces required */
  quantity: number;
  /** Material classification tag */
  material: string;
  /** 3D center-point coordinates [x, y, z] in model space */
  position: [number, number, number];
  /** Euler rotation angles [rx, ry, rz] in radians */
  rotation: [number, number, number];
  /** Component group for exploded view direction control */
  group: 'side' | 'top_bottom' | 'back' | 'shelf' | 'drawer_front' | 'drawer_box' | 'drawer_bottom';
  /** Parent drawer index (if part of a drawer assembly) */
  drawerIndex?: number;
}

/** Full configuration state for a furniture piece */
export interface FurnitureConfig {
  type: FurnitureType;
  dimensions: FurnitureDimensions;
  tolerances: GlobalTolerances;
  numberOfDrawers: number;
  numberOfShelves: number;
}

/** View-layer settings for the 3D canvas */
export interface ViewSettings {
  wireframe: boolean;
  explodedFactor: number; // 0.0 (assembled) to 1.0 (fully exploded)
  activeFilter: MaterialType;
}

/** Default tolerance values — UK cabinetry standard */
export const DEFAULT_TOLERANCES: GlobalTolerances = {
  carcassThickness: 18,
  backPanelThickness: 6,
  runnerClearance: 13,
  doorGap: 2,
  drawerFrontGap: 3,
  backInset: 9,
  drawerBoxThickness: 12,
};

/** Default dimensions for each furniture type */
export const DEFAULT_DIMENSIONS: Record<FurnitureType, FurnitureDimensions> = {
  wardrobe: { width: 900, height: 1800, depth: 600 },
  chest_of_drawers: { width: 800, height: 800, depth: 450 },
};

/** Default full config */
export const DEFAULT_CONFIG: FurnitureConfig = {
  type: 'wardrobe',
  dimensions: { ...DEFAULT_DIMENSIONS.wardrobe },
  tolerances: { ...DEFAULT_TOLERANCES },
  numberOfDrawers: 4,
  numberOfShelves: 2,
};

/** Default view settings */
export const DEFAULT_VIEW_SETTINGS: ViewSettings = {
  wireframe: false,
  explodedFactor: 0,
  activeFilter: 'All Parts',
};
