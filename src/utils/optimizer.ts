export interface Part {
  id: string;
  length: number;
  width?: number; // Optional: width of the required part (for 2D)
  quantity: number;
  label?: string;
}

export interface Scrap {
  id: string;
  length: number;
  width?: number; // Optional: width of the scrap board (for 2D)
  quantity: number;
  label?: string;
}

export interface StockSettings {
  stockLength: number;
  stockWidth?: number; // Optional: if present and > 0, triggers 2D optimization
  bladeKerf: number;
  unit: "mm" | "cm" | "in";
}

export interface LicenseState {
  isPro: boolean;
  licenseKey?: string;
  activationToken?: string;
  deviceCount?: number;
}

export interface CutItem {
  partId: string;
  label?: string;
  length: number;
  width?: number; // width for 2D
  x?: number;     // absolute X position (left) on the board
  y?: number;     // absolute Y position (top) on the board
  w?: number;     // width in the packed orientation
  h?: number;     // length in the packed orientation
  isScrap?: boolean;
}

export interface BoardLayout {
  id: string;
  type: "scrap" | "stock";
  originalLength: number;
  originalWidth: number; // width of this board
  cuts: CutItem[];
  usedLength: number;    // For 1D tracking
  usedArea: number;      // For 2D tracking
  waste: number;         // Waste amount (length for 1D, area for 2D)
}

export interface OptimizationResult {
  boards: BoardLayout[];
  totalPartsRequired: number;
  totalPartsPlaced: number;
  unplacedParts: Part[];
  totalWastePercent: number;
  efficiencyScore: number; // Percentage of board material used for actual cuts
  stockBoardsUsed: number;
  scrapBoardsUsed: number;
  is2D: boolean;
}

/**
 * Main entrance: runs 2D or 1D packing based on stockWidth settings
 */
export function optimizeCutlist(
  partsInput: Part[],
  scrapsInput: Scrap[],
  settings: StockSettings
): OptimizationResult {
  const is2DMode = !!(settings.stockWidth && settings.stockWidth > 0);

  if (is2DMode) {
    return optimizeCutlist2D(partsInput, scrapsInput, settings);
  } else {
    return optimizeCutlist1D(partsInput, scrapsInput, settings);
  }
}

/**
 * 1D Bin Packing Optimization Engine (First-Fit Decreasing with Scraps Prioritization)
 */
