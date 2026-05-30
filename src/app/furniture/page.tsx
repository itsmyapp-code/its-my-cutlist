"use client";

import React, { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Box,
} from "lucide-react";
import {
  FurnitureConfig,
  ViewSettings,
  MaterialType,
  DEFAULT_CONFIG,
  DEFAULT_VIEW_SETTINGS,
} from "@/types/furniture";
import { generateCutlist } from "@/utils/furnitureMath";
import ConfigSidebar from "@/components/furniture/ConfigSidebar";
import CutlistTable from "@/components/furniture/CutlistTable";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";

// ── Dynamic import of the Three.js canvas (SSR disabled) ──────
const FurnitureCanvas = dynamic(
  () => import("@/components/furniture/FurnitureCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-slate-950 rounded-2xl border border-slate-800/60">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 size={28} className="animate-spin text-emerald-500/60" />
          <span className="text-xs font-mono tracking-wider uppercase">
            Initialising 3D Engine…
          </span>
        </div>
      </div>
    ),
  }
);

// ═══════════════════════════════════════════════════════════════
// FURNITURE MODELER PAGE
// ═══════════════════════════════════════════════════════════════

export default function FurniturePage() {
  // ── State ───────────────────────────────────────────────────
  const [config, setConfig] = useState<FurnitureConfig>({
    ...DEFAULT_CONFIG,
  });

  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    ...DEFAULT_VIEW_SETTINGS,
  });

  const [activeTab, setActiveTab] = useState<"3d" | "cutlist">("3d");

  // ── Reactive cutlist generation ─────────────────────────────
  const pieces = useMemo(() => generateCutlist(config), [config]);

  // ── Filter handler ──────────────────────────────────────────
  const handleFilterChange = useCallback((filter: MaterialType) => {
    setViewSettings((prev) => ({ ...prev, activeFilter: filter }));
  }, []);

  // ── Filtered pieces for the table ───────────────────────────
  const filteredPieces = useMemo(() => {
    if (viewSettings.activeFilter === "All Parts") return pieces;
    return pieces.filter((p) => p.material === viewSettings.activeFilter);
  }, [pieces, viewSettings.activeFilter]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.04),rgba(255,255,255,0))] pointer-events-none" />

      {/* ── TOP NAV BAR ──────────────────────────────────────── */}
      <header className="relative z-30 flex items-center justify-between px-4 py-3 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-xs font-medium"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Back to Cutlist</span>
          </Link>
          <div className="h-4 border-l border-slate-800" />
          <div className="flex items-center gap-2">
            <Box size={16} className="text-emerald-500" />
            <h1 className="text-sm font-bold text-slate-100 tracking-tight">
              Parametric Furniture Modeler
            </h1>
          </div>
        </div>

        {/* Mobile tab toggle */}
        <div className="flex items-center gap-1 lg:hidden">
          <button
            onClick={() => setActiveTab("3d")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "3d"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            3D View
          </button>
          <button
            onClick={() => setActiveTab("cutlist")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "cutlist"
                ? "bg-emerald-500 text-slate-950"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            Cutlist
          </button>
        </div>
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="flex-1 flex relative z-10 overflow-hidden">
        {/* ── LEFT SIDEBAR ───────────────────────────────────── */}
        <ConfigSidebar
          config={config}
          onConfigChange={setConfig}
          viewSettings={viewSettings}
          onViewSettingsChange={setViewSettings}
        />

        {/* ── CENTER + RIGHT CONTENT ─────────────────────────── */}
        <div className="flex-1 flex flex-col lg:flex-row min-w-0 overflow-hidden">
          {/* ── 3D CANVAS ──────────────────────────────────────── */}
          <div
            className={`flex-1 min-h-[400px] lg:min-h-0 p-3 ${
              activeTab !== "3d" ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800/60 bg-slate-900/30">
              <FurnitureCanvas
                pieces={pieces}
                viewSettings={viewSettings}
              />
            </div>
          </div>

          {/* ── CUTLIST TABLE PANEL ─────────────────────────────── */}
          <div
            className={`lg:w-[480px] xl:w-[540px] lg:border-l border-slate-800/60 overflow-y-auto ${
              activeTab !== "cutlist" ? "hidden lg:block" : "block"
            }`}
          >
            <div className="p-4">
              <CutlistTable
                pieces={filteredPieces}
                activeFilter={viewSettings.activeFilter}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── COMPLIANCE FOOTER ──────────────────────────────────── */}
      {/* COMPLIANCE MD FOR FUTURE APPS:
          This legal container block provides mandatory global application
          footer links. All links route to existing compliance pages.
          Cookie Banner, Terms of Service, Privacy Policy, Cookie Policy,
          and Accessibility Statement are included. */}
      <div className="print:hidden relative z-20">
        <Footer />
        <CookieBanner />
      </div>
    </div>
  );
}
