"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import HamburgerMenu from "@/components/furniture/HamburgerMenu";
import HelpModal from "@/components/furniture/HelpModal";
import PartsList from "@/components/furniture/PartsList";
import AuthGuard from "@/components/AuthGuard";
import {
  ArrowLeft,
  Loader2,
  Box,
  Sparkles,
  CreditCard,
  Menu,
  SlidersHorizontal,
  ChevronRight
} from "lucide-react";
import { auth, db } from "@/utils/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // ── State ───────────────────────────────────────────────────
  const [config, setConfig] = useState<FurnitureConfig>({
    ...DEFAULT_CONFIG,
  });

  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    ...DEFAULT_VIEW_SETTINGS,
  });

  const [activeTab, setActiveTab] = useState<"3d" | "cutlist">("3d");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [jobName, setJobName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [operatorName, setOperatorName] = useState("");

  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [hasLoadedCloudConfig, setHasLoadedCloudConfig] = useState(false);

  const [licenseKeyInput, setLicenseKeyInput] = useState("");
  const [activationLoading, setActivationLoading] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState("");
  const localMetadataUpdatedAt = useRef(0);

  const getArchetypeLabel = (type: FurnitureConfig['type']) => {
    if (type === 'wardrobe') return 'Wardrobe';
    if (type === 'chest_of_drawers') return 'Chest of Drawers';
    if (type === 'kitchen_unit') return 'Kitchen Unit';
    if (type === 'media_lowboard') return 'Media Lowboard';
    if (type === 'storage_platform_bed') return 'Storage Platform Bed';
    if (type === 'l_shaped_office_desk') return 'L-Shaped Office Desk';
    if (type === 'alcove_unit') return 'Alcove Unit';
    if (type === 'wall_hung_vanity') return 'Wall-Hung Vanity';
    if (type === 'slimline_storage_tower') return 'Slimline Storage Tower';
    if (type === 'boot_bench') return 'Boot Bench';
    if (type === 'broom_cupboard') return 'Broom Cupboard';
    if (type === 'scribe_filler_panel') return 'Scribe/Filler Panel';
    return 'Corner Post';
  };

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedJob = localStorage.getItem("itsmycut_job_name");
      const storedCustomer = localStorage.getItem("itsmycut_customer_name");
      const storedCompany = localStorage.getItem("itsmycut_company_name");
      const storedOperator = localStorage.getItem("itsmycut_operator_name");

      if (storedJob) setJobName(storedJob);
      if (storedCustomer) setCustomerName(storedCustomer);
      if (storedCompany) setCompanyName(storedCompany);
      if (storedOperator) setOperatorName(storedOperator);

      const storedMetadataTime = localStorage.getItem("itsmycut_metadata_updated_at");
      if (storedMetadataTime) {
        localMetadataUpdatedAt.current = new Date(storedMetadataTime).getTime();
      }

      const storedConfig = localStorage.getItem("itsmycut_furniture_config");
      if (storedConfig) {
        try {
          const parsed = JSON.parse(storedConfig);
          setConfig({ ...DEFAULT_CONFIG, ...parsed, tolerances: { ...DEFAULT_CONFIG.tolerances, ...(parsed?.tolerances || {}) } });
        } catch (e) {}
      }

      let devId = localStorage.getItem("itsmycut_device_id");
      if (!devId) {
        devId = "dev_" + Math.random().toString(36).substr(2, 12);
        localStorage.setItem("itsmycut_device_id", devId);
      }
      setDeviceId(devId);

      // Verify local storage license key
      const storedToken = localStorage.getItem("itsmycut_pro_token");
      const storedKey = localStorage.getItem("itsmycut_pro_key");
      if (storedToken && storedKey) {
        try {
          const payload = JSON.parse(atob(storedToken.split(".")[0]));
          if (payload.activated && payload.licenseKey === storedKey) {
            setIsPro(true);
          }
        } catch (e) {}
      }
    }
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data && (data.accessLevel === "pro" || data.accessLevel === "developer")) {
              setIsPro(true);
              return;
            }
          }
        } catch (err) {
          console.warn("Cloud profile check failed, relying on local status:", err);
        }
      }
      
      // Fallback to local storage if not pro in cloud / signed out
      const storedToken = localStorage.getItem("itsmycut_pro_token");
      const storedKey = localStorage.getItem("itsmycut_pro_key");
      let localPro = false;
      if (storedToken && storedKey) {
        try {
          const payload = JSON.parse(atob(storedToken.split(".")[0]));
          if (payload.activated && payload.licenseKey === storedKey) {
            localPro = true;
          }
        } catch (e) {}
      }
      setIsPro(localPro);
    });
    
    return () => unsubscribe();
  }, []);

  // Load Config and Job Details from Firestore when user changes
  useEffect(() => {
    if (!user) {
      setHasLoadedCloudConfig(false);
      return;
    }

    const loadCloudData = async () => {
      try {
        // Load active configuration
        const configRef = doc(db, "users", user.uid, "furnitureConfigs", "active");
        const docSnap = await getDoc(configRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const { updatedAt, ...savedConfig } = data;
          const merged = {
            ...DEFAULT_CONFIG,
            ...(savedConfig as Partial<FurnitureConfig>),
            tolerances: {
              ...DEFAULT_CONFIG.tolerances,
              ...((savedConfig as Partial<FurnitureConfig>)?.tolerances || {}),
            },
          } as FurnitureConfig;
          setConfig(merged);
        }

        // Load active job metadata
        const activeJobRef = doc(db, "users", user.uid, "activeJob", "current");
        const jobSnap = await getDoc(activeJobRef);
        if (jobSnap.exists()) {
          const data = jobSnap.data();
          
          // Check if cloud metadata is newer than local metadata
          let isCloudNewer = true;
          if (data.updatedAt) {
            const cloudTime = new Date(data.updatedAt).getTime();
            if (cloudTime < localMetadataUpdatedAt.current) {
              isCloudNewer = false;
            }
          }

          if (isCloudNewer) {
            if (data.jobName !== undefined) setJobName(data.jobName);
            if (data.customerName !== undefined) setCustomerName(data.customerName);
            if (data.companyName !== undefined) setCompanyName(data.companyName);
            if (data.operatorName !== undefined) setOperatorName(data.operatorName);
            if (data.updatedAt) {
              localStorage.setItem("itsmycut_metadata_updated_at", data.updatedAt);
              localMetadataUpdatedAt.current = new Date(data.updatedAt).getTime();
            }
          }
        }
      } catch (err) {
        console.error("Error loading cloud data:", err);
      } finally {
        setHasLoadedCloudConfig(true);
      }
    };

    loadCloudData();
  }, [user]);

  // Save Config to Firestore when config changes
  useEffect(() => {
    if (!mounted) return;
    
    localStorage.setItem("itsmycut_furniture_config", JSON.stringify(config));

    if (user && hasLoadedCloudConfig) {
      const delayDebounceFn = setTimeout(async () => {
        try {
          const configRef = doc(db, "users", user.uid, "furnitureConfigs", "active");
          await setDoc(configRef, {
            ...config,
            updatedAt: new Date().toISOString()
          });
          console.log("Furniture configuration synced to Firestore!");
        } catch (err) {
          console.error("Error saving configuration to Firestore:", err);
        }
      }, 1000);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [config, user, hasLoadedCloudConfig, mounted]);

  // Save to localStorage and Firestore when changed
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("itsmycut_job_name", jobName);
    localStorage.setItem("itsmycut_customer_name", customerName);
    localStorage.setItem("itsmycut_company_name", companyName);
    localStorage.setItem("itsmycut_operator_name", operatorName);

    const nowIso = new Date().toISOString();
    localStorage.setItem("itsmycut_metadata_updated_at", nowIso);
    localMetadataUpdatedAt.current = new Date(nowIso).getTime();

    if (user && hasLoadedCloudConfig) {
      const delayDebounceFn = setTimeout(async () => {
        try {
          const activeJobRef = doc(db, "users", user.uid, "activeJob", "current");
          await setDoc(activeJobRef, {
            jobName,
            customerName,
            companyName,
            operatorName,
            updatedAt: nowIso
          }, { merge: true });
          console.log("Job details synced to Firestore!");
        } catch (err) {
          console.error("Error saving metadata to Firestore:", err);
        }
      }, 1000); // 1-second debounce

      return () => clearTimeout(delayDebounceFn);
    }
  }, [jobName, customerName, companyName, operatorName, user, hasLoadedCloudConfig, mounted]);

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
        
        setIsPro(true);
        setActivationSuccess("Pro License Activated! Modeler limits unlocked.");
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
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.04),rgba(255,255,255,0))] pointer-events-none" />

      {/* ── TOP NAV BAR ──────────────────────────────────────── */}
      <header className="relative z-30 flex items-center justify-between px-4 py-3 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-xl print:hidden">
        <div className="flex items-center gap-3">
          <HamburgerMenu
            config={config}
            viewSettings={viewSettings}
            onConfigChange={setConfig}
            onViewSettingsChange={setViewSettings}
            jobName={jobName}
            onJobNameChange={setJobName}
            customerName={customerName}
            onCustomerNameChange={setCustomerName}
            companyName={companyName}
            onCompanyNameChange={setCompanyName}
            operatorName={operatorName}
            onOperatorNameChange={setOperatorName}
          />
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden flex items-center justify-center p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-sm cursor-pointer"
            aria-label="Open Modeler Settings"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
          <div className="h-4 border-l border-slate-800" />
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-xs font-medium"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Back to Cutlist</span>
          </Link>
          <div className="h-4 border-l border-slate-800" />
          <div className="flex items-center gap-2">
            <HelpModal />
            <img src="/modeler-logo.png" alt="Modeler Logo" className="h-5 w-5 object-contain rounded" />
            <h1 className="hidden sm:block text-sm font-bold text-slate-100 tracking-tight">
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
      <div className="flex-1 flex relative z-10 overflow-hidden print:block print:overflow-visible">
        {/* ── LEFT SIDEBAR ───────────────────────────────────── */}
        <div className="print:hidden shrink-0 flex">
          <ConfigSidebar
            config={config}
            onConfigChange={setConfig}
            viewSettings={viewSettings}
            onViewSettingsChange={setViewSettings}
            isPro={isPro}
            onUpgradeTrigger={() => setIsUpgradeModalOpen(true)}
            mobileOpen={mobileSidebarOpen}
            onMobileOpenChange={setMobileSidebarOpen}
          />
        </div>

        {/* ── CENTER + RIGHT CONTENT ─────────────────────────── */}
        <div className="flex-1 flex flex-col lg:flex-row min-w-0 overflow-hidden print:flex print:flex-col print:overflow-visible">
          {/* ── 3D CANVAS ──────────────────────────────────────── */}
          <div
            className={`flex-1 min-h-[400px] lg:min-h-0 p-3 print:h-auto print:p-0 print:mb-8 print:flex print:flex-col print:order-1 ${
              activeTab !== "3d" ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800/60 bg-slate-900/30 print:!border-none print:!bg-white print:rounded-none flex flex-col print:block print:h-auto">
              {/* Print Spec Header (Visible only on print layout) */}
              <div className="hidden print:block w-full text-black bg-white font-sans mb-6 border-b-4 border-black pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="flex gap-2">
                      <img src="/modeler-logo.png" alt="Modeler Logo" className="h-12 w-12 object-contain rounded" />
                    </div>
                    <div className="text-left">
                      <h1 className="text-2xl font-black tracking-tight uppercase">ITS MY CUTLIST</h1>
                      <p className="text-sm font-semibold uppercase tracking-wider text-slate-700">Parametric Furniture Modeler Spec</p>
                      <p className="text-xs font-mono text-slate-700">Job: {jobName || "Untitled Job"}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs font-mono">
                    <p className="font-bold">Date: {mounted ? new Date().toLocaleDateString("en-GB") : ""}</p>
                    <p className="font-bold">Time: {mounted ? new Date().toLocaleTimeString("en-GB", { hour12: false }) : ""}</p>
                    <p>Generated by Its My Cutlist Modeler</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3 text-xs font-mono text-left">
                  <p>Customer: <strong>{customerName || "-"}</strong></p>
                  <p>Company Cutting: <strong>{companyName || "-"}</strong></p>
                  <p>Operator: <strong>{operatorName || "-"}</strong></p>
                  <p>Job Ref: <strong>{jobName || "-"}</strong></p>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-200 text-xs font-mono text-left">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Archetype</span>
                    <span className="text-sm font-bold capitalize">{getArchetypeLabel(config.type)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Width</span>
                    <span className="text-sm font-bold">{config.dimensions.width}mm</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Height</span>
                    <span className="text-sm font-bold">{config.dimensions.height}mm</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono block">Depth</span>
                    <span className="text-sm font-bold">{config.dimensions.depth}mm</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 print:h-[400px] print:block">
                {/* Parts List (collapsible) */}

                <FurnitureCanvas
                  key={config.type}
                  pieces={pieces}
                  viewSettings={viewSettings}
                  type={config.type}
                />
              </div>
            </div>
          </div>

          {/* ── CUTLIST TABLE PANEL ─────────────────────────────── */}
          <div
            className={`lg:w-[480px] xl:w-[540px] lg:border-l border-slate-800/60 overflow-y-auto print:w-full print:border-l-0 print:overflow-visible print:flex print:flex-col print:h-auto print:order-2 ${
              activeTab !== "cutlist" ? "hidden lg:block" : "block"
            }`}
          >
            <div className="p-4 print:p-0">
              <CutlistTable
                pieces={filteredPieces}
                activeFilter={viewSettings.activeFilter}
                onFilterChange={handleFilterChange}
                jobName={jobName}
                customerName={customerName}
                companyName={companyName}
                operatorName={operatorName}
                userId={user?.uid}
                isPro={isPro}
                onUpgradeTrigger={() => setIsUpgradeModalOpen(true)}
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
                <Sparkles size={20} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                Unlock Pro Modeler Features
              </h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Unlock the full potential of the Parametric Furniture Modeler and Cutlist optimizer! Get unlimited model configuration options (up to 8 drawers and 6 shelves), unlimited cutlist matrix exports, 2D layout planning, and secure cloud synchronization.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3 mb-4">
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

            <a
              href="https://buy.stripe.com/mock-itsmycutlist-pro"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 mb-4"
            >
              <CreditCard size={14} />
              Buy Lifetime Pro Key (£29)
            </a>

            <div className="flex items-center gap-2 mb-4">
              <div className="border-t border-slate-800 flex-1"></div>
              <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Or Activate Key</span>
              <div className="border-t border-slate-800 flex-1"></div>
            </div>

            <form onSubmit={handleActivateLicense} className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Paste License Key
                </label>
                <input
                  type="text"
                  value={licenseKeyInput}
                  onChange={(e) => setLicenseKeyInput(e.target.value)}
                  placeholder="IMC-XXXX-XXXX-XXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                />
              </div>

              {activationError && (
                <p className="text-[10px] text-rose-400">{activationError}</p>
              )}
              {activationSuccess && (
                <p className="text-[10px] text-emerald-400">{activationSuccess}</p>
              )}

              <button
                type="submit"
                disabled={activationLoading}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
              >
                {activationLoading ? "Validating..." : "Activate Pro Key"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