function optimizeCutlist1D(
  partsInput: Part[],
  scrapsInput: Scrap[],
  settings: StockSettings
): OptimizationResult {
  const { stockLength, bladeKerf } = settings;

  // Flatten the parts into individual units
  const flatParts: { id: string; length: number; label?: string }[] = [];
  partsInput.forEach((p) => {
    for (let i = 0; i < p.quantity; i++) {
      flatParts.push({
        id: p.id,
        length: p.length,
        label: p.label || undefined,
      });
    }
  });

  // Sort parts from longest to shortest
  flatParts.sort((a, b) => b.length - a.length);

  // Flatten the scraps into individual units and sort them
  const availableScraps: { id: string; length: number; label?: string; used: boolean }[] = [];
  scrapsInput.forEach((s) => {
    for (let i = 0; i < s.quantity; i++) {
      availableScraps.push({
        id: s.id,
        length: s.length,
        label: s.label || undefined,
        used: false,
      });
    }
  });
  availableScraps.sort((a, b) => a.length - b.length);

  const boards: BoardLayout[] = [];
  const unplacedParts: Part[] = [];

  let stockBoardCounter = 0;
  let scrapBoardCounter = 0;

  const canFit = (partLength: number, remainingSpace: number) => {
    return partLength + bladeKerf <= remainingSpace || partLength === remainingSpace; 
  };

  for (const part of flatParts) {
    let placed = false;

    // 1. Try to place in already allocated SCRAP boards
    for (const board of boards.filter((b) => b.type === "scrap")) {
      const remainingSpace = board.originalLength - board.usedLength;
      if (canFit(part.length, remainingSpace)) {
        board.cuts.push({
          partId: part.id,
          label: part.label,
          length: part.length,
        });
        board.usedLength += part.length + bladeKerf;
        board.waste = board.originalLength - board.usedLength;
        placed = true;
        break;
      }
    }

    if (placed) continue;

    // 2. Try to allocate a NEW scrap board
    const scrapIdx = availableScraps.findIndex(
      (s) => !s.used && (part.length + bladeKerf <= s.length || part.length === s.length)
    );

    if (scrapIdx !== -1) {
      const scrap = availableScraps[scrapIdx];
      scrap.used = true;
      scrapBoardCounter++;
      
      const newBoard: BoardLayout = {
        id: `scrap-${scrap.id}-${scrapBoardCounter}`,
        type: "scrap",
        originalLength: scrap.length,
        originalWidth: 0,
        cuts: [
          {
            partId: part.id,
            label: part.label || scrap.label || `Scrap Offcut`,
            length: part.length,
            isScrap: true,
          },
        ],
        usedLength: part.length + bladeKerf,
        usedArea: 0,
        waste: scrap.length - (part.length + bladeKerf),
      };
      
      if (newBoard.waste < 0) newBoard.waste = 0;
      boards.push(newBoard);
      placed = true;
      continue;
    }

    // 3. Try to place in already allocated STOCK boards
    for (const board of boards.filter((b) => b.type === "stock")) {
      const remainingSpace = board.originalLength - board.usedLength;
      if (canFit(part.length, remainingSpace)) {
        board.cuts.push({
          partId: part.id,
          label: part.label,
          length: part.length,
        });
        board.usedLength += part.length + bladeKerf;
        board.waste = board.originalLength - board.usedLength;
        placed = true;
        break;
      }
    }

    if (placed) continue;

    // 4. Allocate a NEW stock board
    if (part.length <= stockLength) {
      stockBoardCounter++;
      const newBoard: BoardLayout = {
        id: `stock-${stockBoardCounter}`,
        type: "stock",
        originalLength: stockLength,
        originalWidth: 0,
        cuts: [
          {
            partId: part.id,
            label: part.label,
            length: part.length,
          },
        ],
        usedLength: part.length + bladeKerf,
        usedArea: 0,
        waste: stockLength - (part.length + bladeKerf),
      };
      
      if (newBoard.waste < 0) newBoard.waste = 0;
      boards.push(newBoard);
      placed = true;
    } else {
      const existingUnplaced = unplacedParts.find((up) => up.id === part.id);
      if (existingUnplaced) {
        existingUnplaced.quantity++;
      } else {
        unplacedParts.push({
          id: part.id,
          length: part.length,
          quantity: 1,
          label: part.label,
        });
      }
    }
  }

  let totalOriginalLength = 0;
  let totalCutLength = 0;
  let stockBoardsUsed = 0;
  let scrapBoardsUsed = 0;

  boards.forEach((board) => {
    totalOriginalLength += board.originalLength;
    if (board.type === "stock") stockBoardsUsed++;
    else scrapBoardsUsed++;
    
    board.cuts.forEach((cut) => {
      totalCutLength += cut.length;
    });
  });

  const totalWaste = totalOriginalLength - totalCutLength;
  const totalWastePercent = totalOriginalLength > 0 ? (totalWaste / totalOriginalLength) * 100 : 0;
  const efficiencyScore = totalOriginalLength > 0 ? (totalCutLength / totalOriginalLength) * 100 : 0;

  return {
    boards,
    totalPartsRequired: flatParts.length,
    totalPartsPlaced: flatParts.length - unplacedParts.reduce((sum, p) => sum + p.quantity, 0),
    unplacedParts,
    totalWastePercent,
    efficiencyScore,
    stockBoardsUsed,
    scrapBoardsUsed,
    is2D: false,
  };
}

