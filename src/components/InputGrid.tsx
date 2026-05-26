"use client";

import React, { useState } from "react";
import { 
  Settings, 
  Terminal, 
  Grid, 
  Trash2, 
  Plus, 
  Layers, 
  ChevronRight, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { Part, Scrap, StockSettings } from "@/utils/optimizer";

// ==========================================
// 1. MATERIAL PROFILE PANEL
// ==========================================
interface MaterialProfilePanelProps {
  settings: StockSettings;
  setSettings: (s: StockSettings) => void;
}

export function MaterialProfilePanel({ settings, setSettings }: MaterialProfilePanelProps) {
  const handleUnitChange = (unit: "mm" | "cm" | "in") => {
    let stockLength = settings.stockLength;
    let bladeKerf = settings.bladeKerf;
    let stockWidth = settings.stockWidth;

    if (settings.unit === "mm" && unit === "cm") {
      stockLength = stockLength / 10;
      bladeKerf = bladeKerf / 10;
      if (stockWidth) stockWidth = stockWidth / 10;
    } else if (settings.unit === "mm" && unit === "in") {
      stockLength = Math.round(stockLength / 25.4);
      bladeKerf = parseFloat((bladeKerf / 25.4).toFixed(3));
      if (stockWidth) stockWidth = Math.round(stockWidth / 25.4);
    } else if (settings.unit === "cm" && unit === "mm") {
      stockLength = stockLength * 10;
      bladeKerf = bladeKerf * 10;
      if (stockWidth) stockWidth = stockWidth * 10;
    } else if (settings.unit === "cm" && unit === "in") {
      stockLength = Math.round(stockLength / 2.54);
      bladeKerf = parseFloat((bladeKerf / 2.54).toFixed(3));
      if (stockWidth) stockWidth = Math.round(stockWidth / 2.54);
    } else if (settings.unit === "in" && unit === "mm") {
      stockLength = Math.round(stockLength * 25.4);
      bladeKerf = Math.round(bladeKerf * 25.4);
      if (stockWidth) stockWidth = Math.round(stockWidth * 25.4);
    } else if (settings.unit === "in" && unit === "cm") {
      stockLength = parseFloat((stockLength * 2.54).toFixed(1));
      bladeKerf = parseFloat((bladeKerf * 2.54).toFixed(2));
      if (stockWidth) stockWidth = parseFloat((stockWidth * 2.54).toFixed(1));
    }

    setSettings({
      ...settings,
      unit,
      stockLength,
      bladeKerf,
      stockWidth,
    });
  };

  return (
    <div className="space-y-4">
      {/* Unit Selection */}
      <div>
        <label className="block text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Units System
        </label>
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800/80">
          {(["mm", "cm", "in"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => handleUnitChange(u)}
              className={`py-2 text-sm font-mono font-bold rounded-lg transition-all ${
                settings.unit === u
                  ? "bg-slate-800 text-white shadow-md border border-slate-700/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {u.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Numerical Configs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
        {/* Stock Length */}
        <div className="space-y-1.5">
          <label className="block min-h-[40px] text-sm font-semibold text-slate-400 uppercase tracking-wider leading-tight">
            Stock Length ({settings.unit})
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              value={settings.stockLength}
              onChange={(e) =>
                setSettings({ ...settings, stockLength: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-base text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        {/* Blade Kerf */}
        <div className="space-y-1.5">
          <label className="block min-h-[40px] text-sm font-semibold text-slate-400 uppercase tracking-wider leading-tight">
            Blade Kerf ({settings.unit})
          </label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={settings.bladeKerf}
            onChange={(e) =>
              setSettings({ ...settings, bladeKerf: parseFloat(e.target.value) || 0 })
            }
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-base text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          />
        </div>

        {/* Material Width */}
        <div className="space-y-1.5">
          <label className="block min-h-[40px] text-sm font-semibold text-slate-400 uppercase tracking-wider leading-tight">
            Material Width ({settings.unit}, optional)
          </label>
          <input
            type="number"
            min="0"
            placeholder="Leave empty for linear cuts"
            value={settings.stockWidth || ""}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setSettings({
                ...settings,
                stockWidth: isNaN(val) || val <= 0 ? undefined : val,
              });
            }}
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-2.5 text-base text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500/30 placeholder:text-slate-700"
          />
          <p className="text-[11px] text-slate-500 leading-tight min-h-[16px]">
            {settings.stockWidth && settings.stockWidth > 0 ? "2D sheet mode enabled" : "Blank = linear cuts"}
          </p>
        </div>
      </div>

      {/* Material Type & Thickness */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-900/60">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
            Material Type (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. MDF, Oak Plywood, Pine"
            value={settings.materialType || ""}
            onChange={(e) =>
              setSettings({ ...settings, materialType: e.target.value })
            }
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 placeholder:text-slate-700"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
            Thickness (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. 18mm, 3/4 inch"
            value={settings.thickness || ""}
            onChange={(e) =>
              setSettings({ ...settings, thickness: e.target.value })
            }
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/30 placeholder:text-slate-700"
          />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. QUICK PASTE CLI PANEL
// ==========================================
interface QuickPasteCLIProps {
  onParse: (parsed: { length: number; quantity: number; width?: number }[]) => void;
  is2DMode: boolean;
}

export function QuickPasteCLI({ onParse, is2DMode }: QuickPasteCLIProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleParse = () => {
    setError(null);
    if (!text.trim()) {
      setError("Please paste or type some data first.");
      return;
    }

    try {
      const results: { length: number; quantity: number; width?: number }[] = [];
      const lines = text.split(/[\n,;]+/);

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Check if there is an '@' symbol separating quantity
        const atParts = line.split(/\s*@\s*/);
        if (atParts.length === 2) {
          const qty = Math.round(parseFloat(atParts[1]));
          const dims = atParts[0].split(/\s*[xX*]\s*/);
          if (dims.length === 2 && !isNaN(qty)) {
            const p1 = parseFloat(dims[0]);
            const p2 = parseFloat(dims[1]);
            if (!isNaN(p1) && !isNaN(p2)) {
              results.push({ length: p1, width: p2, quantity: qty });
              continue;
            }
          } else if (dims.length === 1 && !isNaN(qty)) {
            const len = parseFloat(dims[0]);
            if (!isNaN(len)) {
              results.push({ length: len, quantity: qty });
              continue;
            }
          }
        }

        // Otherwise split by standard delimiters (x, X, *)
        const parts = line.split(/\s*[xX*]\s*/);
        if (parts.length === 3) {
          // Format: 4x1100x820 or 1100x820x4
          const p1 = parseFloat(parts[0]);
          const p2 = parseFloat(parts[1]);
          const p3 = parseFloat(parts[2]);
          if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
            let qty = 1;
            let len = p1;
            let wid = p2;
            
            // Heuristic to extract quantity: check if one of the outer parts is small and integer
            if (p1 < 30 && Number.isInteger(p1) && (p2 >= 30 || p3 >= 30)) {
              qty = Math.round(p1);
              len = p2;
              wid = p3;
            } else if (p3 < 30 && Number.isInteger(p3) && (p1 >= 30 || p2 >= 30)) {
              qty = Math.round(p3);
              len = p1;
              wid = p2;
            } else {
              qty = Math.round(p1);
              len = p2;
              wid = p3;
            }
            results.push({ length: len, width: wid, quantity: qty });
          }
        } else if (parts.length === 2) {
          // Format: 4x1100 or 1100x820
          const p1 = parseFloat(parts[0]);
          const p2 = parseFloat(parts[1]);
          if (!isNaN(p1) && !isNaN(p2)) {
            if (is2DMode && p1 >= 30 && p2 >= 30) {
              // In 2D mode, if both are medium/large numbers, treat as length x width (qty = 1)
              results.push({ length: p1, width: p2, quantity: 1 });
            } else {
              // Treat as quantity x length
              let qty = Math.round(p1);
              let len = p2;
              if (p1 > p2 && Number.isInteger(p2)) {
                qty = Math.round(p2);
                len = p1;
              }
              results.push({ length: len, quantity: qty });
            }
          }
        } else {
          const num = parseFloat(line);
          if (!isNaN(num)) {
            results.push({ length: num, quantity: 1 });
          }
        }
      }

      if (results.length === 0) {
        setError(
          is2DMode
            ? "Could not parse any valid cuts. Try: '4x1100x820' or '1100x820 @ 4'"
            : "Could not parse any valid cuts. Try: '4x1100' or '850 @ 3'"
        );
        return;
      }

      onParse(results);
      setText("");
      setIsExpanded(false);
    } catch (e) {
      setError("Error parsing list. Please verify the format.");
    }
  };

  return (
    <div className="pt-3 mt-3 border-t border-slate-800/60">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-200 uppercase tracking-wider transition-colors focus:outline-none cursor-pointer py-1"
      >
        <div className="flex items-center gap-2">
          <Terminal size={14} />
          <span>Quick Paste Import</span>
        </div>
        <ChevronRight size={14} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
      </button>

      {isExpanded && (
        <div className="space-y-3 mt-3">
          <p className="text-xs text-slate-500">Paste a list from a message, email, or spreadsheet to bulk-add parts.</p>
          <div className="relative">
            <textarea
              placeholder={
                is2DMode
                  ? "e.g. 4x1100x820, 6x850x600, or 1100x820 @ 4"
                  : "e.g. 4x1100, 6x850, 3x400"
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full min-h-[80px] bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl p-3 text-sm text-slate-300 font-mono placeholder:text-slate-650 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 resize-none"
            />
            {error && (
              <p className="absolute bottom-2.5 left-2.5 text-xs text-rose-400 flex items-center gap-1.5 bg-rose-950/90 px-2.5 py-1 rounded border border-rose-900/55 font-sans">
                <AlertCircle size={12} />
                {error}
              </p>
            )}
          </div>

          <button
            onClick={handleParse}
            className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700/60 rounded-xl text-sm font-bold text-white tracking-wide uppercase transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Parse &amp; Add Parts</span>
            <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. DYNAMIC PART MATRIX PANEL (SPREADSHEET)
// ==========================================
interface PartMatrixProps {
  parts: Part[];
  setParts: (p: Part[]) => void;
  isPro: boolean;
  onUpgradeTrigger: () => void;
  settings: StockSettings;
}

export function PartMatrix({ parts, setParts, isPro, onUpgradeTrigger, settings }: PartMatrixProps) {
  const [newLen, setNewLen] = useState("");
  const [newWidth, setNewWidth] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newLabel, setNewLabel] = useState("");

  const is2DMode = !!(settings.stockWidth && settings.stockWidth > 0);

  const handleAddRow = () => {
    if (!newLen || parseFloat(newLen) <= 0) return;
    if (parseFloat(newQty) <= 0) return;

    if (!isPro && parts.length >= 5) {
      onUpgradeTrigger();
      return;
    }

    const partW = is2DMode 
      ? (parseFloat(newWidth) || settings.stockWidth || 0) 
      : undefined;

    const newPart: Part = {
      id: Math.random().toString(36).substr(2, 9),
      length: parseFloat(newLen),
      width: partW,
      quantity: parseInt(newQty) || 1,
      label: newLabel.trim() || undefined,
    };

    setParts([...parts, newPart]);
    setNewLen("");
    setNewWidth("");
    setNewQty("1");
    setNewLabel("");
  };

  const handleUpdateRow = (id: string, field: keyof Part, value: any) => {
    setParts(
      parts.map((p) => {
        if (p.id === id) {
          if (field === "length") return { ...p, length: parseFloat(value) || 0 };
          if (field === "width") return { ...p, width: value === "" ? undefined : parseFloat(value) || undefined };
          if (field === "quantity") return { ...p, quantity: parseInt(value) || 0 };
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  const handleDeleteRow = (id: string) => {
    setParts(parts.filter((p) => p.id !== id));
  };

  const handleClearAll = () => {
    setParts([]);
  };

  return (
    <div className="space-y-4 flex-1 flex flex-col min-h-0">
      {/* High-density grid header / inputs */}
      <div className="grid grid-cols-12 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 items-end">
        
        {is2DMode ? (
          <>
            <div className="col-span-3 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Label (Opt)
              </span>
              <input
                type="text"
                placeholder="Panel A"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                onKeyDown={(e) => e.key === "Enter" && handleAddRow()}
              />
            </div>
            <div className="col-span-3 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Length ({settings.unit})
              </span>
              <input
                type="number"
                placeholder="850"
                value={newLen}
                onChange={(e) => setNewLen(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50"
                onKeyDown={(e) => e.key === "Enter" && handleAddRow()}
              />
            </div>
            <div className="col-span-3 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Width ({settings.unit})
              </span>
              <input
                type="number"
                placeholder={String(settings.stockWidth || "")}
                value={newWidth}
                onChange={(e) => setNewWidth(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50"
                onKeyDown={(e) => e.key === "Enter" && handleAddRow()}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Qty
              </span>
              <input
                type="number"
                min="1"
                placeholder="1"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50"
                onKeyDown={(e) => e.key === "Enter" && handleAddRow()}
              />
            </div>
            <button
              onClick={handleAddRow}
              className="col-span-1 py-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 rounded-lg text-sm font-bold text-slate-950 flex items-center justify-center transition-colors h-9 cursor-pointer"
            >
              <Plus size={18} />
            </button>
          </>
        ) : (
          <>
            <div className="col-span-4 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Length ({settings.unit})
              </span>
              <input
                type="number"
                placeholder="e.g. 850"
                value={newLen}
                onChange={(e) => setNewLen(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50"
                onKeyDown={(e) => e.key === "Enter" && handleAddRow()}
              />
            </div>
            <div className="col-span-3 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Quantity
              </span>
              <input
                type="number"
                min="1"
                placeholder="1"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50"
                onKeyDown={(e) => e.key === "Enter" && handleAddRow()}
              />
            </div>
            <div className="col-span-3 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Label (Opt)
              </span>
              <input
                type="text"
                placeholder="Shelf A"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                onKeyDown={(e) => e.key === "Enter" && handleAddRow()}
              />
            </div>
            <button
              onClick={handleAddRow}
              className="col-span-2 py-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 rounded-lg text-sm font-bold text-slate-950 flex items-center justify-center transition-colors h-9 cursor-pointer"
            >
              <Plus size={18} />
            </button>
          </>
        )}

      </div>

      {/* Spreadsheet List */}
      <div className="flex-1 min-h-[200px] max-h-[350px] overflow-y-auto border border-slate-800/80 rounded-xl bg-slate-950/40">
        {parts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
            <Grid size={28} className="mb-2.5 opacity-30 text-slate-400" />
            <p className="text-sm font-semibold">No cut parts defined yet.</p>
            <p className="text-xs opacity-75 mt-0.5">Add rows above or paste list.</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-xs font-bold text-slate-400 uppercase tracking-wider sticky top-0">
                <th className="px-4 py-2.5">Label</th>
                <th className="px-4 py-2.5 w-28">Length ({settings.unit})</th>
                {is2DMode && <th className="px-4 py-2.5 w-28">Width ({settings.unit})</th>}
                <th className="px-4 py-2.5 w-24">Quantity</th>
                <th className="px-3 py-2.5 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm">
              {parts.map((part) => (
                <tr key={part.id} className="hover:bg-slate-900/30 group">
                  <td className="px-4 py-1.5">
                    <input
                      type="text"
                      value={part.label || ""}
                      onChange={(e) => handleUpdateRow(part.id, "label", e.target.value)}
                      placeholder="Unnamed Part"
                      className="bg-transparent border-b border-transparent focus:border-slate-800/80 text-white w-full px-0.5 py-0.5 focus:outline-none font-medium"
                    />
                  </td>
                  <td className="px-4 py-1.5">
                    <input
                      type="number"
                      value={part.length}
                      onChange={(e) => handleUpdateRow(part.id, "length", e.target.value)}
                      className="bg-transparent border-b border-transparent focus:border-slate-800/80 text-white font-mono w-full px-0.5 py-0.5 focus:outline-none font-semibold"
                    />
                  </td>
                  {is2DMode && (
                    <td className="px-4 py-1.5">
                      <input
                        type="number"
                        value={part.width ?? ""}
                        placeholder={String(settings.stockWidth || "")}
                        onChange={(e) => handleUpdateRow(part.id, "width", e.target.value)}
                        className="bg-transparent border-b border-transparent focus:border-slate-800/80 text-white font-mono w-full px-0.5 py-0.5 focus:outline-none font-semibold"
                      />
                    </td>
                  )}
                  <td className="px-4 py-1.5">
                    <input
                      type="number"
                      value={part.quantity}
                      onChange={(e) => handleUpdateRow(part.id, "quantity", e.target.value)}
                      className="bg-transparent border-b border-transparent focus:border-slate-800/80 text-white font-mono w-full px-0.5 py-0.5 focus:outline-none font-semibold"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <button
                      onClick={() => handleDeleteRow(part.id)}
                      className="p-1.5 text-slate-600 hover:text-rose-400 rounded transition-colors focus:outline-none cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Free Tier Warning Banner */}
      {!isPro && (
        <div className="p-3.5 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400 shrink-0" />
            <p className="text-xs text-amber-300 font-medium">
              Free Tier: limit of 5 rows ({parts.length}/5 used). Upgrade for unlimited cuts.
            </p>
          </div>
          <button
            onClick={onUpgradeTrigger}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 uppercase tracking-wide focus:outline-none shrink-0 cursor-pointer"
          >
            Upgrade
          </button>
        </div>
      )}

      {parts.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleClearAll}
            className="text-xs font-bold text-slate-500 hover:text-rose-400 uppercase tracking-wider transition-colors focus:outline-none cursor-pointer"
          >
            Clear Matrix
          </button>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. THE SCRAP PILE PANEL
// ==========================================
interface ScrapPileProps {
  scraps: Scrap[];
  setScraps: (s: Scrap[]) => void;
  settings: StockSettings;
}

export function ScrapPile({ scraps, setScraps, settings }: ScrapPileProps) {
  const [newLen, setNewLen] = useState("");
  const [newWidth, setNewWidth] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newLabel, setNewLabel] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);

  const is2DMode = !!(settings.stockWidth && settings.stockWidth > 0);

  const handleAddScrap = () => {
    if (!newLen || parseFloat(newLen) <= 0) return;
    if (parseFloat(newQty) <= 0) return;

    const scrapW = is2DMode 
      ? (parseFloat(newWidth) || settings.stockWidth || 0) 
      : undefined;

    const newScrap: Scrap = {
      id: Math.random().toString(36).substr(2, 9),
      length: parseFloat(newLen),
      width: scrapW,
      quantity: parseInt(newQty) || 1,
      label: newLabel.trim() || undefined,
    };

    setScraps([...scraps, newScrap]);
    setNewLen("");
    setNewWidth("");
    setNewQty("1");
    setNewLabel("");
  };

  const handleDeleteScrap = (id: string) => {
    setScraps(scraps.filter((s) => s.id !== id));
  };

  const handleToggleActive = () => {
    setIsEnabled(!isEnabled);
  };

  return (
    <div className="space-y-4 flex-1 flex flex-col min-h-0">
      {/* Enable Toggle Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Scrap Optimization Engine
        </span>
        <button
          onClick={handleToggleActive}
          className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isEnabled ? "bg-emerald-500" : "bg-slate-800"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
              isEnabled ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {isEnabled && (
        <>
          {/* Quick Input Row */}
          <div className="grid grid-cols-12 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 items-end">
            {is2DMode ? (
              <>
                <div className="col-span-3 space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Offcut Len
                  </span>
                  <input
                    type="number"
                    placeholder="600"
                    value={newLen}
                    onChange={(e) => setNewLen(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50"
                    onKeyDown={(e) => e.key === "Enter" && handleAddScrap()}
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Offcut Width
                  </span>
                  <input
                    type="number"
                    placeholder={String(settings.stockWidth || "")}
                    value={newWidth}
                    onChange={(e) => setNewWidth(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50"
                    onKeyDown={(e) => e.key === "Enter" && handleAddScrap()}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Qty
                  </span>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50"
                    onKeyDown={(e) => e.key === "Enter" && handleAddScrap()}
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Label (Opt)
                  </span>
                  <input
                    type="text"
                    placeholder="Stud"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                    onKeyDown={(e) => e.key === "Enter" && handleAddScrap()}
                  />
                </div>
                <button
                  onClick={handleAddScrap}
                  className="col-span-1 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700/60 rounded-lg text-sm font-bold text-white flex items-center justify-center transition-colors h-9 cursor-pointer"
                >
                  <Plus size={18} />
                </button>
              </>
            ) : (
              <>
                <div className="col-span-4 space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Offcut Length
                  </span>
                  <input
                    type="number"
                    placeholder="600"
                    value={newLen}
                    onChange={(e) => setNewLen(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50"
                    onKeyDown={(e) => e.key === "Enter" && handleAddScrap()}
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Qty
                  </span>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50"
                    onKeyDown={(e) => e.key === "Enter" && handleAddScrap()}
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Label (Opt)
                  </span>
                  <input
                    type="text"
                    placeholder="Stud"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                    onKeyDown={(e) => e.key === "Enter" && handleAddScrap()}
                  />
                </div>
                <button
                  onClick={handleAddScrap}
                  className="col-span-2 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700/60 rounded-lg text-sm font-bold text-white flex items-center justify-center transition-colors h-9 cursor-pointer"
                >
                  <Plus size={18} />
                </button>
              </>
            )}
          </div>

          {/* Offcut List */}
          <div className="flex-1 min-h-[120px] overflow-y-auto border border-slate-800/80 rounded-xl bg-slate-950/40">
            {scraps.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 p-4 text-center">
                <Layers size={24} className="mb-2 opacity-30 text-slate-400" />
                <p className="text-sm font-semibold">Scrap pile is currently empty.</p>
                <p className="text-xs opacity-75 mt-0.5">Add leftover boards above to use them first.</p>
              </div>
            ) : (
              <div className="p-2.5 space-y-2">
                {scraps.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/50 rounded-lg px-3.5 py-2 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold text-amber-400 font-mono">
                        {s.quantity}x
                      </span>
                      <span className="text-sm font-semibold text-white font-mono">
                        {s.length}
                        {is2DMode ? ` × ${s.width ?? settings.stockWidth}` : ""}
                        {settings.unit}
                      </span>
                      {s.label && (
                        <span className="text-xs text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-850">
                          {s.label}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteScrap(s.id)}
                      className="p-1.5 text-slate-600 hover:text-rose-400 transition-colors focus:outline-none cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!isEnabled && (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl p-6 text-center text-slate-500">
          <AlertCircle size={24} className="mb-2 opacity-40" />
          <p className="text-sm font-semibold">Scrap Optimization is Disabled</p>
          <p className="text-xs opacity-70 max-w-xs mt-1">
            Toggle engine on if you want the algorithm to exhaust your scraps before cutting fresh stock.
          </p>
        </div>
      )}
    </div>
  );
}
