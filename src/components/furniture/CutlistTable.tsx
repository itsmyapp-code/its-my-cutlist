"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Download, Clipboard, Check, Filter, Printer } from "lucide-react";
import type { ComponentPiece, MaterialType } from "@/types/furniture";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/utils/firebase";

interface CutlistTableProps {
  pieces: ComponentPiece[];
  activeFilter: MaterialType;
  onFilterChange: (filter: MaterialType) => void;
  jobName: string;
  customerName: string;
  companyName: string;
  operatorName: string;
  userId?: string;
  isPro: boolean;
  onUpgradeTrigger: () => void;
}

const MATERIAL_FILTERS: MaterialType[] = [
  "All Parts",
  "18mm MDF",
  "6mm Ply",
  "12mm Drawer Box",
];

function getPhysicalDimensions(piece: ComponentPiece) {
  const dims = [piece.width, piece.height, piece.thickness].sort((a, b) => a - b);
  return {
    thickness: dims[0],
    width: dims[1],
    length: dims[2],
  };
}

export default function CutlistTable({
  pieces,
  activeFilter,
  onFilterChange,
  jobName,
  customerName,
  companyName,
  operatorName,
  userId,
  isPro,
  onUpgradeTrigger,
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
    if (activeFilter === "All Parts") {
      const materials = new Set(filteredPieces.map((p) => p.material));
      if (materials.size > 1) {
        alert(
          `Mixed Materials Warning:\n\n` +
          `You are attempting to export multiple materials (${Array.from(materials).join(", ")}) together.\n\n` +
          `The Cutlist Cockpit optimizes one sheet material thickness at a time. ` +
          `Please select a specific material filter pill above (e.g., '18mm MDF') and export each group separately to prevent different materials from being mixed on the same sheets.`
        );
        return;
      }
    }

    if (!isPro && filteredPieces.length > 5) {
      onUpgradeTrigger();
      return;
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      pieces: filteredPieces.map((p) => {
        const { length, width, thickness } = getPhysicalDimensions(p);
        return {
          name: p.name,
          quantity: p.quantity,
          length,
          width,
          thickness,
          material: p.material,
        };
      }),
    };

    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));

    // Write directly to local storage keys that the main page Workspace reads on load
    const cutlistParts = filteredPieces.map((p, idx) => {
      const { length, width, thickness } = getPhysicalDimensions(p);
      return {
        id: `furn_${Date.now()}_${idx}`,
        length,
        width: width > 0 ? width : undefined,
        quantity: p.quantity,
        label: `${p.name} (${p.material})`,
      };
    });
    localStorage.setItem("itsmycut_parts", JSON.stringify(cutlistParts));
    localStorage.setItem("itsmycut_job_name", jobName || "");
    localStorage.setItem("itsmycut_customer_name", customerName || "");
    localStorage.setItem("itsmycut_company_name", companyName || "");
    localStorage.setItem("itsmycut_operator_name", operatorName || "");

    // Write to Firestore if logged in
    if (userId) {
      const docRef = doc(db, "users", userId, "activeJob", "current");
      setDoc(docRef, {
        parts: cutlistParts,
        jobName: jobName || "",
        customerName: customerName || "",
        companyName: companyName || "",
        operatorName: operatorName || "",
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch((err) => {
        console.error("Failed to sync active job to Firestore:", err);
      });
    }

    window.dispatchEvent(
      new CustomEvent("furniture-cutlist-export", { detail: payload })
    );

    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
  }, [filteredPieces, jobName, customerName, companyName, operatorName, isPro, onUpgradeTrigger, userId]);

  // ── Copy CSV to clipboard ────────────────────────────────────
  const handleCopyCSV = useCallback(() => {
    const header = "Name,Qty,Length_mm,Width_mm,Thickness_mm,Material";
    const rows = filteredPieces.map((p) => {
      const { length, width, thickness } = getPhysicalDimensions(p);
      return `"${p.name}",${p.quantity},${length.toFixed(1)},${width.toFixed(1)},${thickness.toFixed(1)},"${p.material}"`;
    });
    const csv = [header, ...rows].join("\n");

    navigator.clipboard.writeText(csv);

    setCsvCopied(true);
    setTimeout(() => setCsvCopied(false), 2000);
  }, [filteredPieces]);

  return (
    <div className="space-y-4">
      {/* ─── Filter Pills ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap print:hidden">
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
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/30 print:border-slate-300 print:bg-transparent">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/80 print:bg-slate-100">
              <th className="px-4 py-2.5 text-slate-400 text-[10px] uppercase tracking-widest font-mono font-semibold border-b border-slate-800 print:border-slate-300 print:text-slate-800">
                Component Name
              </th>
              <th className="px-3 py-2.5 text-slate-400 text-[10px] uppercase tracking-widest font-mono font-semibold border-b border-slate-800 text-right print:border-slate-300 print:text-slate-800">
                Qty
              </th>
              <th className="px-3 py-2.5 text-slate-400 text-[10px] uppercase tracking-widest font-mono font-semibold border-b border-slate-800 text-right print:border-slate-300 print:text-slate-800">
                Length (mm)
              </th>
              <th className="px-3 py-2.5 text-slate-400 text-[10px] uppercase tracking-widest font-mono font-semibold border-b border-slate-800 text-right print:border-slate-300 print:text-slate-800">
                Width (mm)
              </th>
              <th className="px-3 py-2.5 text-slate-400 text-[10px] uppercase tracking-widest font-mono font-semibold border-b border-slate-800 text-right print:border-slate-300 print:text-slate-800">
                Thickness (mm)
              </th>
              <th className="px-4 py-2.5 text-slate-400 text-[10px] uppercase tracking-widest font-mono font-semibold border-b border-slate-800 print:border-slate-300 print:text-slate-800">
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
              filteredPieces.map((piece, idx) => {
                const { length, width, thickness } = getPhysicalDimensions(piece);
                return (
                  <tr
                    key={piece.id}
                    className={`text-sm text-slate-200 transition-colors hover:bg-slate-800/40 print:text-slate-900 print:bg-transparent ${
                      idx % 2 === 0 ? "bg-slate-900/60" : "bg-slate-900/30"
                    }`}
                  >
                    <td className="px-4 py-2.5 border-b border-slate-800/60 print:border-slate-200 font-medium">
                      {piece.name}
                    </td>
                    <td className="px-3 py-2.5 border-b border-slate-800/60 print:border-slate-200 text-right font-mono tabular-nums">
                      {piece.quantity}
                    </td>
                    <td className="px-3 py-2.5 border-b border-slate-800/60 print:border-slate-200 text-right font-mono tabular-nums">
                      {length.toFixed(1)}mm
                    </td>
                    <td className="px-3 py-2.5 border-b border-slate-800/60 print:border-slate-200 text-right font-mono tabular-nums">
                      {width.toFixed(1)}mm
                    </td>
                    <td className="px-3 py-2.5 border-b border-slate-800/60 print:border-slate-200 text-right font-mono tabular-nums">
                      {thickness.toFixed(1)}mm
                    </td>
                    <td className="px-4 py-2.5 border-b border-slate-800/60 print:border-slate-200">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase bg-slate-800 text-slate-300 border border-slate-700/40 print:bg-slate-100 print:text-slate-800 print:border-slate-300">
                        {piece.material}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* ─── Aggregate Footer ────────────────────────────── */}
          {filteredPieces.length > 0 && (
            <tfoot>
              <tr className="bg-slate-800/50 text-xs text-slate-400 font-mono print:bg-slate-50 print:text-slate-800 print:border-t-2 print:border-slate-300">
                <td className="px-4 py-2.5 font-bold uppercase tracking-wider">
                  Total
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-emerald-400 text-sm print:text-slate-950">
                  {totalParts}
                </td>
                <td
                  colSpan={4}
                  className="px-3 py-2.5 text-right text-slate-500 text-[11px] print:text-slate-600"
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

      {!isPro && filteredPieces.length > 5 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs space-y-1 print:hidden">
          <p className="font-bold flex items-center gap-1.5">
            <span>⚠️</span> Free Tier Export Limit Exceeded ({filteredPieces.length} parts)
          </p>
          <p className="text-slate-400">
            Free users can export up to 5 parts. Please upgrade to Pro to unlock unlimited exports and advanced configurations.
          </p>
        </div>
      )}

      {/* ─── Export Actions ────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap print:hidden">
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

        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent("furniture-print-start"));
            setTimeout(() => {
              window.print();
              window.dispatchEvent(new CustomEvent("furniture-print-end"));
            }, 150);
          }}
          className="bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-300 font-semibold rounded-lg px-4 py-2.5 text-sm transition-all focus:outline-none flex items-center gap-2 border border-slate-700 print:hidden"
        >
          <Printer size={16} />
          Print Spec
        </button>
      </div>
    </div>
  );
}
