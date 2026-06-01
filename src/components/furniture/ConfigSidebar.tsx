'use client';

import { useState, useEffect } from 'react';
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
  FileText,
} from 'lucide-react';
import type {
  FurnitureConfig,
  FurnitureType,
  ViewSettings,
} from '@/types/furniture';
import { DEFAULT_DIMENSIONS } from '@/types/furniture';
import { DEFAULT_KITCHEN_UNIT_CODE, KITCHEN_UNIT_REGISTRY } from '@/utils/kitchenRegistry';

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────
interface ConfigSidebarProps {
  config: FurnitureConfig;
  onConfigChange: (config: FurnitureConfig) => void;
  viewSettings: ViewSettings;
  onViewSettingsChange: (settings: ViewSettings) => void;
  isPro: boolean;
  onUpgradeTrigger: () => void;
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
}) => {
  const [tempValue, setTempValue] = useState(value.toString());

  useEffect(() => {
    setTempValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setTempValue(rawVal);

    const numVal = Number(rawVal);
    if (!isNaN(numVal) && numVal >= min && numVal <= max) {
      onChange(numVal);
    }
  };

  const handleInputBlur = () => {
    let numVal = Number(tempValue);
    if (isNaN(numVal)) {
      numVal = value;
    } else if (numVal < min) {
      numVal = min;
    } else if (numVal > max) {
      numVal = max;
    }
    onChange(numVal);
    setTempValue(numVal.toString());
  };

  return (
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
          value={tempValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-sm text-right text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
        />
      </div>
    </div>
  );
};

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
}) => {
  const [tempValue, setTempValue] = useState(value.toString());

  useEffect(() => {
    setTempValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setTempValue(rawVal);

    const numVal = Number(rawVal);
    if (!isNaN(numVal) && numVal >= min && numVal <= max) {
      onChange(numVal);
    }
  };

  const handleInputBlur = () => {
    let numVal = Number(tempValue);
    if (isNaN(numVal)) {
      numVal = value;
    } else if (numVal < min) {
      numVal = min;
    } else if (numVal > max) {
      numVal = max;
    }
    onChange(numVal);
    setTempValue(numVal.toString());
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-500 truncate">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={tempValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-right text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
export default function ConfigSidebar({
  config,
  onConfigChange,
  viewSettings,
  onViewSettingsChange,
  isPro,
  onUpgradeTrigger,
}: ConfigSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // ── Mutation helpers ──────────────────────────────────────
  const updateDimension = (key: 'width' | 'height' | 'depth', value: number) => {
    let updatedConfig = {
      ...config,
      dimensions: { ...config.dimensions, [key]: value },
    };

    if (key === 'height') {
      const oldInternalHeight = config.dimensions.height - 2 * config.tolerances.carcassThickness;
      const newInternalHeight = value - 2 * config.tolerances.carcassThickness;
      const scale = newInternalHeight / oldInternalHeight;

      if (config.shelfPositions && config.shelfPositions.length > 0) {
        updatedConfig.shelfPositions = config.shelfPositions.map(pos => pos * scale);
      }
      if (config.drawerHeights && config.drawerHeights.length > 0) {
        updatedConfig.drawerHeights = config.drawerHeights.map(h => h * scale);
      }
    }

    onConfigChange(updatedConfig);
  };

  const updateTolerance = (key: keyof typeof config.tolerances, value: number) => {
    onConfigChange({
      ...config,
      tolerances: { ...config.tolerances, [key]: value },
    });
  };

  const setFurnitureType = (type: FurnitureType) => {
    const isKitchen = type === 'kitchen_unit';
    const isMediaLowboard = type === 'media_lowboard';
    const isStorageBed = type === 'storage_platform_bed';
    const isDesk = type === 'l_shaped_office_desk';
    const isAlcove = type === 'alcove_unit';
    const isVanity = type === 'wall_hung_vanity';
    const isSlimTower = type === 'slimline_storage_tower';
    const isBootBench = type === 'boot_bench';
    const isBroom = type === 'broom_cupboard';
    const isAsset = type === 'scribe_filler_panel' || type === 'corner_post';
    onConfigChange({
      ...config,
      type,
      dimensions: { ...DEFAULT_DIMENSIONS[type] },
      kitchenUnitCode: isKitchen ? DEFAULT_KITCHEN_UNIT_CODE : '',
      hasDoors: isKitchen || isDesk || isStorageBed || isAsset || isBootBench ? false : true,
      numberOfShelves: isKitchen || isDesk || isAsset ? 0 : isStorageBed ? 2 : isBootBench ? 3 : isBroom ? 0 : isMediaLowboard ? 1 : isAlcove ? 4 : isVanity ? 1 : isSlimTower ? 4 : 2,
      numberOfDrawers: isMediaLowboard || isBootBench ? 2 : 0,
      shelfPositions: [],
      drawerHeights: [],
      useFaceFrame: isAlcove,
    });
  };

  const isKitchenUnit = config.type === 'kitchen_unit';
  const isStorageBed = config.type === 'storage_platform_bed';
  const isDesk = config.type === 'l_shaped_office_desk';
  const isMediaLowboard = config.type === 'media_lowboard';
  const isAlcove = config.type === 'alcove_unit';
  const isVanity = config.type === 'wall_hung_vanity';
  const isSlimTower = config.type === 'slimline_storage_tower';
  const isBootBench = config.type === 'boot_bench';
  const isBroom = config.type === 'broom_cupboard';
  const isAsset = config.type === 'scribe_filler_panel' || config.type === 'corner_post';
  const kitchenUnits = Object.values(KITCHEN_UNIT_REGISTRY);

  const getDimensionBounds = (type: FurnitureType) => {
    if (type === 'storage_platform_bed') {
      return {
        width: { min: 900, max: 2400 },
        height: { min: 250, max: 700 },
        depth: { min: 1800, max: 2600 },
      };
    }
    if (type === 'l_shaped_office_desk') {
      return {
        width: { min: 1000, max: 2800 },
        height: { min: 650, max: 900 },
        depth: { min: 900, max: 2200 },
      };
    }
    if (type === 'media_lowboard') {
      return {
        width: { min: 800, max: 2800 },
        height: { min: 300, max: 900 },
        depth: { min: 300, max: 700 },
      };
    }
    if (type === 'alcove_unit') {
      return {
        width: { min: 600, max: 2400 },
        height: { min: 1800, max: 3000 },
        depth: { min: 250, max: 600 },
      };
    }
    if (type === 'wall_hung_vanity') {
      return {
        width: { min: 500, max: 1400 },
        height: { min: 350, max: 700 },
        depth: { min: 350, max: 550 },
      };
    }
    if (type === 'slimline_storage_tower') {
      return {
        width: { min: 300, max: 700 },
        height: { min: 1800, max: 2600 },
        depth: { min: 280, max: 350 },
      };
    }
    if (type === 'boot_bench') {
      return {
        width: { min: 700, max: 2400 },
        height: { min: 450, max: 500 },
        depth: { min: 450, max: 650 },
      };
    }
    if (type === 'broom_cupboard') {
      return {
        width: { min: 600, max: 1200 },
        height: { min: 1970, max: 2300 },
        depth: { min: 450, max: 700 },
      };
    }
    if (type === 'scribe_filler_panel') {
      return {
        width: { min: 50, max: 150 },
        height: { min: 500, max: 2800 },
        depth: { min: 12, max: 30 },
      };
    }
    if (type === 'corner_post') {
      return {
        width: { min: 50, max: 150 },
        height: { min: 500, max: 2800 },
        depth: { min: 50, max: 150 },
      };
    }
    return {
      width: { min: 300, max: 2400 },
      height: { min: 300, max: 2400 },
      depth: { min: 200, max: 900 },
    };
  };

  const dimensionBounds = getDimensionBounds(config.type);

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
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { type: 'wardrobe' as FurnitureType, label: 'Wardrobe' },
              { type: 'chest_of_drawers' as FurnitureType, label: 'Chest of Drawers' },
              { type: 'kitchen_unit' as FurnitureType, label: 'Kitchen Unit' },
              { type: 'media_lowboard' as FurnitureType, label: 'Media Lowboard' },
              { type: 'storage_platform_bed' as FurnitureType, label: 'Storage Bed' },
              { type: 'l_shaped_office_desk' as FurnitureType, label: 'L-Desk' },
              { type: 'alcove_unit' as FurnitureType, label: 'Alcove Unit' },
              { type: 'wall_hung_vanity' as FurnitureType, label: 'Wall Vanity' },
              { type: 'slimline_storage_tower' as FurnitureType, label: 'Slim Tower' },
              { type: 'boot_bench' as FurnitureType, label: 'Boot Bench' },
              { type: 'broom_cupboard' as FurnitureType, label: 'Broom Cupboard' },
              { type: 'scribe_filler_panel' as FurnitureType, label: 'Scribe Panel' },
              { type: 'corner_post' as FurnitureType, label: 'Corner Post' },
            ] as const
          ).map(({ type, label }) => {
            const active = config.type === type;
            return (
              <button
                key={type}
                onClick={() => setFurnitureType(type)}
                className={`min-h-11 px-3 py-2 rounded-xl text-xs leading-tight font-semibold transition-all duration-200 ${
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
        {isKitchenUnit ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm text-slate-400">Kitchen Unit</label>
              <select
                value={config.kitchenUnitCode || DEFAULT_KITCHEN_UNIT_CODE}
                onChange={(e) => {
                  const selected = KITCHEN_UNIT_REGISTRY[e.target.value];
                  if (!selected) return;

                  onConfigChange({
                    ...config,
                    kitchenUnitCode: selected.code,
                    dimensions: {
                      width: selected.width,
                      height: selected.height,
                      depth: selected.depth,
                    },
                  });
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
              >
                {kitchenUnits.map((unit) => (
                  <option key={unit.code} value={unit.code}>
                    {unit.code} - {unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-800/60 bg-slate-900/50 p-3 text-xs text-slate-400">
              <div>
                <span className="block uppercase tracking-wider text-slate-500">Width</span>
                <span className="block mt-1 font-semibold text-slate-200">{config.dimensions.width} mm</span>
              </div>
              <div>
                <span className="block uppercase tracking-wider text-slate-500">Height</span>
                <span className="block mt-1 font-semibold text-slate-200">{config.dimensions.height} mm</span>
              </div>
              <div>
                <span className="block uppercase tracking-wider text-slate-500">Depth</span>
                <span className="block mt-1 font-semibold text-slate-200">{config.dimensions.depth} mm</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            <DimensionSlider
              label="Width"
              value={config.dimensions.width}
              min={dimensionBounds.width.min}
              max={dimensionBounds.width.max}
              onChange={(v) => updateDimension('width', v)}
            />
            <DimensionSlider
              label="Height"
              value={config.dimensions.height}
              min={dimensionBounds.height.min}
              max={dimensionBounds.height.max}
              onChange={(v) => updateDimension('height', v)}
            />
            <DimensionSlider
              label="Depth"
              value={config.dimensions.depth}
              min={dimensionBounds.depth.min}
              max={dimensionBounds.depth.max}
              onChange={(v) => updateDimension('depth', v)}
            />
          </>
        )}
      </div>

      {/* ── Section 3: Configuration ──────────────────── */}
      <div className="p-5 space-y-4 border-b border-slate-800/60">
        <SectionHeader icon={SlidersHorizontal} label="Configuration" />
        {config.type === 'chest_of_drawers' ? (
          <div className="space-y-4">
            <DimensionSlider
              label="Number of Drawers"
              value={config.numberOfDrawers}
              min={1}
              max={isPro ? 8 : 3}
              onChange={(v) => {
                const internalHeight = config.dimensions.height - 2 * config.tolerances.carcassThickness;
                const newHeights = Array(v).fill(internalHeight / v);
                onConfigChange({
                  ...config,
                  numberOfDrawers: v,
                  drawerHeights: newHeights
                });
              }}
            />
            {!isPro && (
              <p className="text-[10px] text-slate-500 mt-1">
                Free limit: 3 drawers. <button onClick={onUpgradeTrigger} className="text-emerald-400 font-bold hover:underline">Upgrade to Pro</button> for up to 8 drawers.
              </p>
            )}

            {config.numberOfDrawers > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-800/40">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Individual Drawer Heights</span>
                {Array.from({ length: config.numberOfDrawers }).map((_, i) => {
                  const internalHeight = config.dimensions.height - 2 * config.tolerances.carcassThickness;
                  const currentHeights = config.drawerHeights && config.drawerHeights.length === config.numberOfDrawers
                    ? config.drawerHeights
                    : Array(config.numberOfDrawers).fill(internalHeight / config.numberOfDrawers);
                  
                  const val = Math.round(currentHeights[i]);
                  const minVal = 80;
                  const maxVal = internalHeight - (config.numberOfDrawers - 1) * 80;

                  return (
                    <DimensionSlider
                      key={`drawer-${i}`}
                      label={`Drawer ${i + 1}`}
                      value={val}
                      min={minVal}
                      max={maxVal}
                      onChange={(newVal) => {
                        const updated = [...currentHeights];
                        updated[i] = newVal;
                        
                        const sumOthers = currentHeights.reduce((sum, h, idx) => idx === i ? sum : sum + h, 0);
                        const targetOthersSum = internalHeight - newVal;
                        
                        if (sumOthers > 0 && targetOthersSum > 0) {
                          const scale = targetOthersSum / sumOthers;
                          for (let idx = 0; idx < updated.length; idx++) {
                            if (idx !== i) {
                              updated[idx] = Math.max(minVal, updated[idx] * scale);
                            }
                          }
                        }
                        
                        onConfigChange({
                          ...config,
                          drawerHeights: updated
                        });
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : config.type === 'kitchen_unit' ? (
          <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 px-3 py-2 text-xs text-slate-400">
            Kitchen internals are driven by the selected catalog unit.
          </div>
        ) : isDesk ? (
          <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 px-3 py-2 text-xs text-slate-400">
            L-desk uses a fixed two-piece intersecting top and support leg layout.
          </div>
        ) : isAsset ? (
          <div className="rounded-lg border border-slate-800/60 bg-slate-900/50 px-3 py-2 text-xs text-slate-400">
            Structural asset mode: dimensions define a standalone fitting panel/post.
          </div>
        ) : isStorageBed ? (
          <div className="space-y-4">
            <DimensionSlider
              label="Storage Bay Dividers"
              value={config.numberOfShelves}
              min={0}
              max={isPro ? 8 : 3}
              onChange={(v) => {
                onConfigChange({
                  ...config,
                  numberOfShelves: v,
                });
              }}
            />
            {!isPro && (
              <p className="text-[10px] text-slate-500 mt-1">
                Free limit: 3 dividers. <button onClick={onUpgradeTrigger} className="text-emerald-400 font-bold hover:underline">Upgrade to Pro</button> for up to 8.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <DimensionSlider
              label={isMediaLowboard ? 'Number of Internal Shelves' : 'Number of Shelves'}
              value={config.numberOfShelves}
              min={0}
              max={isPro ? 6 : 2}
              onChange={(v) => {
                const internalHeight = config.dimensions.height - 2 * config.tolerances.carcassThickness;
                const newPositions = Array(v).fill(0).map((_, idx) => (internalHeight / (v + 1)) * (idx + 1) - config.tolerances.carcassThickness / 2);
                onConfigChange({
                  ...config,
                  numberOfShelves: v,
                  shelfPositions: newPositions
                });
              }}
            />
            {!isPro && (
              <p className="text-[10px] text-slate-500 mt-1">
                Free limit: 2 shelves. <button onClick={onUpgradeTrigger} className="text-emerald-400 font-bold hover:underline">Upgrade to Pro</button> for up to 6 shelves.
              </p>
            )}

            {config.numberOfShelves > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-800/40">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Shelf Heights (from bottom)</span>
                {Array.from({ length: config.numberOfShelves }).map((_, i) => {
                  const internalHeight = config.dimensions.height - 2 * config.tolerances.carcassThickness;
                  const currentPositions = config.shelfPositions && config.shelfPositions.length === config.numberOfShelves
                    ? config.shelfPositions
                    : Array(config.numberOfShelves).fill(0).map((_, idx) => (internalHeight / (config.numberOfShelves + 1)) * (idx + 1) - config.tolerances.carcassThickness / 2);
                  
                  const val = Math.round(currentPositions[i]);
                  const minVal = i === 0 ? 50 : Math.round(currentPositions[i - 1]) + 50;
                  const maxVal = i === config.numberOfShelves - 1 ? internalHeight - 50 : Math.round(currentPositions[i + 1]) - 50;

                  return (
                    <DimensionSlider
                      key={`shelf-${i}`}
                      label={`Shelf ${i + 1}`}
                      value={val}
                      min={minVal}
                      max={maxVal}
                      onChange={(newVal) => {
                        const updated = [...currentPositions];
                        updated[i] = newVal;
                        onConfigChange({
                          ...config,
                          shelfPositions: updated
                        });
                      }}
                    />
                  );
                })}
              </div>
            )}

            {isMediaLowboard && !config.hasDoors && (
              <DimensionSlider
                label="Number of Drawers"
                value={config.numberOfDrawers}
                min={0}
                max={isPro ? 6 : 3}
                onChange={(v) => {
                  const internalHeight = config.dimensions.height - 2 * config.tolerances.carcassThickness;
                  const newHeights = Array(v).fill(v > 0 ? internalHeight / v : 0);
                  onConfigChange({
                    ...config,
                    numberOfDrawers: v,
                    drawerHeights: newHeights,
                  });
                }}
              />
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
              <span className="text-sm text-slate-400 font-medium">
                {isMediaLowboard ? 'Add Front Doors (hide drawers)' : 'Add Front Doors'}
              </span>
              <button
                role="switch"
                aria-checked={config.hasDoors}
                onClick={() =>
                  onConfigChange({
                    ...config,
                    hasDoors: !config.hasDoors,
                  })
                }
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 cursor-pointer ${
                  config.hasDoors ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    config.hasDoors ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4 border-b border-slate-800/60">
        <SectionHeader icon={Settings} label="Global System" />

        <div className="space-y-2">
          <span className="text-sm text-slate-400">Door Front Style</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onConfigChange({ ...config, doorStyle: 'overlay' })}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                config.doorStyle === 'overlay'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              Full Overlay
            </button>
            <button
              onClick={() => onConfigChange({ ...config, doorStyle: 'inset' })}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                config.doorStyle === 'inset'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              In-Set
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-slate-400 font-medium">Line-Boring Matrix (32mm)</span>
          <button
            role="switch"
            aria-checked={config.showLineBoring}
            onClick={() => onConfigChange({ ...config, showLineBoring: !config.showLineBoring })}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 cursor-pointer ${
              config.showLineBoring ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                config.showLineBoring ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {isAlcove && (
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-slate-400 font-medium">Face-Frame Library Mode</span>
            <button
              role="switch"
              aria-checked={config.useFaceFrame}
              onClick={() => onConfigChange({ ...config, useFaceFrame: !config.useFaceFrame })}
              className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 cursor-pointer ${
                config.useFaceFrame ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  config.useFaceFrame ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}
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
        className="lg:hidden fixed bottom-24 right-4 z-[9999] flex items-center justify-center gap-2 px-4 h-12 rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-bold transition-transform active:scale-95"
        aria-label="Open Modeler Settings"
      >
        <SlidersHorizontal className="w-5 h-5" />
        <span>Modeler Settings</span>
      </button>

      {/* ── Mobile overlay & drawer ──────────────────── */}
      {mobileOpen && (
        <>
          {/* Scrim */}
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="lg:hidden fixed inset-y-0 left-0 z-[60] w-80 max-w-[85vw] bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 shadow-2xl animate-in slide-in-from-left duration-300">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
