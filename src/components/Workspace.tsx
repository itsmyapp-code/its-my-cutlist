"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  CreditCard
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
  });
  
  const [license, setLicense] = useState<LicenseState>({
    isPro: false,
  });

  // Unique Device ID
  const [deviceId, setDeviceId] = useState("");

  // UI state
  const [licenseKeyInput, setLicenseKeyInput] = useState("");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
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
  const handleQuickPasteParse = (parsedItems: { length: number; quantity: number }[]) => {
    const existingPartsMap = new Map(parts.map((p) => [p.length, p]));
    const updatedParts = [...parts];

    for (const item of parsedItems) {
      // Check free limit restriction
      if (!license.isPro && updatedParts.length >= 5 && !existingPartsMap.has(item.length)) {
        setIsUpgradeModalOpen(true);
        break; // stop adding if limit hit
      }

      if (existingPartsMap.has(item.length)) {
        // Increment quantity of existing length
        const ext = existingPartsMap.get(item.length)!;
        ext.quantity += item.quantity;
      } else {
        const newPart: Part = {
          id: Math.random().toString(36).substr(2, 9),
          length: item.length,
          quantity: item.quantity,
          label: `Imported`,
        };
        updatedParts.push(newPart);
        existingPartsMap.set(item.length, newPart);
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
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
      {/* ---------------------------------------------------- */}
      {/* WORKSHOP HEADER SECTION                              */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
              ITS MY <span className="text-emerald-400">CUTLIST</span>
            </h1>
            <span className={`text-[10px] font-bold tracking-widest font-mono uppercase px-2 py-0.5 rounded-full ${
              license.isPro 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" 
                : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
            }`}>
              {license.isPro ? "PRO LICENSE ACTIVE" : "FREE TIER"}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Browser-based 1D bin-packing optimization. Zero tracking, zero storage.
          </p>
        </div>

        {/* License Action / Summary */}
        <div className="flex items-center gap-3">
          {license.isPro ? (
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <div className="text-left font-mono">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Licensed Key</span>
                <span className="text-xs text-white font-bold">{license.licenseKey?.slice(0, 10)}...</span>
              </div>
              <button
                onClick={handleDeactivateLicense}
                className="text-[10px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-wider pl-2 border-l border-slate-800 focus:outline-none"
              >
                Deactivate
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 focus:outline-none"
            >
              <Sparkles size={14} />
              Unlock Pro License
            </button>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* ASYMMETRICAL BENTO GRID WORKSPACE                    */}
      {/* ---------------------------------------------------- */}
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
            <QuickPasteCLI onParse={handleQuickPasteParse} />
          </BentoBox>

          {/* Box 3: Dynamic Part Matrix (Spreadsheet) */}
          <BentoBox 
            title="Dynamic Part Matrix" 
            subtitle="Spreadsheet matrix of required cuts"
            icon={<Grid size={16} />}
            badge={license.isPro ? "Unlimited" : "Max 5 Rows"}
            badgeType={license.isPro ? "success" : "warning"}
          >
            <PartMatrix
              parts={parts}
              setParts={setParts}
              isPro={license.isPro}
              onUpgradeTrigger={() => setIsUpgradeModalOpen(true)}
              unit={settings.unit}
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
              unit={settings.unit}
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
            />
          </BentoBox>
        </div>
      </BentoGrid>

      {/* ---------------------------------------------------- */}
      {/* PRO UPGRADE MODAL                                    */}
      {/* ---------------------------------------------------- */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6">
            <button
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 focus:outline-none"
            >
              <X size={18} />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-amber-400 animate-pulse" size={20} />
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
        </div>
      )}
    </div>
  );
}
