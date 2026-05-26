"use client";

import React, { useState, useMemo } from "react";
import { 
  Check, 
  Printer, 
  Sparkles, 
  Clipboard, 
  ListOrdered, 
  Volume2, 
  CheckCircle2,
  RefreshCw,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { BoardLayout, OptimizationResult, CutItem } from "@/utils/optimizer";

interface VisualCanvasProps {
  result: OptimizationResult;
  unit: string;
  partsList: { id: string; label?: string }[];
  bladeKerf: number;
}

// Generate consistent background color based on Part ID
const PART_COLORS = [
  "bg-indigo-600/80 hover:bg-indigo-600/90 text-indigo-100 border-indigo-500/30",
  "bg-violet-600/80 hover:bg-violet-600/90 text-violet-100 border-violet-500/30",
  "bg-sky-600/80 hover:bg-sky-600/90 text-sky-100 border-sky-500/30",
  "bg-amber-600/80 hover:bg-amber-600/90 text-amber-100 border-amber-500/30",
  "bg-rose-600/80 hover:bg-rose-600/90 text-rose-100 border-rose-500/30",
  "bg-cyan-600/80 hover:bg-cyan-600/90 text-cyan-100 border-cyan-500/30",
  "bg-fuchsia-600/80 hover:bg-fuchsia-600/90 text-fuchsia-100 border-fuchsia-500/30",
  "bg-orange-600/80 hover:bg-orange-600/90 text-orange-100 border-orange-500/30",
];

export function VisualCanvas({ result, unit, partsList, bladeKerf }: VisualCanvasProps) {
  // Map partId to color index
  const partColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    partsList.forEach((p, idx) => {
      map[p.id] = PART_COLORS[idx % PART_COLORS.length];
    });
    return map;
  }, [partsList]);

  // Swipe / Tap to check state: boardId_cutIndex -> boolean
  const [checkedCuts, setCheckedCuts] = useState<Record<string, boolean>>({});
  const [isSwipeMode, setIsSwipeMode] = useState(false);

  // Flattened cuts helper to find "what is the next active cut"
  const nextCutToExecute = useMemo(() => {
    for (const board of result.boards) {
      for (let cutIdx = 0; cutIdx < board.cuts.length; cutIdx++) {
        const key = `${board.id}_${cutIdx}`;
        if (!checkedCuts[key]) {
          return { boardId: board.id, cutIdx };
        }
      }
    }
    return null; // all cuts executed
  }, [result.boards, checkedCuts]);

  const handleToggleCut = (boardId: string, cutIdx: number) => {
    const key = `${boardId}_${cutIdx}`;
    setCheckedCuts((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

    // Simple feedback sound or animation trigger could go here
  };

  const handleResetCuts = () => {
    setCheckedCuts({});
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate Manifest Text (Markdown/Copy-paste ready)
  const manifestText = useMemo(() => {
    let text = `# ITS MY CUTLIST - WORKSHOP MANIFEST\n\n`;
    text += `Efficiency Score: ${result.efficiencyScore.toFixed(1)}% | Total Waste: ${result.totalWastePercent.toFixed(1)}%\n`;
    text += `Stock Boards Used: ${result.stockBoardsUsed} | Scrap Offcuts Used: ${result.scrapBoardsUsed}\n\n`;
    
    result.boards.forEach((board, bIdx) => {
      const typeLabel = board.type === "scrap" ? "Scrap Board" : "Stock Board";
      text += `### Board ${bIdx + 1} [${typeLabel} - ${board.originalLength}${unit}]\n`;
      const cutDetails = board.cuts.map((c, cIdx) => {
        const label = c.label ? ` (${c.label})` : "";
        return `Cut ${cIdx + 1}: ${c.length}${unit}${label}`;
      });
      text += `${cutDetails.join(", ")}\n`;
      text += `Leftover Waste/Offcut to save: ${board.waste.toFixed(1)}${unit}\n\n`;
    });
    
    if (result.unplacedParts.length > 0) {
      text += `### UNPLACED PARTS (Too long for standard stock):\n`;
      result.unplacedParts.forEach((p) => {
        const label = p.label ? ` (${p.label})` : "";
        text += `- ${p.quantity}x ${p.length}${unit}${label}\n`;
      });
    }

    return text;
  }, [result, unit]);

  const copyManifestToClipboard = () => {
    navigator.clipboard.writeText(manifestText);
    alert("Manifest copied to clipboard!");
  };

  return (
    <div className="space-y-6 flex-1 flex flex-col min-h-0">
      {/* ---------------------------------------------------- */}
      {/* ACTION HEADER FOR HERO VISUAL PANEL                  */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSwipeMode(!isSwipeMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all focus:outline-none flex items-center gap-1.5 ${
              isSwipeMode
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
            }`}
          >
            <CheckCircle2 size={13} />
            {isSwipeMode ? "Active Cut Mode: ON" : "Workshop Cut Mode"}
          </button>
          
          {Object.keys(checkedCuts).length > 0 && (
            <button
              onClick={handleResetCuts}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-all focus:outline-none"
              title="Reset Cut Checklist"
            >
              <RefreshCw size={13} />
            </button>
          )}
        </div>

        {/* Efficiency summary indicators */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Efficiency</span>
            <span className="text-emerald-400 font-bold text-sm">
              {result.efficiencyScore.toFixed(1)}%
            </span>
          </div>
          <div className="border-l border-slate-800 h-6"></div>
          <div className="text-right">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Waste</span>
            <span className="text-slate-400 font-bold text-sm">
              {result.totalWastePercent.toFixed(1)}%
            </span>
          </div>
          <div className="border-l border-slate-800 h-6"></div>
          <div className="text-right">
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Boards</span>
            <span className="text-white font-bold text-sm">
              {result.stockBoardsUsed} Stock / {result.scrapBoardsUsed} Scrap
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* LAYOUT BOARDS TRACK LIST                             */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[300px]">
        {result.boards.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 p-8 text-center border border-dashed border-slate-800 rounded-2xl">
            <HelpCircle size={36} className="mb-3 opacity-30 text-slate-400" />
            <p className="text-sm font-semibold text-slate-400">No output generated yet.</p>
            <p className="text-xs opacity-70 max-w-xs mt-1">
              Add some parts to the spreadsheet matrix on the left to compute your cutlist layout.
            </p>
          </div>
        ) : (
          result.boards.map((board, bIdx) => {
            const isScrap = board.type === "scrap";
            
            return (
              <div key={board.id} className="space-y-1.5">
                {/* Board Label Header */}
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">
                      #{bIdx + 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase ${
                      isScrap 
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                        : "bg-slate-800 text-slate-300"
                    }`}>
                      {isScrap ? "Scrap Offcut" : "Stock Board"}
                    </span>
                    <span className="text-slate-500 font-mono">
                      Size: {board.originalLength}{unit}
                    </span>
                  </div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    Waste: {board.waste.toFixed(1)}{unit} ({((board.waste / board.originalLength) * 100).toFixed(1)}%)
                  </div>
                </div>

                {/* VISUAL LAYOUT TRACK (1D PROGRESS BAR) */}
                <div className="relative h-10 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-900 flex items-stretch">
                  {board.cuts.map((cut, cutIdx) => {
                    const cutWidth = (cut.length / board.originalLength) * 100;
                    const isChecked = checkedCuts[`${board.id}_${cutIdx}`];
                    const isActive = nextCutToExecute && nextCutToExecute.boardId === board.id && nextCutToExecute.cutIdx === cutIdx;
                    
                    // Style determination
                    let bgStyle = isChecked 
                      ? "bg-emerald-500 text-emerald-950 border-emerald-400" 
                      : partColorMap[cut.partId] || "bg-slate-700 text-slate-100 border-slate-600";
                    
                    return (
                      <React.Fragment key={cutIdx}>
                        {/* Cut block */}
                        <div
                          style={{ width: `${cutWidth}%` }}
                          onClick={() => isSwipeMode && handleToggleCut(board.id, cutIdx)}
                          className={`relative border-r border-slate-950 flex flex-col justify-center px-2 select-none transition-all duration-300 group ${bgStyle} ${
                            isSwipeMode ? "cursor-pointer" : ""
                          } ${
                            isActive && isSwipeMode ? "ring-2 ring-amber-400 ring-inset animate-pulse font-extrabold z-10" : ""
                          }`}
                        >
                          <div className="text-[10px] font-bold tracking-tight truncate leading-none">
                            {cut.length}{unit}
                          </div>
                          {cut.label && (
                            <div className={`text-[8px] font-medium truncate leading-none mt-0.5 opacity-80 uppercase font-mono`}>
                              {cut.label}
                            </div>
                          )}

                          {/* Swipe overlay checklist symbol */}
                          {isChecked && (
                            <div className="absolute top-1 right-1 bg-slate-950/70 p-0.5 rounded-full text-emerald-400">
                              <Check size={8} strokeWidth={3} />
                            </div>
                          )}

                          {/* Highlight indicator overlay */}
                          {isActive && isSwipeMode && (
                            <span className="absolute top-0.5 left-1 text-[8px] font-mono text-amber-300 tracking-widest font-extrabold animate-bounce uppercase">
                              Next Cut
                            </span>
                          )}
                        </div>

                        {/* Thin Kerf cut indicator */}
                        {bladeKerf > 0 && (
                          <div
                            style={{ width: `${(bladeKerf / board.originalLength) * 100}%` }}
                            className="bg-slate-900 border-r border-slate-950 flex items-center justify-center shrink-0"
                            title={`Blade Kerf Cut (${bladeKerf}${unit})`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}

                  {/* WASTE BLOCK AT END */}
                  {board.waste > 0 && (
                    <div
                      style={{ width: `${(board.waste / board.originalLength) * 100}%` }}
                      className="bg-slate-900/60 border-l border-slate-900 flex flex-col justify-center items-end px-3 shrink-0 text-right text-slate-600 font-mono text-[9px]"
                    >
                      <span className="font-bold">Waste</span>
                      <span>{board.waste.toFixed(0)}{unit}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* UNPLACED PARTS LIST WARNING                          */}
      {/* ---------------------------------------------------- */}
      {result.unplacedParts.length > 0 && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <AlertCircle size={15} />
            <span>Unplaced Cuts (Exceeds board length)</span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {result.unplacedParts.map((p) => (
              <span key={p.id} className="bg-rose-950/60 border border-rose-900 text-rose-300 px-2.5 py-1 rounded-lg">
                {p.quantity}x {p.length}{unit} {p.label ? `(${p.label})` : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* BENTO BOX 6: MANIFEST ACTIONS & TEXTBOX              */}
      {/* ---------------------------------------------------- */}
      {result.boards.length > 0 && (
        <div className="border-t border-slate-800/80 pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListOrdered size={15} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Workshop Manifest &amp; Instructions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyManifestToClipboard}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-lg text-xs font-bold transition-all focus:outline-none flex items-center gap-1.5"
                title="Copy manifest to clipboard"
              >
                <Clipboard size={13} />
                Copy
              </button>
              <button
                onClick={handlePrint}
                className="p-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 rounded-lg text-xs font-bold transition-all focus:outline-none flex items-center gap-1.5"
                title="Print Layout / Generate PDF"
              >
                <Printer size={13} />
                Print PDF
              </button>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 max-h-[160px] overflow-y-auto">
            <pre className="text-[11px] text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
              {result.boards.map((board, bIdx) => {
                const cutsText = board.cuts.map(c => `${c.length}${unit}${c.label ? ` (${c.label})` : ""}`).join(", then cut ");
                return `Board ${bIdx + 1}: Cut ${cutsText}. Leftover offcut to save: ${board.waste.toFixed(1)}${unit}.\n`;
              }).join("")}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
