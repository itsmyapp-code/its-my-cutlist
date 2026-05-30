"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Download, Clipboard, Check, Filter } from "lucide-react";
import type { ComponentPiece, MaterialType } from "@/types/furniture";

interface CutlistTableProps {
  pieces: ComponentPiece[];
  activeFilter: MaterialType;
  onFilterChange: (filter: MaterialType) => void;
}

const MATERIAL_FILTERS: MaterialType[] = [
  "All Parts",
  "18mm MDF",
  "6mm Ply",
  "12mm Drawer Box",
];

export default function CutlistTable({
  pieces,
  activeFilter,
  onFilterChange,
}: CutlistTableProps) {
  const [exportCopied, setExportCopied] = useState(false);
  const [csvCopied, setCsvCopied] = useState(false);

  // ── Filtered pieces ──────────────────────────────────────────
  const filteredPieces = useMemo(() => {
    if (activeFilter === "All Parts") return pieces;
    return pieces.filter((p) => p.material === activeFilter);
  }, [pieces, activeFilter]);

  // ── Aggregate totals ─────────────────────────────────────────
  const totalParts = useMemo(
    () => filteredPieces.reduce((sum, p) => sum + p.quantity, 0),
    [filteredPieces]
  );

  // ── Export JSON to clipboard + custom event ──────────────────
  const handleExport = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      pieces: filteredPieces.map((p) => ({
        name: p.name,
        quantity: p.quantity,
        length: p.height,
        width: p.width,
        thickness: p.thickness,
        material: p.material,
      })),
    };

    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));

    window.dispatchEvent(
      new CustomEvent("furniture-cutlist-export", { detail: payload })
    );

    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
  }, [filteredPieces]);

  // ── Copy CSV to clipboard ────────────────────────────────────
  const handleCopyCSV = useCallback(() => {
    const header = "Name,Qty,Length_mm,Width_mm,Thickness_mm,Material";
    const rows = filteredPieces.map(
      (p) =>
        `"${p.name}",${p.quantity},${p.height.toFixed(1)},${p.width.toFixed(1)},${p.thickness.toFixed(1)},"${p.material}"`
    );
    const csv = [header, ...rows].join("\n");

    navigator.clipboard.writeText(csv);

    setCsvCopied(true);
    setTimeout(() => setCsvCopied(false), 2000);
  }, [filteredPieces]);

  return (
    <div className="space-y-4">
      {/* ─── Filter Pills ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-slate-500 shrink-0" />
        {MATERIAL_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all focus:outline-none ${
              activeFilter === filter
                ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/15"
                : "bg-slate-800/60 text-slate-400 hover:bg-slate-700 border border-slate-700/50"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* ─── Data Table ───────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/80">
              <th className="px-4 py-2.5 text-slate-400 text-[10px] uppercase tracking-widest font-mono font-semibold border-b border-slate-800">
                Component Name
              </th>
              <th className="px-3 py-2.5 text-slate-400 text-[10px] uppercase tracking-widest font-mono font-semibold border-b border-slate-800 text-right">
                Qty
              </th>
              <th className="px-3 py-2.5 text-slate-400 text-[10px] uppercase tracking-widest font-mono font-semibold border-b border-slate-800 text-right">
                Length (mm)
              </th>
              <th className="px-3 py-2.5 text-slate-400 text-[10px] uppercase tracking-widest font-mono font-semibold border-b border-slate-800 text-right">
                Width (mm)
              </th>
              <th className="px-3 py-2.5 text-slate-400 text-[10px] uppercase tracking-widest font-mono font-semibold border-b border-slate-800 text-right">
                Thickness (mm)
              </th>
              <th className="px-4 py-2.5 text-slate-400 text-[10px] uppercase tracking-widest font-mono font-semibold border-b border-slate-800">
                Material
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPieces.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-slate-500 italic"
                >
                  No parts match the selected filter.
                </td>
              </tr>
            ) : (
              filteredPieces.map((piece, idx) => (
                <tr
                  key={piece.id}
                  className={`text-sm text-slate-200 transition-colors hover:bg-slate-800/40 ${
                    idx % 2 === 0 ? "bg-slate-900/60" : "bg-slate-900/30"
                  }`}
                >
                  <td className="px-4 py-2.5 border-b border-slate-800/60 font-medium">
                    {piece.name}
                  </td>
                  <td className="px-3 py-2.5 border-b border-slate-800/60 text-right font-mono tabular-nums">
                    {piece.quantity}
                  </td>
                  <td className="px-3 py-2.5 border-b border-slate-800/60 text-right font-mono tabular-nums">
                    {piece.height.toFixed(1)}mm
                  </td>
                  <td className="px-3 py-2.5 border-b border-slate-800/60 text-right font-mono tabular-nums">
                    {piece.width.toFixed(1)}mm
                  </td>
                  <td className="px-3 py-2.5 border-b border-slate-800/60 text-right font-mono tabular-nums">
                    {piece.thickness.toFixed(1)}mm
                  </td>
                  <td className="px-4 py-2.5 border-b border-slate-800/60">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-slate-800 text-slate-300 border border-slate-700/40">
                      {piece.material}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* ─── Aggregate Footer ────────────────────────────── */}
          {filteredPieces.length > 0 && (
            <tfoot>
              <tr className="bg-slate-800/50 text-xs text-slate-400 font-mono">
                <td className="px-4 py-2.5 font-bold uppercase tracking-wider">
                  Total
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-emerald-400 text-sm">
                  {totalParts}
                </td>
                <td
                  colSpan={4}
                  className="px-3 py-2.5 text-right text-slate-500 text-[11px]"
                >
                  {filteredPieces.length} unique component
                  {filteredPieces.length !== 1 ? "s" : ""} &middot;{" "}
                  {totalParts} total part
                  {totalParts !== 1 ? "s" : ""}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ─── Export Actions ────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleExport}
          className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold rounded-lg px-4 py-2.5 text-sm transition-all focus:outline-none flex items-center gap-2 shadow-md shadow-emerald-500/10"
        >
          {exportCopied ? (
            <>
              <Check size={16} strokeWidth={3} />
              Copied to Clipboard
            </>
          ) : (
            <>
              <Download size={16} />
              Export to Cutlist App
            </>
          )}
        </button>

        <button
          onClick={handleCopyCSV}
          className="bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-300 font-semibold rounded-lg px-4 py-2.5 text-sm transition-all focus:outline-none flex items-center gap-2 border border-slate-700"
        >
          {csvCopied ? (
            <>
              <Check size={16} strokeWidth={3} className="text-emerald-400" />
              CSV Copied
            </>
          ) : (
            <>
              <Clipboard size={16} />
              Copy CSV
            </>
          )}
        </button>
      </div>
    </div>
  );
}
