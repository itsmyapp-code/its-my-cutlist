"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Settings, 
  Terminal, 
  Grid, 
  Layers, 
  Activity, 
  FileText,
  Key,
  ShieldCheck,
  Smartphone,
  Lock,
  Sparkles,
  Info,
  CheckCircle,
  X,
  CreditCard,
  HelpCircle,
  Menu,
  Copy
} from "lucide-react";
import { BentoGrid, BentoBox } from "./BentoGrid";
import { MaterialProfilePanel, QuickPasteCLI, PartMatrix, ScrapPile } from "./InputGrid";
import { VisualCanvas } from "./VisualCanvas";
import { optimizeCutlist, Part, Scrap, StockSettings, LicenseState } from "@/utils/optimizer";

export default function Workspace() {
  // ----------------------------------------------------
  // 1. STATE INITIALIZATION
  // ----------------------------------------------------
  const [mounted, setMounted] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [scraps, setScraps] = useState<Scrap[]>([]);
  const [settings, setSettings] = useState<StockSettings>({
    stockLength: 2400,
    bladeKerf: 3,
    unit: "mm",
    thickness: "",
    materialType: "",
  });
  
  const [license, setLicense] = useState<LicenseState>({
    isPro: false,
  });

  // Unique Device ID
  const [deviceId, setDeviceId] = useState("");

  // UI state
  const [licenseKeyInput, setLicenseKeyInput] = useState("");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [activationLoading, setActivationLoading] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);

  // ----------------------------------------------------
  // 2. LIFECYCLE & LOCALSTORAGE SYNC
  // ----------------------------------------------------
  useEffect(() => {
    // Generate/Fetch Device ID
    let devId = localStorage.getItem("itsmycut_device_id");
    if (!devId) {
      devId = "dev_" + Math.random().toString(36).substr(2, 12);
      localStorage.setItem("itsmycut_device_id", devId);
    }
    setDeviceId(devId);

    // Load initial states from LocalStorage
    const storedSettings = localStorage.getItem("itsmycut_settings");
    if (storedSettings) {
      try { setSettings(JSON.parse(storedSettings)); } catch (e) {}
    }

    const storedParts = localStorage.getItem("itsmycut_parts");
    if (storedParts) {
      try { setParts(JSON.parse(storedParts)); } catch (e) {}
    }

    const storedScraps = localStorage.getItem("itsmycut_scraps");
    if (storedScraps) {
      try { setScraps(JSON.parse(storedScraps)); } catch (e) {}
    }

    const storedToken = localStorage.getItem("itsmycut_pro_token");
    const storedKey = localStorage.getItem("itsmycut_pro_key");
    if (storedToken && storedKey) {
      // Decode JWT locally for confirmation
      try {
        const payload = JSON.parse(atob(storedToken.split(".")[0]));
        if (payload.activated && payload.licenseKey === storedKey) {
          setLicense({
            isPro: true,
            licenseKey: storedKey,
            activationToken: storedToken,
            deviceCount: payload.deviceCount,
          });
        }
      } catch (e) {
        // invalid token format
      }
    }

    // Register Service Worker for PWA support
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registered successfully with scope:", reg.scope);
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err);
        });
    }

    setMounted(true);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("itsmycut_settings", JSON.stringify(settings));
  }, [settings, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("itsmycut_parts", JSON.stringify(parts));
  }, [parts, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("itsmycut_scraps", JSON.stringify(scraps));
  }, [scraps, mounted]);

  // ----------------------------------------------------
  // 3. CORE CALCULATION ENGINE RUN
  // ----------------------------------------------------
  const optimizationResult = useMemo(() => {
    return optimizeCutlist(parts, scraps, settings);
  }, [parts, scraps, settings]);

  // ----------------------------------------------------
  // 4. ACTION HANDLERS
  // ----------------------------------------------------
  const handleAddScraps = (newScraps: { length: number; width?: number; label?: string }[]) => {
    setScraps((prev) => {
      const updated = [...prev];
      newScraps.forEach((s) => {
        const roundedLength = Math.round(s.length);
        const roundedWidth = s.width ? Math.round(s.width) : undefined;
        const existing = updated.find(
          (item) => item.length === roundedLength && item.width === roundedWidth
        );
        if (existing) {
          existing.quantity += 1;
        } else {
          updated.push({
            id: "scrap_" + Math.random().toString(36).substr(2, 9),
            length: roundedLength,
            width: roundedWidth,
            quantity: 1,
            label: s.label || "Offcut",
          });
        }
      });
      return updated;
    });
  };

  const handleQuickPasteParse = (parsedItems: { length: number; quantity: number; width?: number }[]) => {
    const existingPartsMap = new Map(parts.map((p) => [`${p.length}x${p.width || 0}`, p]));
    const updatedParts = [...parts];

    for (const item of parsedItems) {
      const key = `${item.length}x${item.width || 0}`;
      // Check free limit restriction
      if (!license.isPro && updatedParts.length >= 5 && !existingPartsMap.has(key)) {
        setIsUpgradeModalOpen(true);
        break; // stop adding if limit hit
      }

      if (existingPartsMap.has(key)) {
        // Increment quantity of existing length + width combination
        const ext = existingPartsMap.get(key)!;
        ext.quantity += item.quantity;
      } else {
        const newPart: Part = {
          id: Math.random().toString(36).substr(2, 9),
          length: item.length,
          width: item.width,
          quantity: item.quantity,
          label: `Imported`,
        };
        updatedParts.push(newPart);
        existingPartsMap.set(key, newPart);
      }
    }

    setParts(updatedParts);
  };

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKeyInput.trim()) return;

    setActivationLoading(true);
    setActivationError(null);
    setActivationSuccess(null);

    try {
      const response = await fetch("/api/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          licenseKey: licenseKeyInput.trim().toUpperCase(),
          deviceId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("itsmycut_pro_token", data.token);
        localStorage.setItem("itsmycut_pro_key", licenseKeyInput.trim().toUpperCase());
        
        setLicense({
          isPro: true,
          licenseKey: licenseKeyInput.trim().toUpperCase(),
          activationToken: data.token,
          deviceCount: data.deviceCount,
        });
        
        setActivationSuccess("Pro License Activated! Unlimited rows unlocked.");
        setLicenseKeyInput("");
        setTimeout(() => {
          setIsUpgradeModalOpen(false);
          setActivationSuccess(null);
        }, 1500);
      } else {
        setActivationError(data.error || "Failed to validate license key.");
      }
    } catch (err) {
      setActivationError("Network error. Please check your internet connection.");
    } finally {
      setActivationLoading(false);
    }
  };

  const handleDeactivateLicense = () => {
    if (confirm("Are you sure you want to deactivate and remove this license? This device will return to the Free Tier limit.")) {
      localStorage.removeItem("itsmycut_pro_token");
      localStorage.removeItem("itsmycut_pro_key");
      setLicense({ isPro: false });
      alert("License deactivated. Device returned to Free Tier.");
    }
  };

  const handleLoadPreset = (preset: {
    name: string;
    length: number;
    width: number;
    type: string;
    thick: string;
    unit: string;
  }) => {
    setSettings((prev) => ({
      ...prev,
      stockLength: preset.length,
      stockWidth: preset.width > 0 ? preset.width : undefined,
      materialType: preset.type,
      thickness: preset.thick,
      unit: preset.unit as "mm" | "cm" | "in",
    }));
    setIsDrawerOpen(false);
  };

  const handleUpdateKerf = (val: number) => {
    setSettings((prev) => ({
      ...prev,
      bladeKerf: val,
    }));
  };

  const handleExportWorkspace = () => {
    const backupData = {
      settings,
      parts,
      scraps,
    };
    navigator.clipboard.writeText(JSON.stringify(backupData, null, 2));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  const handleImportWorkspace = () => {
    setImportError(null);
    setImportSuccess(null);
    try {
      const parsed = JSON.parse(importJsonText.trim());
      if (parsed.settings) {
        setSettings(parsed.settings);
      }
      if (parsed.parts) {
        setParts(parsed.parts);
      }
      if (parsed.scraps) {
        setScraps(parsed.scraps);
      }
      setImportSuccess("Job loaded successfully!");
      setImportJsonText("");
      setTimeout(() => {
        setIsDrawerOpen(false);
        setImportSuccess(null);
      }, 1500);
    } catch (e) {
      setImportError("Invalid JSON format. Check your pasted string.");
    }
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to delete all parts, scraps, and reset settings? This cannot be undone.")) {
      setParts([]);
      setScraps([]);
      setSettings({
        stockLength: 2400,
        bladeKerf: 3,
        unit: "mm",
        thickness: "",
        materialType: "",
      });
      setIsDrawerOpen(false);
    }
  };

  const is2DMode = !!(settings.stockWidth && settings.stockWidth > 0);

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono">Initializing Workshop Cockpit...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full">
      {/* ---------------------------------------------------- */}
      {/* GLOBAL HEADER                                        */}
      {/* ---------------------------------------------------- */}
      <header className="border-b border-slate-900 bg-slate-955/80 backdrop-blur sticky top-0 z-30 px-4 sm:px-6 py-4 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Image
              src="/cutlist-logo.png"
              alt="Its My Cutlist Logo"
              width={36}
              height={36}
              className="rounded-lg object-contain border border-slate-800 shadow-lg"
              priority
            />
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white uppercase block sm:inline-block leading-none">
                ITS MY <span className="text-emerald-400">CUTLIST</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono block sm:hidden">Workshop Dashboard</span>
            </div>
            <span className={`hidden sm:inline-block text-[9px] font-bold tracking-widest font-mono uppercase px-2.5 py-0.5 rounded-md ${
              license.isPro 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 animate-pulse" 
                : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
            }`}>
              {license.isPro ? "Pro Active" : "Free Tier"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-850">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              100% Offline Engine
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-850">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
              Private by Design
            </span>

            {/* Hamburger Options Trigger */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/30 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
            >
              <Menu size={16} className="text-emerald-400" />
              <span>Options &amp; Presets</span>
            </button>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* SLIDEOUT OPTIONS & IMPORT DRAWER                    */}
      {/* ---------------------------------------------------- */}
      {isDrawerOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[99] transition-opacity duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-850 shadow-2xl z-[100] flex flex-col transform transition-transform duration-300 ease-out">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Menu className="text-emerald-400" size={18} />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Presets &amp; Settings</h3>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-lg focus:outline-none"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Section 1: Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">1. Material Presets</h4>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">1-Click Load</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Instantly configure board sizes, thicknesses, and material profiles.
                </p>

                {/* Sub-section: 2D Sheet Presets */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sheet Materials (2D Planar)</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: "MDF 18mm", length: 2440, width: 1220, type: "MDF", thick: "18mm", unit: "mm" },
                      { name: "MDF 12mm", length: 2440, width: 1220, type: "MDF", thick: "12mm", unit: "mm" },
                      { name: "Plywood 18mm", length: 2440, width: 1220, type: "Plywood", thick: "18mm", unit: "mm" },
                      { name: "Plywood 12mm", length: 2440, width: 1220, type: "Plywood", thick: "12mm", unit: "mm" },
                      { name: "Euro Ply 18mm", length: 2500, width: 1250, type: "Euro Plywood", thick: "18mm", unit: "mm" },
                      { name: "US 4x8 ft (3/4\")", length: 96, width: 48, type: "Plywood", thick: "3/4\"", unit: "in" },
                      { name: "US 4x8 ft (1/2\")", length: 96, width: 48, type: "Plywood", thick: "1/2\"", unit: "in" },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleLoadPreset(preset)}
                        className="p-2.5 bg-slate-950 hover:bg-slate-850 hover:border-emerald-500/40 border border-slate-850 text-left rounded-xl transition-all group focus:outline-none"
                      >
                        <span className="block text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{preset.name}</span>
                        <span className="block text-[9px] text-slate-500 font-mono mt-0.5">
                          {preset.length} × {preset.width} {preset.unit}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub-section: 1D Length Presets */}
                <div className="space-y-2 pt-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Timber &amp; Planks (1D Linear)</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: "CLS Timber 2.4m", length: 2400, width: 0, type: "CLS Timber", thick: "38x89mm", unit: "mm" },
                      { name: "CLS Timber 3.0m", length: 3000, width: 0, type: "CLS Timber", thick: "38x89mm", unit: "mm" },
                      { name: "CLS Timber 4.8m", length: 4800, width: 0, type: "CLS Timber", thick: "38x89mm", unit: "mm" },
                      { name: "US 2x4 Stud 8ft", length: 96, width: 0, type: "Lumber", thick: "2x4", unit: "in" },
                      { name: "US 2x4 Stud 10ft", length: 120, width: 0, type: "Lumber", thick: "2x4", unit: "in" },
                      { name: "Metal Section 6m", length: 6000, width: 0, type: "Steel Profile", thick: "3mm Wall", unit: "mm" },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleLoadPreset(preset)}
                        className="p-2.5 bg-slate-955 hover:bg-slate-850 hover:border-indigo-500/40 border border-slate-850 text-left rounded-xl transition-all group focus:outline-none"
                      >
                        <span className="block text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{preset.name}</span>
                        <span className="block text-[9px] text-slate-500 font-mono mt-0.5">
                          {preset.length} {preset.unit} length
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 2: Blade Kerf Presets */}
              <div className="space-y-3 pt-2 border-t border-slate-850">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">2. Blade Kerf Presets</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Table Saw", value: 3.2 },
                    { label: "Thin Kerf", value: 2.4 },
                    { label: "Bandsaw", value: 1.5 },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleUpdateKerf(preset.value)}
                      className={`p-2 bg-slate-950 hover:bg-slate-850 border rounded-lg text-center transition-all focus:outline-none ${
                        settings.bladeKerf === preset.value ? "border-emerald-500 text-white" : "border-slate-850 text-slate-400"
                      }`}
                    >
                      <span className="block text-[9px] font-bold truncate">{preset.label}</span>
                      <span className="block text-xs font-mono font-bold text-emerald-450 mt-0.5">{preset.value}mm</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 3: Pro License Center */}
              <div className="space-y-3 pt-2 border-t border-slate-850">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">3. Pro License Status</h4>
                {license.isPro ? (
                  <div className="p-4 bg-slate-955/60 border border-slate-850 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={18} className="text-emerald-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Pro License Active</span>
                    </div>
                    <div className="font-mono text-[10px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Key:</span>
                        <span className="text-slate-300">{license.licenseKey?.slice(0, 12)}...</span>
                      </div>
                      {license.deviceCount !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Devices:</span>
                          <span className="text-slate-300">{license.deviceCount} / 3</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleDeactivateLicense}
                      className="w-full py-1.5 bg-rose-955/20 hover:bg-rose-955/40 border border-rose-900/30 text-rose-400 hover:text-rose-350 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all focus:outline-none"
                    >
                      Deactivate License
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-500">
                      Unlock unlimited parts lists and custom blade/board settings presets.
                    </p>
                    <form onSubmit={handleActivateLicense} className="space-y-2">
                      <input
                        type="text"
                        placeholder="ENTER LICENSE KEY"
                        value={licenseKeyInput}
                        onChange={(e) => setLicenseKeyInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 focus:border-emerald-500/40 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono text-center placeholder:text-slate-650 uppercase tracking-widest focus:outline-none"
                      />
                      {activationError && <p className="text-[10px] text-rose-450 font-mono">{activationError}</p>}
                      {activationSuccess && <p className="text-[10px] text-emerald-400 font-mono">{activationSuccess}</p>}
                      <button
                        type="submit"
                        disabled={activationLoading}
                        className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5 focus:outline-none disabled:opacity-50"
                      >
                        <Sparkles size={14} />
                        {activationLoading ? "Validating..." : "Activate Pro Key"}
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Section 4: Import/Export Backup */}
              <div className="space-y-3 pt-2 border-t border-slate-850">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">4. Import &amp; Export Job</h4>
                  <span className="text-[9px] text-slate-500 font-mono">Local JSON</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Backup current configuration or copy parts lists and scraps between devices.
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleExportWorkspace}
                    className="flex-1 py-2 px-3 bg-slate-950 hover:bg-slate-855 border border-slate-850 hover:border-emerald-500/20 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 focus:outline-none"
                  >
                    {copiedBackup ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copiedBackup ? "Copied!" : "Export Job JSON"}
                  </button>
                </div>

                <div className="space-y-1.5 pt-2">
                  <textarea
                    placeholder="Paste job JSON here to import..."
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    className="w-full h-20 bg-slate-950 border border-slate-850 focus:border-emerald-500/40 rounded-xl p-2.5 text-[10px] text-slate-300 font-mono focus:outline-none resize-none"
                  />
                  {importError && <p className="text-[10px] text-rose-455">{importError}</p>}
                  {importSuccess && <p className="text-[10px] text-emerald-400">{importSuccess}</p>}
                  
                  <button
                    onClick={handleImportWorkspace}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-955 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 focus:outline-none"
                  >
                    Load JSON Job
                  </button>
                </div>
              </div>

              {/* Section 5: Help Guide */}
              <div className="space-y-2 pt-2 border-t border-slate-850">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">5. Documentation</h4>
                <Link
                  href="/help"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-emerald-500/20 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 focus:outline-none"
                >
                  <HelpCircle size={14} className="text-emerald-400" />
                  View Help &amp; User Guide
                </Link>
              </div>

              {/* Section 6: Clear Workspace */}
              <div className="pt-2 border-t border-slate-850">
                <button
                  onClick={handleClearAll}
                  className="w-full py-2 bg-rose-955/20 hover:bg-rose-955/40 border border-rose-900/30 text-rose-350 hover:text-rose-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 focus:outline-none"
                >
                  Clear All Data
                </button>
              </div>

            </div>
          </div>
        </>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* ---------------------------------------------------- */}
        {/* ON-SCREEN INTERACTIVE UI                             */}
        {/* ---------------------------------------------------- */}
        <div className="print:hidden">
          {/* WORKSHOP HEADER SECTION */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
                  Workshop <span className="text-emerald-400">Cockpit</span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Configure material profiles and optimize cutting layouts with live waste feedback.
              </p>
            </div>
          </div>

        {/* ASYMMETRICAL BENTO GRID WORKSPACE */}
        <BentoGrid>
          {/* LEFT COLUMN: CONTROLS & INPUTS (Span 5 on large screens) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Box 1: Material & Cut Profile */}
            <BentoBox 
              title="Material &amp; Cut Profile" 
              subtitle="Define physical blade and board metrics"
              icon={<Settings size={16} />}
              badge="Profile"
            >
              <MaterialProfilePanel 
                settings={settings} 
                setSettings={setSettings} 
              />
            </BentoBox>

            {/* Box 2: Quick Paste CLI */}
            <BentoBox 
              title="Quick Paste CLI" 
              subtitle="Dump list from SMS, email or CSV"
              icon={<Terminal size={16} />}
              badge="Fast Import"
            >
              <QuickPasteCLI onParse={handleQuickPasteParse} is2DMode={is2DMode} />
            </BentoBox>

            {/* Box 3: Dynamic Part Matrix */}
            <BentoBox 
              title="Dynamic Part Matrix" 
              subtitle="Specify required dimensions and quantities"
              icon={<Layers size={16} />}
              badge="Input Matrix"
            >
              <PartMatrix
                parts={parts}
                setParts={setParts}
                settings={settings}
                isPro={license.isPro}
                onUpgradeTrigger={() => setIsUpgradeModalOpen(true)}
              />
            </BentoBox>

            {/* Box 4: The Scrap Pile */}
            <BentoBox 
              title="The Scrap Pile" 
              subtitle="Prioritize cutting scrap pieces first"
              icon={<Layers size={16} />}
              badge="Offcuts"
              badgeType="info"
            >
              <ScrapPile
                scraps={scraps}
                setScraps={setScraps}
                settings={settings}
              />
            </BentoBox>
          </div>

          {/* RIGHT COLUMN: RENDER CANVAS & MANIFEST (Span 7, row-span match) */}
          <div className="lg:col-span-7 flex flex-col h-full">
            <BentoBox 
              title="Live Render Canvas" 
              subtitle="Dynamic visual layouts and cut manifests"
              icon={<Activity size={16} />}
              badge="Calculated Live"
              badgeType="success"
              className="flex-1"
            >
              <VisualCanvas
                result={optimizationResult}
                unit={settings.unit}
                partsList={parts}
                bladeKerf={settings.bladeKerf}
                settings={settings}
                onAddScraps={handleAddScraps}
              />
            </BentoBox>
          </div>
        </BentoGrid>

        {/* PRO UPGRADE MODAL */}
        {isUpgradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6">
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-all text-lg font-bold focus:outline-none"
              >
                &times;
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <Sparkles size={20} />
                </div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                  Unlock Unlimited Cuts
                </h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Unlock full access to standard stock sheets, unlimited cutting matrix rows, 2D material bin-packing optimizations (coming soon), custom branding exports, and offline validation. 
              </p>

              {/* Pricing Cards (DMCCA Compliant) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase">Lifetime License Key</h4>
                    <span className="text-[9px] text-slate-500 block">No subscription, no auto-renewals</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-mono font-bold text-emerald-400">£29.00</span>
                    <span className="text-[9px] text-slate-500 block">Includes all local VAT</span>
                  </div>
                </div>

                <div className="border-t border-slate-900 pt-2.5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>14-Day Cooling-off Period</span>
                  <span>Allows up to 5 Devices</span>
                </div>
              </div>

              {/* Stripe Checkout Mock Trigger */}
              <a
                href="https://buy.stripe.com/mock-itsmycutlist-pro"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              >
                <CreditCard size={14} />
                Buy Lifetime Pro Key (£29)
              </a>

              <div className="flex items-center gap-2 my-4">
                <div className="border-t border-slate-800 flex-1"></div>
                <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Or Activate Key</span>
                <div className="border-t border-slate-800 flex-1"></div>
              </div>

              {/* Activation Form */}
              <form onSubmit={handleActivateLicense} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Paste License Key
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="IMC-XXXX-XXXX-XXXX"
                    value={licenseKeyInput}
                    onChange={(e) => setLicenseKeyInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-sm text-white font-mono uppercase tracking-wide focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>

                {activationError && (
                  <p className="text-xs text-rose-400 bg-rose-950/40 p-2 rounded-lg border border-rose-900/50">
                    {activationError}
                  </p>
                )}

                {activationSuccess && (
                  <p className="text-xs text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-900/50">
                    {activationSuccess}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={activationLoading}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white border border-slate-700/80 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                >
                  {activationLoading ? "Verifying..." : "Activate Offline Token"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* PROFESSIONAL PRINT-ONLY PDF DOCUMENT LAYOUT         */}
      {/* ---------------------------------------------------- */}
      <div className="hidden print:block w-full text-black bg-white font-sans p-2">
        {/* Job Header */}
        <div className="border-b-4 border-black pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase">ITS MY CUTLIST</h1>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-700">Workshop Cutting Instructions</p>
            </div>
            <div className="text-right text-xs font-mono">
              <p className="font-bold">Date: {new Date().toLocaleDateString()}</p>
              <p>Generated via Client App</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Material Name</span>
              <span className="text-sm font-bold">{settings.materialType || "Standard Stock"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Thickness</span>
              <span className="text-sm font-bold">{settings.thickness || "Not Specified"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Blade Kerf</span>
              <span className="text-sm font-bold font-mono">{settings.bladeKerf} {settings.unit}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Stock Size</span>
              <span className="text-sm font-bold font-mono">
                {settings.stockLength} {is2DMode ? `x ${settings.stockWidth}` : ""} {settings.unit}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Yield / Efficiency</span>
              <span className="text-lg font-black text-emerald-700">{optimizationResult.efficiencyScore.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Total Waste</span>
              <span className="text-lg font-black text-slate-700">{optimizationResult.totalWastePercent.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Sheets / Boards Used</span>
              <span className="text-lg font-black text-slate-800">
                {optimizationResult.stockBoardsUsed} Stock {optimizationResult.scrapBoardsUsed > 0 ? `+ ${optimizationResult.scrapBoardsUsed} Scrap` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Part Matrix Summary */}
        <div className="mb-8 page-break-inside-avoid">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-2 border-b border-black pb-1">Parts Checklist</h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th className="py-1 font-bold">Part Label</th>
                <th className="py-1 font-bold">Required Size</th>
                <th className="py-1 font-bold text-center">Qty Required</th>
                <th className="py-1 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((p) => {
                const isPlaced = optimizationResult.boards.some(b => 
                  b.cuts.some(c => c.partId === p.id)
                );
                return (
                  <tr key={p.id} className="border-b border-slate-200">
                    <td className="py-1.5 font-semibold uppercase font-mono">{p.label || "Imported Part"}</td>
                    <td className="py-1.5 font-mono">{p.length}{p.width ? ` x ${p.width}` : ""} {settings.unit}</td>
                    <td className="py-1.5 text-center font-mono">{p.quantity}</td>
                    <td className="py-1.5 text-center">
                      {isPlaced ? (
                        <span className="text-emerald-700 font-bold">Placed</span>
                      ) : (
                        <span className="text-rose-700 font-bold">Unplaced (Exceeds size)</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Board Cutting Instructions */}
        <div className="space-y-8">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-black pb-1">Cutting Layouts &amp; Steps</h2>
          {optimizationResult.boards.map((board, bIdx) => {
            const isScrap = board.type === "scrap";
            return (
              <div key={board.id} className="page-break-inside-avoid border border-slate-300 p-4 rounded-xl bg-white mb-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
                  <span className="text-sm font-bold">
                    Board #{bIdx + 1} - {isScrap ? "Scrap Offcut Board" : "Stock Board"}
                  </span>
                  <span className="text-xs font-mono font-bold">
                    Size: {board.originalLength}{is2DMode ? ` x ${board.originalWidth}` : ""} {settings.unit}
                  </span>
                </div>

                {/* Print Layout Diagram */}
                {is2DMode ? (
                  <div 
                    style={{ aspectRatio: `${board.originalLength} / ${board.originalWidth || 100}` }}
                    className="relative w-full border border-black bg-white mb-4 overflow-hidden"
                  >
                    {board.cuts.map((cut, cutIdx) => {
                      const cutW = cut.w || cut.length;
                      const cutH = cut.h || cut.width || 1;
                      return (
                        <div
                          key={cutIdx}
                          style={{
                            left: `${((cut.x || 0) / board.originalLength) * 100}%`,
                            top: `${((cut.y || 0) / board.originalWidth) * 100}%`,
                            width: `${(cutW / board.originalLength) * 100}%`,
                            height: `${(cutH / board.originalWidth) * 100}%`,
                          }}
                          className="absolute border border-black bg-slate-100 flex flex-col justify-center items-center p-1 text-black font-sans select-none"
                        >
                          <span className="text-[9px] font-bold font-mono leading-none">{cut.length}×{cut.width}</span>
                          {cut.label && <span className="text-[8px] truncate font-semibold uppercase leading-none mt-0.5">{cut.label}</span>}
                        </div>
                      );
                    })}
                    {/* Waste / Leftover Display */}
                    {board.wasteRects && board.wasteRects.map((rect, rectIdx) => (
                      <div
                        key={`waste-${rectIdx}`}
                        style={{
                          left: `${(rect.x / board.originalLength) * 100}%`,
                          top: `${(rect.y / board.originalWidth) * 100}%`,
                          width: `${(rect.w / board.originalLength) * 100}%`,
                          height: `${(rect.h / board.originalWidth) * 100}%`,
                        }}
                        className="absolute border border-dashed border-slate-400 bg-white flex flex-col justify-center items-center p-0.5 text-slate-500 font-mono text-[8px]"
                      >
                        <span>{rect.w.toFixed(0)}×{rect.h.toFixed(0)}</span>
                        <span className="text-[6px] uppercase tracking-wider">Offcut</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative h-12 w-full border border-black bg-white flex items-stretch mb-4 overflow-hidden">
                    {board.cuts.map((cut, cutIdx) => {
                      const cutWidth = (cut.length / board.originalLength) * 100;
                      return (
                        <div
                          key={cutIdx}
                          style={{ width: `${cutWidth}%` }}
                          className="border-r border-black bg-slate-100 flex flex-col justify-center items-center px-1 text-black font-sans"
                        >
                          <span className="text-[9px] font-bold font-mono">{cut.length}</span>
                          {cut.label && <span className="text-[8px] truncate font-semibold uppercase mt-0.5">{cut.label}</span>}
                        </div>
                      );
                    })}
                    {/* Waste portion */}
                    {board.waste > 0 && (
                      <div
                        style={{ width: `${(board.waste / board.originalLength) * 100}%` }}
                        className="bg-white flex flex-col justify-center items-center px-1 text-slate-500 font-mono text-[8px] border-dashed border-l border-slate-400"
                      >
                        <span>{board.waste.toFixed(0)}</span>
                        <span className="text-[6px] uppercase">Offcut</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Instructions Grid */}
                <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                  <div>
                    <h5 className="font-bold underline mb-1 uppercase tracking-wider text-[10px] text-slate-700">Cuts Checklist:</h5>
                    <ul className="space-y-1">
                      {board.cuts.map((c, cIdx) => {
                        const dimText = is2DMode ? `${c.length} × ${c.width}` : `${c.length}`;
                        return (
                          <li key={cIdx} className="flex items-center gap-2">
                            <span className="inline-block w-4 h-4 border border-slate-400 rounded flex-shrink-0 text-center font-mono font-bold text-[10px]"></span>
                            <span>
                              Cut {cIdx + 1}: <strong className="font-mono text-black">{dimText} {settings.unit}</strong> {c.label ? `(${c.label})` : ""}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-bold underline mb-1 uppercase tracking-wider text-[10px] text-slate-700">Leftovers (Offcuts):</h5>
                    {is2DMode ? (
                      <ul className="space-y-1 list-disc list-inside font-mono">
                        {board.wasteRects && board.wasteRects.length > 0 ? (
                          board.wasteRects.map((r, rIdx) => (
                            <li key={rIdx} className="text-slate-800">
                              Offcut: <strong>{r.w.toFixed(0)} × {r.h.toFixed(0)} {settings.unit}</strong>
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-500 italic">No reusable offcuts</li>
                        )}
                      </ul>
                    ) : (
                      <div className="font-mono text-slate-800">
                        {board.waste > 0 ? (
                          <span>Offcut: <strong>{board.waste.toFixed(0)} {settings.unit}</strong></span>
                        ) : (
                          <span className="text-slate-500 italic">No reusable offcuts</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
  );
}
