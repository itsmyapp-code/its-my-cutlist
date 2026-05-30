'use client';

import { useState } from 'react';
import {
  Settings,
  ChevronDown,
  ChevronRight,
  Eye,
  Box,
  Layers,
  Ruler,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import type {
  FurnitureConfig,
  FurnitureType,
  ViewSettings,
} from '@/types/furniture';
import { DEFAULT_DIMENSIONS } from '@/types/furniture';

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────
interface ConfigSidebarProps {
  config: FurnitureConfig;
  onConfigChange: (config: FurnitureConfig) => void;
  viewSettings: ViewSettings;
  onViewSettingsChange: (settings: ViewSettings) => void;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const SectionHeader = ({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) => (
  <h3 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
    <Icon className="w-3.5 h-3.5" />
    {label}
  </h3>
);

const DimensionSlider = ({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <label className="text-sm text-slate-400">{label}</label>
      <span className="text-xs text-slate-500 tabular-nums">{value} mm</span>
    </div>
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
      />
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (v >= min && v <= max) onChange(v);
        }}
        className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-sm text-right text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
      />
    </div>
  </div>
);

const ToleranceInput = ({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs text-slate-500 truncate">{label}</label>
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (v >= min && v <= max) onChange(v);
      }}
      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-right text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
    />
  </div>
);

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export default function ConfigSidebar({
  config,
  onConfigChange,
  viewSettings,
  onViewSettingsChange,
}: ConfigSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // ── Mutation helpers ──────────────────────────────────────
  const updateDimension = (key: 'width' | 'height' | 'depth', value: number) => {
    onConfigChange({
      ...config,
      dimensions: { ...config.dimensions, [key]: value },
    });
  };

  const updateTolerance = (key: keyof typeof config.tolerances, value: number) => {
    onConfigChange({
      ...config,
      tolerances: { ...config.tolerances, [key]: value },
    });
  };

  const setFurnitureType = (type: FurnitureType) => {
    onConfigChange({
      ...config,
      type,
      dimensions: { ...DEFAULT_DIMENSIONS[type] },
    });
  };

  // ── Sidebar body (shared between desktop & mobile) ────────
  const sidebarContent = (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
      {/* ── Title bar ──────────────────────────────────── */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Box className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 leading-tight">
              Furniture Modeler
            </h1>
            <p className="text-[10px] text-slate-500 leading-tight">
              Parametric configurator
            </p>
          </div>
        </div>

        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(true)}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>

        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden flex items-center justify-center w-7 h-7 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          aria-label="Close sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* ── Section 1: Furniture Type ─────────────────── */}
      <div className="p-5 border-b border-slate-800/60">
        <SectionHeader icon={Layers} label="Furniture Type" />
        <div className="flex gap-2">
          {(
            [
              { type: 'wardrobe' as FurnitureType, label: 'Wardrobe' },
              { type: 'chest_of_drawers' as FurnitureType, label: 'Chest of Drawers' },
            ] as const
          ).map(({ type, label }) => {
            const active = config.type === type;
            return (
              <button
                key={type}
                onClick={() => setFurnitureType(type)}
                className={`flex-1 px-3 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                  active
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700/50'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: Overall Dimensions ─────────────── */}
      <div className="p-5 space-y-4 border-b border-slate-800/60">
        <SectionHeader icon={Ruler} label="Overall Dimensions" />
        <DimensionSlider
          label="Width"
          value={config.dimensions.width}
          min={300}
          max={2400}
          onChange={(v) => updateDimension('width', v)}
        />
        <DimensionSlider
          label="Height"
          value={config.dimensions.height}
          min={300}
          max={2400}
          onChange={(v) => updateDimension('height', v)}
        />
        <DimensionSlider
          label="Depth"
          value={config.dimensions.depth}
          min={200}
          max={900}
          onChange={(v) => updateDimension('depth', v)}
        />
      </div>

      {/* ── Section 3: Configuration ──────────────────── */}
      <div className="p-5 space-y-4 border-b border-slate-800/60">
        <SectionHeader icon={SlidersHorizontal} label="Configuration" />
        {config.type === 'chest_of_drawers' ? (
          <DimensionSlider
            label="Number of Drawers"
            value={config.numberOfDrawers}
            min={1}
            max={8}
            onChange={(v) =>
              onConfigChange({ ...config, numberOfDrawers: v })
            }
          />
        ) : (
          <DimensionSlider
            label="Number of Shelves"
            value={config.numberOfShelves}
            min={0}
            max={6}
            onChange={(v) =>
              onConfigChange({ ...config, numberOfShelves: v })
            }
          />
        )}
      </div>

      {/* ── Section 4: Advanced Hardware & Materials ──── */}
      <div className="p-5 border-b border-slate-800/60">
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="flex items-center justify-between w-full group"
        >
          <span className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Settings className="w-3.5 h-3.5" />
            Hardware &amp; Materials
          </span>
          {advancedOpen ? (
            <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          )}
        </button>

        <div
          className={`grid transition-all duration-300 ease-in-out ${
            advancedOpen
              ? 'grid-rows-[1fr] opacity-100 mt-4'
              : 'grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-2 gap-3">
              <ToleranceInput
                label="Carcass Thickness"
                value={config.tolerances.carcassThickness}
                min={10}
                max={25}
                onChange={(v) => updateTolerance('carcassThickness', v)}
              />
              <ToleranceInput
                label="Back Panel"
                value={config.tolerances.backPanelThickness}
                min={3}
                max={12}
                onChange={(v) => updateTolerance('backPanelThickness', v)}
              />
              <ToleranceInput
                label="Runner Clearance"
                value={config.tolerances.runnerClearance}
                min={10}
                max={20}
                onChange={(v) => updateTolerance('runnerClearance', v)}
              />
              <ToleranceInput
                label="Door Gap"
                value={config.tolerances.doorGap}
                min={1}
                max={5}
                onChange={(v) => updateTolerance('doorGap', v)}
              />
              <ToleranceInput
                label="Drawer Front Gap"
                value={config.tolerances.drawerFrontGap}
                min={1}
                max={6}
                onChange={(v) => updateTolerance('drawerFrontGap', v)}
              />
              <ToleranceInput
                label="Back Inset"
                value={config.tolerances.backInset}
                min={5}
                max={15}
                onChange={(v) => updateTolerance('backInset', v)}
              />
              <ToleranceInput
                label="Drawer Box Thick."
                value={config.tolerances.drawerBoxThickness}
                min={8}
                max={18}
                onChange={(v) => updateTolerance('drawerBoxThickness', v)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 5: View Controls ──────────────────── */}
      <div className="p-5 space-y-5">
        <SectionHeader icon={Eye} label="View Controls" />

        {/* Wireframe toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-300">Wireframe</span>
          </div>
          <button
            role="switch"
            aria-checked={viewSettings.wireframe}
            onClick={() =>
              onViewSettingsChange({
                ...viewSettings,
                wireframe: !viewSettings.wireframe,
              })
            }
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${
              viewSettings.wireframe ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                viewSettings.wireframe ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Exploded view slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Exploded View</span>
            <span className="text-xs text-slate-500 tabular-nums">
              {Math.round(viewSettings.explodedFactor * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={viewSettings.explodedFactor}
            onChange={(e) =>
              onViewSettingsChange({
                ...viewSettings,
                explodedFactor: Number(e.target.value),
              })
            }
            className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col h-full bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-12' : 'w-80'
        }`}
      >
        {collapsed ? (
          <div className="flex flex-col items-center pt-4 gap-4">
            <button
              onClick={() => setCollapsed(false)}
              className="flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              aria-label="Expand sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <div className="w-6 h-6 rounded-md bg-emerald-500/15 flex items-center justify-center">
              <Box className="w-3 h-3 text-emerald-400" />
            </div>
          </div>
        ) : (
          sidebarContent
        )}
      </aside>

      {/* ── Mobile floating trigger ──────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900/90 backdrop-blur-lg border border-slate-700/50 text-slate-400 hover:text-emerald-400 shadow-lg transition-colors"
        aria-label="Open settings"
      >
        <SlidersHorizontal className="w-5 h-5" />
      </button>

      {/* ── Mobile overlay & drawer ──────────────────── */}
      {mobileOpen && (
        <>
          {/* Scrim */}
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 shadow-2xl animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
