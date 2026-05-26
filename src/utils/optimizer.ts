export interface Part {
  id: string;
  length: number;
  quantity: number;
  label?: string;
}

export interface Scrap {
  id: string;
  length: number;
  quantity: number;
  label?: string;
}

export interface StockSettings {
  stockLength: number;
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
  isScrap?: boolean;
}

export interface BoardLayout {
  id: string;
  type: "scrap" | "stock";
  originalLength: number;
  cuts: CutItem[];
  usedLength: number; // Sum of (cut.length + kerf)
  waste: number;      // originalLength - usedLength
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
}

/**
 * 1D Bin Packing Optimization Engine (First-Fit Decreasing with Scraps Prioritization)
 */
export function optimizeCutlist(
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
  // We sort scraps from smallest to largest to apply a Best-Fit approach for scraps,
  // preventing a small part from consuming a huge scrap if a smaller scrap could fit it.
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

  // Helper to check if a part can fit in a remaining space
  // We need part.length + kerf.
  // Note: For the last cut on a board, does it require kerf? 
  // Following requirements: "deducting its length plus the Blade Kerf from the remaining space of the current active board"
  const canFit = (partLength: number, remainingSpace: number) => {
    return partLength + bladeKerf <= remainingSpace || partLength === remainingSpace; 
    // allow exact fit without kerf if it matches perfectly, otherwise include kerf
  };

  // Iterate through required parts
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

    // 2. Try to allocate a NEW scrap board from available scraps
    // We search the sorted scraps (smallest to largest) to find the first one that fits
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
        cuts: [
          {
            partId: part.id,
            label: part.label || scrap.label || `Scrap Offcut`,
            length: part.length,
            isScrap: true,
          },
        ],
        usedLength: part.length + bladeKerf,
        waste: scrap.length - (part.length + bladeKerf),
      };
      
      // Fix waste if it went negative due to rounding (should not happen due to check)
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
        cuts: [
          {
            partId: part.id,
            label: part.label,
            length: part.length,
          },
        ],
        usedLength: part.length + bladeKerf,
        waste: stockLength - (part.length + bladeKerf),
      };
      
      if (newBoard.waste < 0) newBoard.waste = 0;
      
      boards.push(newBoard);
      placed = true;
    } else {
      // The part is longer than a stock board and couldn't fit in any scrap
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

  // Adjust usedLength and waste for the visual manifest
  // If the last cut on a board was allocated with kerf, let's keep it consistent
  // but recalculate actual material metrics.
  // Let's compute total material original length and total cut length.
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
  };
}
