'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Settings,
  X,
  Briefcase,
  Wrench,
  SlidersHorizontal,
  Eye,
  ChevronDown,
  ChevronUp,
  Menu,
  LogOut,
} from 'lucide-react';
import type { FurnitureConfig, ViewSettings, ShelfBaseOption, BackFitOption } from '@/types/furniture';
import { auth } from '@/utils/firebase';
import { signOut } from 'firebase/auth';

interface HamburgerMenuProps {
  config: FurnitureConfig;
  viewSettings: ViewSettings;
  onConfigChange: (config: FurnitureConfig) => void;
  onViewSettingsChange: (settings: ViewSettings) => void;
  jobName: string;
  onJobNameChange: (v: string) => void;
  customerName: string;
  onCustomerNameChange: (v: string) => void;
  companyName: string;
  onCompanyNameChange: (v: string) => void;
  operatorName: string;
  onOperatorNameChange: (v: string) => void;
}

export default function HamburgerMenu({
  config,
  viewSettings,
  onConfigChange,
  onViewSettingsChange,
  jobName,
  onJobNameChange,
  customerName,
  onCustomerNameChange,
  companyName,
  onCompanyNameChange,
  operatorName,
  onOperatorNameChange,
}: HamburgerMenuProps) {
  const [open, setOpen] = useState(false);
  const [tolerancesOpen, setTolerancesOpen] = useState(false);

  const updateTolerance = (key: keyof typeof config.tolerances, value: number) => {
    onConfigChange({
      ...config,
      tolerances: {
        ...config.tolerances,
        [key]: value,
      },
    });
  };

  const handleShelfBaseChange = (option: ShelfBaseOption) => {
    onConfigChange({
      ...config,
      shelfBase: option,
    });
  };

  const handleBackFitChange = (option: BackFitOption) => {
    onConfigChange({
      ...config,
      backFit: option,
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/35 transition-all shadow-sm cursor-pointer"
        aria-label="Open settings menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Render Portal under document.body to prevent layout overlapping/stacking context bugs */}
      {open && typeof document !== 'undefined' && createPortal(
        <>
          {/* Subtle click-away scrim */}
          <div
            className="fixed inset-0 z-[9998] bg-slate-950/20 backdrop-blur-[1px] transition-opacity duration-300"
            onClick={() => setOpen(false)}
          />

          {/* Floating Dropdown Card aligned to Left Hand Side below header */}
          <aside
            className="fixed top-14 left-4 z-[9999] w-[calc(100vw-2rem)] sm:w-[420px] max-h-[82vh] bg-slate-900/98 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200"
            style={{
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/30">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-205 uppercase tracking-wider">Extra Controls</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800/50 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-track-slate-900 scrollbar-thumb-slate-700">
              
              {/* Section 1: Job & Report Details */}
              <section className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Briefcase className="w-4 h-4" />
                  Job & Report Details
                </h4>
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Job Reference</label>
                    <input
                      type="text"
                      value={jobName}
                      onChange={(e) => onJobNameChange(e.target.value)}
                      placeholder="e.g. Wardrobe Job A"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Customer Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => onCustomerNameChange(e.target.value)}
                      placeholder="e.g. John Smith"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Company Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => onCompanyNameChange(e.target.value)}
                      placeholder="e.g. Custom Cabinetry Ltd"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Operator</label>
                    <input
                      type="text"
                      value={operatorName}
                      onChange={(e) => onOperatorNameChange(e.target.value)}
                      placeholder="e.g. Sarah Connor"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-colors"
                    />
                  </div>
                </div>
              </section>

              <hr className="border-slate-800" />

              {/* Section 2: Hardware & Construction options */}
              <section className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Wrench className="w-4 h-4" />
                  Hardware & Materials
                </h4>

                {/* Shelf Fitting Choices */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Internal Shelf Fitting</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => handleShelfBaseChange('router_slots')}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        config.shelfBase === 'router_slots'
                          ? 'bg-emerald-500/10 border-emerald-500/80 text-emerald-400 font-bold shadow-lg shadow-emerald-500/5'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-750 text-slate-400'
                      }`}
                    >
                      <span className="text-sm font-bold text-slate-200">Fit in Router Slots (+12mm width)</span>
                      <span className="text-xs text-slate-400 mt-1 leading-snug">
                        Shelves slot 6mm into the carcass side panels on each side (adds 12mm total to shelf cut width).
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShelfBaseChange('solid_12mm_biscuits')}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        config.shelfBase === 'solid_12mm_biscuits'
                          ? 'bg-emerald-500/10 border-emerald-500/80 text-emerald-400 font-bold shadow-lg shadow-emerald-500/5'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-750 text-slate-400'
                      }`}
                    >
                      <span className="text-sm font-bold text-slate-200">Solid 12mm (Biscuits & Glue)</span>
                      <span className="text-xs text-slate-400 mt-1 leading-snug">
                        Shelves are made of solid 12mm material (fitted flush using biscuits and adhesive).
                      </span>
                    </button>
                  </div>
                </div>

                {/* Back Panel Fitting Choices */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">Back Panel Fitting</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => handleBackFitChange('nailed')}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        config.backFit === 'nailed'
                          ? 'bg-emerald-500/10 border-emerald-500/80 text-emerald-400 font-bold shadow-lg shadow-emerald-500/5'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-750 text-slate-400'
                      }`}
                    >
                      <span className="text-sm font-bold text-slate-200">Nailed to Back of Carcass</span>
                      <span className="text-xs text-slate-400 mt-1 leading-snug">
                        Back panel is nailed directly onto the rear edges of the side panels (no recess).
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBackFitChange('dado_joint')}
                      className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        config.backFit === 'dado_joint'
                          ? 'bg-emerald-500/10 border-emerald-500/80 text-emerald-400 font-bold shadow-lg shadow-emerald-500/5'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-750 text-slate-400'
                      }`}
                    >
                      <span className="text-sm font-bold text-slate-200">Dado Joint Groove (Recessed)</span>
                      <span className="text-xs text-slate-400 mt-1 leading-snug">
                        Back panel is recessed/inset into routed side, top, & bottom grooves (9mm depth).
                      </span>
                    </button>
                  </div>
                </div>
              </section>

              <hr className="border-slate-850" />

              {/* Section 3: Advanced Tolerances (Collapsible) */}
              <section className="space-y-2">
                <button
                  type="button"
                  onClick={() => setTolerancesOpen(!tolerancesOpen)}
                  className="flex items-center justify-between w-full py-2 text-left cursor-pointer text-slate-300 hover:text-slate-100"
                >
                  <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <SlidersHorizontal className="w-4 h-4" />
                    Advanced Tolerances & Runners
                  </h4>
                  {tolerancesOpen ? (
                    <ChevronUp className="w-5 h-5 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  )}
                </button>

                {tolerancesOpen && (
                  <div className="space-y-5 pt-4 border-t border-slate-850 animate-in fade-in duration-200">
                    
                    {/* Carcass Thickness */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300">Carcass panel thickness</span>
                        <span className="font-bold text-slate-400">{config.tolerances.carcassThickness} mm</span>
                      </div>
                      <input
                        type="range"
                        min={9}
                        max={30}
                        value={config.tolerances.carcassThickness}
                        onChange={(e) => updateTolerance('carcassThickness', Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Thickness of top, bottom, and side panels (cabinetry standard is 18mm).
                      </p>
                    </div>

                    {/* Back Panel Thickness */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300">Back panel thickness</span>
                        <span className="font-bold text-slate-400">{config.tolerances.backPanelThickness} mm</span>
                      </div>
                      <input
                        type="range"
                        min={3}
                        max={19}
                        value={config.tolerances.backPanelThickness}
                        onChange={(e) => updateTolerance('backPanelThickness', Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Thickness of the rear back panel sheet (typically 6mm ply).
                      </p>
                    </div>

                    {/* Runner Clearance */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-350">Drawer runner clearance (gap per side)</span>
                        <span className="font-bold text-slate-400">{config.tolerances.runnerClearance} mm</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={25}
                        value={config.tolerances.runnerClearance}
                        onChange={(e) => updateTolerance('runnerClearance', Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <p className="text-[11px] text-slate-500 leading-normal">
                        The gap required on each side between the drawer box and the side panels to fit metal runners/slides (standard slides are 13mm).
                      </p>
                    </div>

                    {/* Back Inset */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300">Back panel recess inset</span>
                        <span className="font-bold text-slate-400">{config.tolerances.backInset} mm</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={30}
                        value={config.tolerances.backInset}
                        onChange={(e) => updateTolerance('backInset', Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Depth of back panel groove/rebate from the back carcass edge (typically 9mm).
                      </p>
                    </div>

                    {/* Drawer Box Thickness */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300">Drawer box wall thickness</span>
                        <span className="font-bold text-slate-400">{config.tolerances.drawerBoxThickness} mm</span>
                      </div>
                      <input
                        type="range"
                        min={9}
                        max={25}
                        value={config.tolerances.drawerBoxThickness}
                        onChange={(e) => updateTolerance('drawerBoxThickness', Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Material thickness used to manufacture internal drawer boxes (typically 12mm).
                      </p>
                    </div>

                    {/* Door Gap */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300">Door gap margin</span>
                        <span className="font-bold text-slate-400">{config.tolerances.doorGap} mm</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        value={config.tolerances.doorGap}
                        onChange={(e) => updateTolerance('doorGap', Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Clearance gap around wardrobe doors to prevent rubbing (typically 2mm).
                      </p>
                    </div>

                    {/* Drawer Front Gap */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-300">Drawer front spacing</span>
                        <span className="font-bold text-slate-400">{config.tolerances.drawerFrontGap} mm</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        value={config.tolerances.drawerFrontGap}
                        onChange={(e) => updateTolerance('drawerFrontGap', Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Vertical gap spacing between adjacent drawer fronts on the carcass face (typically 3mm).
                      </p>
                    </div>

                  </div>
                )}
              </section>

              <hr className="border-slate-850" />

              {/* Section 4: View settings */}
              <section className="space-y-4">
                <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Eye className="w-4 h-4" />
                  View Controls
                </h4>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-semibold text-slate-300">Wireframe Mode</span>
                    <button
                      role="switch"
                      aria-checked={viewSettings.wireframe}
                      onClick={() =>
                        onViewSettingsChange({ ...viewSettings, wireframe: !viewSettings.wireframe })
                      }
                      className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 cursor-pointer ${
                        viewSettings.wireframe ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          viewSettings.wireframe ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </label>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-300">Exploded View</span>
                      <span className="font-bold text-slate-400 tabular-nums">
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
                        onViewSettingsChange({ ...viewSettings, explodedFactor: Number(e.target.value) })
                      }
                      className="w-full h-1.5 bg-slate-950 rounded-full appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>
              </section>

              <hr className="border-slate-850" />
              
              <section className="pt-2">
                <button
                  onClick={() => signOut(auth)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </section>
            </div>
          </aside>
        </>,
        document.body
      )}
    </>
  );
}
