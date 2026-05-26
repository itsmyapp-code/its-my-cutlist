"use client";

import React, { useState } from "react";
import { 
  Cloud, 
  Plus, 
  Trash2, 
  Check, 
  Database,
  ArrowDownToLine,
  Lock,
  RefreshCw,
  UserCheck
} from "lucide-react";
import { StockSettings } from "@/utils/optimizer";

interface SharedInventoryProps {
  user: any;
  centralInventory: any[];
  loadingCentralInventory: boolean;
  onPullToScraps: (item: any) => Promise<void>;
  onReleaseOffcut: (itemId: string) => Promise<void>;
  onConsumeOffcut: (itemId: string) => Promise<void>;
  onAddManualOffcut: (offcut: { length: number; width?: number; materialType: string; thickness: string }) => Promise<void>;
  onTriggerLogin: () => void;
  settings: StockSettings;
}

export function SharedInventory({
  user,
  centralInventory,
  loadingCentralInventory,
  onPullToScraps,
  onReleaseOffcut,
  onConsumeOffcut,
  onAddManualOffcut,
  onTriggerLogin,
  settings
}: SharedInventoryProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [formLength, setFormLength] = useState("");
  const [formWidth, setFormWidth] = useState("");
  const [formMaterial, setFormMaterial] = useState(settings.materialType || "");
  const [formThickness, setFormThickness] = useState(settings.thickness || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLength) return;
    setIsSubmitting(true);
    try {
      await onAddManualOffcut({
        length: parseFloat(formLength),
        width: formWidth ? parseFloat(formWidth) : undefined,
        materialType: formMaterial || "General",
        thickness: formThickness || "Generic"
      });
      setFormLength("");
      setFormWidth("");
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sync preset input fields if settings change and fields are empty
  React.useEffect(() => {
    if (settings.materialType && !formMaterial) {
      setFormMaterial(settings.materialType);
    }
    if (settings.thickness && !formThickness) {
      setFormThickness(settings.thickness);
    }
  }, [settings]);

  if (!user) {
    return (
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/80 shadow-2xl flex flex-col items-center text-center gap-4">
        {/* Glow effect */}
        <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-emerald-500/10 blur-xl"></div>
        <div className="absolute -bottom-12 -left-12 h-24 w-24 rounded-full bg-indigo-500/10 blur-xl"></div>

        <div className="h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-450 shadow-inner">
          <Lock size={20} className="text-slate-400" />
        </div>

        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Shared Workshop Inventory</h4>
          <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
            Centralized offcut repository. Sync jobs across devices, view team stock, and allocate raw offcuts to minimize workshop waste.
          </p>
        </div>

        <button
          onClick={onTriggerLogin}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-450 hover:to-teal-450 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all flex items-center gap-2 focus:outline-none"
        >
          <Cloud size={14} />
          <span>Connect Workshop Account</span>
        </button>
      </div>
    );
  }

  // Filter available versus reserved by this user
  const availableItems = centralInventory.filter(item => item.status === "available");
  const myReservedItems = centralInventory.filter(item => item.status === "reserved" && item.reservedByUser === user.email);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-350 uppercase tracking-widest font-mono">Shared Stock Database</span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1 ${
              isAdding 
                ? "bg-rose-955/20 border-rose-900/30 text-rose-400" 
                : "bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300"
            }`}
          >
            <Plus size={12} className={isAdding ? "rotate-45 transition-transform" : ""} />
            {isAdding ? "Cancel" : "Add Board"}
          </button>
        </div>
      </div>

      {/* Manual Input Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Material</label>
              <input
                type="text"
                placeholder="e.g. MDF, Plywood"
                value={formMaterial}
                onChange={e => setFormMaterial(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Thickness</label>
              <input
                type="text"
                placeholder="e.g. 18mm, 1/2in"
                value={formThickness}
                onChange={e => setFormThickness(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Length ({settings.unit})</label>
              <input
                type="number"
                placeholder="Length"
                required
                min="1"
                value={formLength}
                onChange={e => setFormLength(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Width (Optional)</label>
              <input
                type="number"
                placeholder="Width (For 2D Sheets)"
                min="1"
                value={formWidth}
                onChange={e => setFormWidth(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/30 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-455 text-slate-955 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors focus:outline-none disabled:opacity-50"
          >
            {isSubmitting ? "Publishing..." : "Add to Shared Stock"}
          </button>
        </form>
      )}

      {/* Reserved Items Section */}
      {myReservedItems.length > 0 && (
        <div className="space-y-2 bg-indigo-500/5 border border-indigo-500/20 p-3 rounded-xl">
          <div className="flex items-center gap-1.5">
            <UserCheck size={12} className="text-indigo-400" />
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">My Claimed Workspace Offcuts</span>
          </div>
          
          <div className="divide-y divide-indigo-500/10">
            {myReservedItems.map((item) => (
              <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                <div className="font-mono">
                  <span className="font-bold text-slate-200">
                    {item.length}
                    {item.width ? ` × ${item.width}` : ""} {settings.unit}
                  </span>
                  <span className="text-[10px] text-slate-550 ml-2">({item.materialType} {item.thickness})</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onReleaseOffcut(item.id)}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-300 rounded border border-slate-800 text-[10px]"
                    title="Return to central stock pool"
                  >
                    Release
                  </button>
                  <button
                    onClick={() => onConsumeOffcut(item.id)}
                    className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-[10px] flex items-center gap-0.5"
                    title="Mark as cut / destroyed"
                  >
                    <Check size={10} />
                    <span>Cut</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Database Listing */}
      {loadingCentralInventory ? (
        <div className="py-6 flex flex-col items-center gap-2">
          <RefreshCw size={20} className="animate-spin text-emerald-500" />
          <span className="text-[10px] font-mono text-slate-550">Querying stock database...</span>
        </div>
      ) : availableItems.length === 0 ? (
        <div className="py-6 text-center border border-dashed border-slate-850 rounded-xl bg-slate-950/20">
          <p className="text-xs text-slate-500">No active offcuts available in workshop inventory.</p>
          <p className="text-[10px] text-slate-600 mt-1">Publish optimized layouts or add manually above.</p>
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {availableItems.map((item) => (
            <div
              key={item.id}
              className="p-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl flex items-center justify-between gap-3 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {item.length}
                    {item.width ? ` × ${item.width}` : ""} {settings.unit}
                  </span>
                  <span className="text-[9px] text-slate-500 truncate font-mono">
                    by {item.createdByUser?.split("@")[0]}
                  </span>
                </div>
                <div className="flex gap-2 text-[9px] text-slate-500 mt-0.5 font-mono">
                  <span>{item.materialType}</span>
                  <span>•</span>
                  <span>{item.thickness}</span>
                </div>
              </div>

              <button
                onClick={() => onPullToScraps(item)}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 focus:outline-none"
              >
                <ArrowDownToLine size={12} />
                <span>Claim</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