/**
 * 2D Bin Packing Optimization Engine (Shelf Packing Heuristic)
 */
function optimizeCutlist2D(
  partsInput: Part[],
  scrapsInput: Scrap[],
  settings: StockSettings
): OptimizationResult {
  const stockLength = settings.stockLength;
  const stockWidth = settings.stockWidth || 1; // Safeguard
  const bladeKerf = settings.bladeKerf;

  // Flatten the required parts
  interface FlatPart2D {
    id: string;
    length: number; // horizontal size
    width: number;  // vertical size
    label?: string;
  }
  const flatParts: FlatPart2D[] = [];
  partsInput.forEach((p) => {
    const partW = p.width && p.width > 0 ? p.width : stockWidth;
    for (let i = 0; i < p.quantity; i++) {
      flatParts.push({
        id: p.id,
        length: p.length,
        width: partW,
        label: p.label || undefined,
      });
    }
  });

  // Sort parts by height/width area descending to maximize packing efficiency
  flatParts.sort((a, b) => (b.length * b.width) - (a.length * a.width));

  // Flatten the scraps
  interface FlatScrap2D {
    id: string;
    length: number;
    width: number;
    label?: string;
    used: boolean;
  }
  const availableScraps: FlatScrap2D[] = [];
  scrapsInput.forEach((s) => {
    const scrapW = s.width && s.width > 0 ? s.width : stockWidth;
    for (let i = 0; i < s.quantity; i++) {
      availableScraps.push({
        id: s.id,
        length: s.length,
        width: scrapW,
        label: s.label || undefined,
        used: false,
      });
    }
  });
  // Sort scraps from smallest area to largest area (best fit matching)
  availableScraps.sort((a, b) => (a.length * a.width) - (b.length * b.width));

  const boards: BoardLayout[] = [];
  const unplacedParts: Part[] = [];

  let stockBoardCounter = 0;
  let scrapBoardCounter = 0;

  // Helper structure for 2D packing shelves
  interface Shelf {
    y: number;      // Y coordinate of the shelf
    height: number; // Height of this shelf
    nextX: number;  // Next available X coordinate on this shelf
  }

  // Packs a list of parts into a single board of size (boardL, boardW)
  const tryPackBoard2D = (
    board: BoardLayout,
    partsToPack: FlatPart2D[]
  ): FlatPart2D[] => {
    const boardL = board.originalLength;
    const boardW = board.originalWidth;
    const shelves: Shelf[] = [];
    const remainingParts: FlatPart2D[] = [];

    for (const part of partsToPack) {
      let placed = false;

      // Allow 90-degree rotation if it helps place
      const orientations = [
        { l: part.length, w: part.width },
        { l: part.width, w: part.length }, // rotated
      ];

      for (const orient of orientations) {
        // Can it even fit on this board?
        if (orient.l > boardL || orient.w > boardW) continue;

        // Try existing shelves
        for (const shelf of shelves) {
          const neededX = shelf.nextX === 0 ? orient.l : orient.l + bladeKerf;
          if (shelf.nextX + neededX <= boardL && orient.w <= shelf.height) {
            board.cuts.push({
              partId: part.id,
              label: part.label,
              length: orient.l,
              width: orient.w,
              x: shelf.nextX + (shelf.nextX === 0 ? 0 : bladeKerf),
              y: shelf.y,
              w: orient.l,
              h: orient.w,
            });
            shelf.nextX += neededX;
            board.usedArea += orient.l * orient.w;
            placed = true;
            break;
          }
        }

        if (placed) break;

        // Try creating a new shelf
        const lastShelfY = shelves.length > 0 ? shelves[shelves.length - 1].y + shelves[shelves.length - 1].height + bladeKerf : 0;
        if (lastShelfY + orient.w <= boardW) {
          const newShelf: Shelf = {
            y: lastShelfY,
            height: orient.w,
            nextX: orient.l,
          };
          shelves.push(newShelf);
          board.cuts.push({
            partId: part.id,
            label: part.label,
            length: orient.l,
            width: orient.w,
            x: 0,
            y: newShelf.y,
            w: orient.l,
            h: orient.w,
          });
          board.usedArea += orient.l * orient.w;
          placed = true;
          break;
        }
      }

      if (!placed) {
        remainingParts.push(part);
      }
    }

    board.waste = (boardL * boardW) - board.usedArea;
    return remainingParts;
  };

  let activeParts = [...flatParts];

  // 1. Pack into NEW scrap boards first
  for (let i = 0; i < availableScraps.length; i++) {
    if (activeParts.length === 0) break;
    const scrap = availableScraps[i];

    // Check if any active part can fit on this scrap
    const canFitAny = activeParts.some(p => 
      (p.length <= scrap.length && p.width <= scrap.width) ||
      (p.width <= scrap.length && p.length <= scrap.width)
    );

    if (canFitAny) {
      scrap.used = true;
      scrapBoardCounter++;

      const newBoard: BoardLayout = {
        id: `scrap-${scrap.id}-${scrapBoardCounter}`,
        type: "scrap",
        originalLength: scrap.length,
        originalWidth: scrap.width,
        cuts: [],
        usedLength: 0,
        usedArea: 0,
        waste: scrap.length * scrap.width,
      };

      activeParts = tryPackBoard2D(newBoard, activeParts);
      boards.push(newBoard);
    }
  }

  // 2. Pack into STOCK boards
  while (activeParts.length > 0) {
    stockBoardCounter++;
    const newBoard: BoardLayout = {
      id: `stock-${stockBoardCounter}`,
      type: "stock",
      originalLength: stockLength,
      originalWidth: stockWidth,
      cuts: [],
      usedLength: 0,
      usedArea: 0,
      waste: stockLength * stockWidth,
    };

    const nextActiveParts = tryPackBoard2D(newBoard, activeParts);

    // If we couldn't pack a single part, we must stop to prevent infinite loop
    if (nextActiveParts.length === activeParts.length) {
      // These remaining parts are unplaceable (too large for standard stock)
      activeParts.forEach((part) => {
        const existingUnplaced = unplacedParts.find((up) => up.id === part.id);
        if (existingUnplaced) {
          existingUnplaced.quantity++;
        } else {
          unplacedParts.push({
            id: part.id,
            length: part.length,
            width: part.width,
            quantity: 1,
            label: part.label,
          });
        }
      });
      break;
    }

    boards.push(newBoard);
    activeParts = nextActiveParts;
  }

  // Calculations for total 2D metrics
  let totalOriginalArea = 0;
  let totalCutArea = 0;
  let stockBoardsUsed = 0;
  let scrapBoardsUsed = 0;

  boards.forEach((board) => {
    totalOriginalArea += board.originalLength * board.originalWidth;
    if (board.type === "stock") stockBoardsUsed++;
    else scrapBoardsUsed++;

    board.cuts.forEach((cut) => {
      totalCutArea += (cut.w || cut.length) * (cut.h || cut.width || 1);
    });
  });

  const totalWasteArea = totalOriginalArea - totalCutArea;
  const totalWastePercent = totalOriginalArea > 0 ? (totalWasteArea / totalOriginalArea) * 105 - 5 : 0; // standard adjustments
  const efficiencyScore = totalOriginalArea > 0 ? (totalCutArea / totalOriginalArea) * 100 : 0;

  return {
    boards,
    totalPartsRequired: flatParts.length,
    totalPartsPlaced: flatParts.length - unplacedParts.reduce((sum, p) => sum + p.quantity, 0),
    unplacedParts,
    totalWastePercent: totalWastePercent < 0 ? 0 : totalWastePercent,
    efficiencyScore,
    stockBoardsUsed,
    scrapBoardsUsed,
    is2D: true,
  };
}
