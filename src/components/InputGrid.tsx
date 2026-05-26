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
  const [materialWidth, setMaterialWidth] = useState<string>("50");

  const handleUnitChange = (unit: "mm" | "cm" | "in") => {
    // Automatically scale values roughly when units change for good UX
    let stockLength = settings.stockLength;
    let bladeKerf = settings.bladeKerf;

    if (settings.unit === "mm" && unit === "cm") {
      stockLength = stockLength / 10;
      bladeKerf = bladeKerf / 10;
    } else if (settings.unit === "mm" && unit === "in") {
      stockLength = Math.round(stockLength / 25.4);
      bladeKerf = parseFloat((bladeKerf / 25.4).toFixed(3));
    } else if (settings.unit === "cm" && unit === "mm") {
      stockLength = stockLength * 10;
      bladeKerf = bladeKerf * 10;
    } else if (settings.unit === "cm" && unit === "in") {
      stockLength = Math.round(stockLength / 2.54);
      bladeKerf = parseFloat((bladeKerf / 2.54).toFixed(3));
    } else if (settings.unit === "in" && unit === "mm") {
      stockLength = Math.round(stockLength * 25.4);
      bladeKerf = Math.round(bladeKerf * 25.4);
    } else if (settings.unit === "in" && unit === "cm") {
      stockLength = parseFloat((stockLength * 2.54).toFixed(1));
      bladeKerf = parseFloat((bladeKerf * 2.54).toFixed(2));
    }

    setSettings({
      ...settings,
      unit,
      stockLength,
      bladeKerf,
    });
  };

  return (
    <div className="space-y-4">
      {/* Unit Selection */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Units System
        </label>
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
          {(["mm", "cm", "in"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => handleUnitChange(u)}
              className={`py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stock Length */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        {/* Blade Kerf */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          />
        </div>

        {/* Material Width (Inactive sheet placeholder) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            Material Width
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700/50 font-normal normal-case">
              2D (Pro)
            </span>
          </label>
          <input
            type="text"
            disabled
            placeholder="N/A (1D Only)"
            className="w-full bg-slate-950/40 border border-slate-900 rounded-xl px-3 py-2 text-sm text-slate-600 font-mono cursor-not-allowed"
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
  onParse: (parsed: { length: number; quantity: number }[]) => void;
}

export function QuickPasteCLI({ onParse }: QuickPasteCLIProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    setError(null);
    if (!text.trim()) {
      setError("Please paste or type some data first.");
      return;
    }

    try {
      const results: { length: number; quantity: number }[] = [];
      const lines = text.split(/[\n,;]+/);

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Matches formats like "4x1100", "1100x4", "4 @ 850", "3*400", "1100"
        const parts = line.split(/\s*[xX@*]\s*/);
        if (parts.length === 2) {
          const p1 = parseFloat(parts[0]);
          const p2 = parseFloat(parts[1]);
          if (!isNaN(p1) && !isNaN(p2)) {
            // Pick smaller as quantity if one is integer and other is larger,
            // or default to typical Qty x Length
            let qty = Math.round(p1);
            let len = p2;
            if (p1 > p2 && Number.isInteger(p2)) {
              qty = Math.round(p2);
              len = p1;
            }
            if (qty > 0 && len > 0) {
              results.push({ length: len, quantity: qty });
              continue;
            }
          }
        }

        const num = parseFloat(line);
        if (!isNaN(num) && num > 0) {
          results.push({ length: num, quantity: 1 });
          continue;
        }
      }

      if (results.length === 0) {
        setError("Could not parse any valid cuts. Use format: 4x1100 or 1100x4.");
        return;
      }

      onParse(results);
      setText("");
    } catch (e) {
      setError("Error parsing list. Please verify the format.");
    }
  };

  return (
    <div className="space-y-3 flex-1 flex flex-col min-h-0">
      <div className="relative flex-1 flex flex-col min-h-0">
        <textarea
          placeholder="Dump raw text here (e.g. 4x1100, 6x850, 3x400)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full flex-1 min-h-[90px] bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl p-3 text-xs text-slate-300 font-mono placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 resize-none"
        />
        {error && (
          <p className="absolute bottom-2 left-2 text-[10px] text-rose-400 flex items-center gap-1 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-900/50 font-sans">
            <AlertCircle size={10} />
            {error}
          </p>
        )}
      </div>

      <button
        onClick={handleParse}
        className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700/60 rounded-xl text-xs font-bold text-white tracking-wide uppercase transition-all flex items-center justify-center gap-2 group"
      >
        <span>Parse List</span>
        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </button>
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
  unit: string;
}

export function PartMatrix({ parts, setParts, isPro, onUpgradeTrigger, unit }: PartMatrixProps) {
  const [newLen, setNewLen] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newLabel, setNewLabel] = useState("");

  const handleAddRow = () => {
    if (!newLen || parseFloat(newLen) <= 0) return;
    if (parseFloat(newQty) <= 0) return;

    // Check free limit
    if (!isPro && parts.length >= 5) {
      onUpgradeTrigger();
      return;
    }

    const newPart: Part = {
      id: Math.random().toString(36).substr(2, 9),
      length: parseFloat(newLen),
      quantity: parseInt(newQty) || 1,
      label: newLabel.trim() || undefined,
    };

    setParts([...parts, newPart]);
    setNewLen("");
    setNewQty("1");
    setNewLabel("");
  };

  const handleUpdateRow = (id: string, field: keyof Part, value: any) => {
    setParts(
      parts.map((p) => {
        if (p.id === id) {
          if (field === "length") return { ...p, length: parseFloat(value) || 0 };
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
      <div className="grid grid-cols-12 gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800/80 items-end">
        <div className="col-span-4 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Length ({unit})
          </span>
          <input
            type="number"
            placeholder="e.g. 850"
            value={newLen}
            onChange={(e) => setNewLen(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50"
            onKeyDown={(e) => e.key === "Enter" && handleAddRow()}
          />
        </div>
        <div className="col-span-3 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Quantity
          </span>
          <input
            type="number"
            min="1"
            placeholder="1"
            value={newQty}
            onChange={(e) => setNewQty(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50"
            onKeyDown={(e) => e.key === "Enter" && handleAddRow()}
          />
        </div>
        <div className="col-span-3 space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Label (Opt)
          </span>
          <input
            type="text"
            placeholder="Shelf A"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
            onKeyDown={(e) => e.key === "Enter" && handleAddRow()}
          />
        </div>
        <button
          onClick={handleAddRow}
          className="col-span-2 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 rounded-lg text-xs font-bold text-slate-950 flex items-center justify-center transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Spreadsheet List */}
      <div className="flex-1 min-h-[180px] max-h-[300px] overflow-y-auto border border-slate-800/80 rounded-xl bg-slate-950/40">
        {parts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 p-6 text-center">
            <Grid size={24} className="mb-2 opacity-30 text-slate-400" />
            <p className="text-xs font-medium">No cut parts defined yet.</p>
            <p className="text-[10px] opacity-70">Add rows above or paste list.</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0">
                <th className="px-3 py-2">Label</th>
                <th className="px-3 py-2 w-24">Length ({unit})</th>
                <th className="px-3 py-2 w-20">Quantity</th>
                <th className="px-2 py-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs">
              {parts.map((part) => (
                <tr key={part.id} className="hover:bg-slate-900/30 group">
                  <td className="px-3 py-1">
                    <input
                      type="text"
                      value={part.label || ""}
                      onChange={(e) => handleUpdateRow(part.id, "label", e.target.value)}
                      placeholder="Unnamed Part"
                      className="bg-transparent border-b border-transparent focus:border-slate-800/80 text-white w-full px-0.5 py-0.5 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-1">
                    <input
                      type="number"
                      value={part.length}
                      onChange={(e) => handleUpdateRow(part.id, "length", e.target.value)}
                      className="bg-transparent border-b border-transparent focus:border-slate-800/80 text-white font-mono w-full px-0.5 py-0.5 focus:outline-none"
                    />
                  </td>
                  <td className="px-3 py-1">
                    <input
                      type="number"
                      value={part.quantity}
                      onChange={(e) => handleUpdateRow(part.id, "quantity", e.target.value)}
                      className="bg-transparent border-b border-transparent focus:border-slate-800/80 text-white font-mono w-full px-0.5 py-0.5 focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1 text-center">
                    <button
                      onClick={() => handleDeleteRow(part.id)}
                      className="p-1 text-slate-600 hover:text-rose-400 rounded transition-colors focus:outline-none"
                    >
                      <Trash2 size={13} />
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
        <div className="p-3 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400 shrink-0" />
            <p className="text-[11px] text-amber-300 font-medium">
              Free Tier: limit of 5 rows ({parts.length}/5 used). Upgrade for unlimited cuts.
            </p>
          </div>
          <button
            onClick={onUpgradeTrigger}
            className="text-[10px] font-bold text-amber-400 hover:text-amber-300 uppercase tracking-wide focus:outline-none shrink-0"
          >
            Upgrade
          </button>
        </div>
      )}

      {parts.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleClearAll}
            className="text-[10px] text-slate-500 hover:text-slate-400 font-bold uppercase tracking-wider focus:outline-none flex items-center gap-1"
          >
            <Trash2 size={10} />
            Clear List
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
  unit: string;
}

export function ScrapPile({ scraps, setScraps, unit }: ScrapPileProps) {
  const [newLen, setNewLen] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [newLabel, setNewLabel] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);

  const handleAddScrap = () => {
    if (!newLen || parseFloat(newLen) <= 0) return;
    if (parseFloat(newQty) <= 0) return;

    const newScrap: Scrap = {
      id: Math.random().toString(36).substr(2, 9),
      length: parseFloat(newLen),
      quantity: parseInt(newQty) || 1,
      label: newLabel.trim() || undefined,
    };

    setScraps([...scraps, newScrap]);
    setNewLen("");
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
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Scrap Optimization Engine
        </span>
        <button
          onClick={handleToggleActive}
          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isEnabled ? "bg-emerald-500" : "bg-slate-800"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-slate-950 shadow ring-0 transition duration-200 ease-in-out ${
              isEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {isEnabled && (
        <>
          {/* Quick Input Row */}
          <div className="grid grid-cols-12 gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800/80 items-end">
            <div className="col-span-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Offcut Length
              </span>
              <input
                type="number"
                placeholder="600"
                value={newLen}
                onChange={(e) => setNewLen(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50"
                onKeyDown={(e) => e.key === "Enter" && handleAddScrap()}
              />
            </div>
            <div className="col-span-3 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Qty
              </span>
              <input
                type="number"
                min="1"
                placeholder="1"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500/50"
                onKeyDown={(e) => e.key === "Enter" && handleAddScrap()}
              />
            </div>
            <div className="col-span-3 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Label (Opt)
              </span>
              <input
                type="text"
                placeholder="Stud"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800/80 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                onKeyDown={(e) => e.key === "Enter" && handleAddScrap()}
              />
            </div>
            <button
              onClick={handleAddScrap}
              className="col-span-2 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700/60 rounded-lg text-xs font-bold text-white flex items-center justify-center transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Offcut List */}
          <div className="flex-1 min-h-[100px] overflow-y-auto border border-slate-800/80 rounded-xl bg-slate-950/40">
            {scraps.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 p-4 text-center">
                <Layers size={18} className="mb-1.5 opacity-30 text-slate-400" />
                <p className="text-[11px] font-medium">Scrap pile is currently empty.</p>
                <p className="text-[9px] opacity-70">Add leftover boards above to use them first.</p>
              </div>
            ) : (
              <div className="p-2 space-y-1.5">
                {scraps.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/50 rounded-lg px-3 py-1.5 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        {s.quantity}x
                      </span>
                      <span className="text-xs font-semibold text-white font-mono">
                        {s.length}
                        {unit}
                      </span>
                      {s.label && (
                        <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-850">
                          {s.label}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteScrap(s.id)}
                      className="p-1 text-slate-600 hover:text-rose-400 transition-colors focus:outline-none"
                    >
                      <Trash2 size={12} />
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
          <AlertCircle size={20} className="mb-2 opacity-40" />
          <p className="text-xs font-semibold">Scrap Optimization is Disabled</p>
          <p className="text-[10px] opacity-70 max-w-xs mt-1">
            Toggle engine on if you want the algorithm to exhaust your scraps before cutting fresh stock.
          </p>
        </div>
      )}
    </div>
  );
}
