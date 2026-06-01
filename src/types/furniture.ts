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

// Hardware and material options
export type ShelfBaseOption = 'router_slots' | 'solid_12mm_biscuits';
export type BackFitOption = 'nailed' | 'dado_joint';

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
export type FurnitureType =
  | 'wardrobe'
  | 'chest_of_drawers'
  | 'kitchen_unit'
  | 'media_lowboard'
  | 'storage_platform_bed'
  | 'l_shaped_office_desk'
  | 'alcove_unit'
  | 'wall_hung_vanity'
  | 'slimline_storage_tower'
  | 'boot_bench'
  | 'broom_cupboard'
  | 'scribe_filler_panel'
  | 'corner_post';

export type DoorStyle = 'overlay' | 'inset';

/** Material classification for filtering and export */
export type MaterialType =
  | '18mm MDF'
  | '6mm Ply'
  | '12mm Drawer Box'
  | 'All Parts';

/** Kitchen unit families used by the UK registry */
export type KitchenUnitFamily =
  | 'base'
  | 'drawer_line'
  | 'corner_base'
  | 'wall'
  | 'tall'
  | 'appliance_base'
  | 'bridge_wall'
  | 'open_wall';

/** Manufacturing panel output used by the kitchen registry pipeline */
export interface ManufacturingPanel {
  panelId: string;
  parentUnitCode: string;
  label: string;
  cutLength: number;
  cutWidth: number;
  materialType: 'carcass_core' | 'back_ply' | 'front_face';
  exposedBandedEdges: [boolean, boolean, boolean, boolean];
}

/** Kitchen unit registry entry */
export interface KitchenUnitSpec {
  code: string;
  name: string;
  family: KitchenUnitFamily;
  width: number;
  height: number;
  depth: number;
  frontLayout: Array<
    | { kind: 'door'; label: string; height: number; quantity: 1 | 2; paired?: boolean }
    | { kind: 'drawer_front'; label: string; height: number; quantity: number }
    | { kind: 'blank'; label: string; height: number; quantity: 1 }
  >;
  usesTopStretchers: boolean;
  serviceVoid?: number;
  includeBottomPanel?: boolean;
  includeTopPanel?: boolean;
  includeBackPanel?: boolean;
  frontStretcherDepth?: number;
  rearStretcherDepth?: number;
  shelfCount?: number;
  shelfPositions?: number[];
  shelfDepthReduction?: number;
  shelfFrontSetback?: number;
  shelfSideClipClearance?: number;
  notes?: string;
}



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
  group: 'side' | 'top_bottom' | 'back' | 'shelf' | 'drawer_front' | 'drawer_box' | 'drawer_bottom' | 'door' | 'bore_marker';
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
  hasDoors: boolean;
  shelfPositions?: number[];
  drawerHeights?: number[];
  // New options
  shelfBase: ShelfBaseOption;
  backFit: BackFitOption;
  kitchenUnitCode?: string;
  doorStyle: DoorStyle;
  showLineBoring: boolean;
  useFaceFrame: boolean;
  
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
  kitchen_unit: { width: 600, height: 720, depth: 560 },
  media_lowboard: { width: 1600, height: 500, depth: 450 },
  storage_platform_bed: { width: 1500, height: 450, depth: 2000 },
  l_shaped_office_desk: { width: 1600, height: 750, depth: 1400 },
  alcove_unit: { width: 900, height: 2200, depth: 560 },
  wall_hung_vanity: { width: 800, height: 500, depth: 450 },
  slimline_storage_tower: { width: 450, height: 2150, depth: 300 },
  boot_bench: { width: 1200, height: 500, depth: 550 },
  broom_cupboard: { width: 900, height: 2150, depth: 600 },
  scribe_filler_panel: { width: 80, height: 2200, depth: 18 },
  corner_post: { width: 90, height: 2200, depth: 90 },
};

/** Default full config */
export const DEFAULT_CONFIG: FurnitureConfig = {
  type: 'wardrobe',
  dimensions: { ...DEFAULT_DIMENSIONS.wardrobe },
  tolerances: { ...DEFAULT_TOLERANCES },
  numberOfDrawers: 4,
  numberOfShelves: 2,
  hasDoors: false,
  shelfPositions: [],
  drawerHeights: [],
  // Defaults for new options
  shelfBase: 'router_slots',
  backFit: 'nailed',
  doorStyle: 'overlay',
  showLineBoring: true,
  useFaceFrame: false,
};

/** Default view settings */
export const DEFAULT_VIEW_SETTINGS: ViewSettings = {
  wireframe: false,
  explodedFactor: 0,
  activeFilter: 'All Parts',
};
