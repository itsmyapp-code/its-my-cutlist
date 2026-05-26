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
  Copy,
  Cloud,
  LogOut,
  RefreshCw,
  Database,
  Users,
  History,
  FolderOpen,
  Trash2,
  HardDriveUpload,
  Wrench,
  ChevronRight
} from "lucide-react";
import { BentoGrid, BentoBox } from "./BentoGrid";
import { MaterialProfilePanel, QuickPasteCLI, PartMatrix, ScrapPile } from "./InputGrid";
import { VisualCanvas } from "./VisualCanvas";
import { optimizeCutlist, Part, Scrap, StockSettings, LicenseState } from "@/utils/optimizer";
import { auth, db } from "@/utils/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, collection, query, where, getDocs, addDoc, updateDoc } from "firebase/firestore";
import AuthModal from "./AuthModal";
import { SharedInventory } from "./SharedInventory";

type DrawerPage = "materials" | "history" | "kerf" | "account" | "data";

interface MaterialPreset {
  id: string;
  name: string;
  length: number;
  width: number;
  type: string;
  thickness: string;
  unit: "mm" | "cm" | "in";
}

interface JobHistoryEntry {
  id: string;
  createdAt: string;
  title: string;
  customer: string;
  company: string;
  operator: string;
  snapshot: {
    settings: StockSettings;
    parts: Part[];
    scraps: Scrap[];
  };
}

const DEFAULT_MATERIAL_PRESETS: MaterialPreset[] = [];

const MACHINE_KERF_PRESETS = [
  { label: "Dewalt DWE7485", value: 2.2 },
  { label: "Makita MLT100", value: 3.0 },
  { label: "Festool TS 55", value: 2.2 },
  { label: "Bosch GTS 10", value: 3.2 },
  { label: "Evolution R255", value: 2.4 },
  { label: "Bandsaw Generic", value: 1.5 },
];

const MATERIAL_PRESET_CSV_TEMPLATE = [
  "name,type,thickness,length,width,unit",
  "Moisture Resist MDF,MDF,18mm,2440,1220,mm",
  "CLS Timber,CLS,38x89mm,2400,0,mm",
].join("\n");

const JOB_CSV_TEMPLATE = [
  "recordType,id,label,length,width,quantity,key,value",
  "meta,,,,,,jobName,Kitchen Units",
  "meta,,,,,,customer,Acme Homes",
  "meta,,,,,,company,Its My App Ltd",
  "meta,,,,,,operator,Martin",
  "setting,,,,,,stockLength,2440",
  "setting,,,,,,stockWidth,1220",
  "setting,,,,,,bladeKerf,3",
  "setting,,,,,,unit,mm",
  "setting,,,,,,materialType,MDF",
  "setting,,,,,,thickness,18mm",
  "part,p1,Panel A,820,1100,2,,",
  "scrap,s1,Offcut 1,600,300,1,,",
].join("\n");

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

  // Firebase Auth & Cloud Sync State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [cloudSyncSuccess, setCloudSyncSuccess] = useState<string | null>(null);
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);
  const [centralInventory, setCentralInventory] = useState<any[]>([]);
  const [loadingCentralInventory, setLoadingCentralInventory] = useState(false);

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
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [drawerPage, setDrawerPage] = useState<DrawerPage>("materials");
  const [materialPresets, setMaterialPresets] = useState<MaterialPreset[]>(DEFAULT_MATERIAL_PRESETS);
  const [presetImportText, setPresetImportText] = useState("");
  const [presetImportError, setPresetImportError] = useState<string | null>(null);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetType, setNewPresetType] = useState("");
  const [newPresetThickness, setNewPresetThickness] = useState("");
  const [newPresetLength, setNewPresetLength] = useState("");
  const [newPresetWidth, setNewPresetWidth] = useState("");
  const [jobHistory, setJobHistory] = useState<JobHistoryEntry[]>([]);
  const [jobName, setJobName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [operatorName, setOperatorName] = useState("");

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

    const storedPresets = localStorage.getItem("itsmycut_material_presets");
    if (storedPresets) {
      try { setMaterialPresets(JSON.parse(storedPresets)); } catch (e) {}
    }

    const storedHistory = localStorage.getItem("itsmycut_job_history");
    if (storedHistory) {
      try { setJobHistory(JSON.parse(storedHistory)); } catch (e) {}
    }

    const storedJobName = localStorage.getItem("itsmycut_job_name");
    if (storedJobName) setJobName(storedJobName);
    const storedCustomer = localStorage.getItem("itsmycut_customer_name");
    if (storedCustomer) setCustomerName(storedCustomer);
    const storedCompany = localStorage.getItem("itsmycut_company_name");
    if (storedCompany) setCompanyName(storedCompany);
    const storedOperator = localStorage.getItem("itsmycut_operator_name");
    if (storedOperator) setOperatorName(storedOperator);

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

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("itsmycut_material_presets", JSON.stringify(materialPresets));
  }, [materialPresets, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("itsmycut_job_history", JSON.stringify(jobHistory));
  }, [jobHistory, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("itsmycut_job_name", jobName);
    localStorage.setItem("itsmycut_customer_name", customerName);
    localStorage.setItem("itsmycut_company_name", companyName);
    localStorage.setItem("itsmycut_operator_name", operatorName);
  }, [jobName, customerName, companyName, operatorName, mounted]);

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
        const normalizedLabel = (s.label || "Offcut").trim();
        const existing = updated.find(
          (item) =>
            item.length === roundedLength &&
            item.width === roundedWidth &&
            (item.label || "Offcut").trim() === normalizedLabel
        );
        if (existing) {
          existing.quantity += 1;
        } else {
          updated.push({
            id: "scrap_" + Math.random().toString(36).substr(2, 9),
            length: roundedLength,
            width: roundedWidth,
            quantity: 1,
            label: normalizedLabel,
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

  const handleLoadPreset = (preset: MaterialPreset) => {
    setSettings((prev) => ({
      ...prev,
      stockLength: preset.length,
      stockWidth: preset.width > 0 ? preset.width : undefined,
      materialType: preset.type,
      thickness: preset.thickness,
      unit: preset.unit,
    }));
    setIsDrawerOpen(false);
  };

  const handleUpdateKerf = (val: number) => {
    setSettings((prev) => ({
      ...prev,
      bladeKerf: val,
    }));
  };

  const handleAddMaterialPreset = () => {
    const length = parseFloat(newPresetLength);
    const width = parseFloat(newPresetWidth) || 0;
    if (!newPresetName.trim() || !newPresetType.trim() || !newPresetThickness.trim() || length <= 0) {
      return;
    }

    const preset: MaterialPreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: newPresetName.trim(),
      type: newPresetType.trim(),
      thickness: newPresetThickness.trim(),
      length,
      width,
      unit: settings.unit,
    };

    setMaterialPresets((prev) => [preset, ...prev]);
    setNewPresetName("");
    setNewPresetType("");
    setNewPresetThickness("");
    setNewPresetLength("");
    setNewPresetWidth("");
  };

  const handleImportMaterialPresets = () => {
    setPresetImportError(null);
    try {
      const lines = presetImportText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length < 2 || !lines[0].toLowerCase().startsWith("name,type,thickness")) {
        throw new Error("Invalid CSV header");
      }

      const imported = lines.slice(1).map((line, idx) => {
        const cols = line.split(",");
        const unitVal = (cols[5] || "mm").trim();
        return {
          id: `imported_${Date.now()}_${idx}`,
          name: (cols[0] || "Imported Material").trim(),
          type: (cols[1] || "General").trim(),
          thickness: (cols[2] || "Generic").trim(),
          length: parseFloat((cols[3] || "0").trim()),
          width: parseFloat((cols[4] || "0").trim()) || 0,
          unit: (unitVal === "cm" || unitVal === "in" ? unitVal : "mm") as "mm" | "cm" | "in",
        };
      }).filter((p) => p.length > 0);

      if (imported.length === 0) {
        setPresetImportError("No valid presets found in CSV.");
        return;
      }

      setMaterialPresets((prev) => [...imported, ...prev]);
      setPresetImportText("");
    } catch (e) {
      setPresetImportError("Invalid preset CSV. Use the CSV template.");
    }
  };

  const handleSaveCurrentToHistory = () => {
    const historyItem: JobHistoryEntry = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      title: jobName.trim() || `${settings.materialType || "Workshop"} Job`,
      customer: customerName.trim(),
      company: companyName.trim(),
      operator: operatorName.trim(),
      snapshot: {
        settings: JSON.parse(JSON.stringify(settings)),
        parts: JSON.parse(JSON.stringify(parts)),
        scraps: JSON.parse(JSON.stringify(scraps)),
      },
    };
    setJobHistory((prev) => [historyItem, ...prev].slice(0, 75));
  };

  const handleLoadHistoryEntry = (entryId: string) => {
    const found = jobHistory.find((h) => h.id === entryId);
    if (!found) return;
    setSettings(found.snapshot.settings);
    setParts(found.snapshot.parts);
    setScraps(found.snapshot.scraps);
    setJobName(found.title || "");
    setCustomerName(found.customer || "");
    setCompanyName(found.company || "");
    setOperatorName(found.operator || "");
    setIsDrawerOpen(false);
  };

  const handleDeleteHistoryEntry = (entryId: string) => {
    setJobHistory((prev) => prev.filter((h) => h.id !== entryId));
  };

  const formatDateTimeGb = (iso: string) => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  };

  const getFriendlyCloudError = (err: any, fallback: string) => {
    const code = String(err?.code || "").toLowerCase();
    const msg = String(err?.message || "").toLowerCase();
    if (code.includes("unavailable") || code.includes("failed-precondition") || msg.includes("offline")) {
      return "Cloud sync is temporarily unavailable. Your internet is fine and local mode is still working.";
    }
    return err?.message || fallback;
  };

  const handleExportWorkspace = () => {
    const rows: string[] = ["recordType,id,label,length,width,quantity,key,value"];

    rows.push(`meta,,,,,,jobName,${jobName}`);
    rows.push(`meta,,,,,,customer,${customerName}`);
    rows.push(`meta,,,,,,company,${companyName}`);
    rows.push(`meta,,,,,,operator,${operatorName}`);

    rows.push(`setting,,,,,,stockLength,${settings.stockLength}`);
    rows.push(`setting,,,,,,stockWidth,${settings.stockWidth ?? ""}`);
    rows.push(`setting,,,,,,bladeKerf,${settings.bladeKerf}`);
    rows.push(`setting,,,,,,unit,${settings.unit}`);
    rows.push(`setting,,,,,,materialType,${settings.materialType || ""}`);
    rows.push(`setting,,,,,,thickness,${settings.thickness || ""}`);

    parts.forEach((p) => {
      rows.push(`part,${p.id},${p.label || ""},${p.length},${p.width ?? ""},${p.quantity},,`);
    });

    scraps.forEach((s) => {
      rows.push(`scrap,${s.id},${s.label || ""},${s.length},${s.width ?? ""},${s.quantity},,`);
    });

    navigator.clipboard.writeText(rows.join("\n"));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  const handleImportWorkspace = () => {
    setImportError(null);
    setImportSuccess(null);
    try {
      const lines = importJsonText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length < 2 || !lines[0].toLowerCase().startsWith("recordtype")) {
        throw new Error("Invalid CSV header");
      }

      const newSettings: StockSettings = { ...settings };
      const newParts: Part[] = [];
      const newScraps: Scrap[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");
        const recordType = (cols[0] || "").trim();
        const id = (cols[1] || "").trim();
        const label = (cols[2] || "").trim();
        const length = parseFloat((cols[3] || "").trim());
        const width = parseFloat((cols[4] || "").trim());
        const quantity = parseInt((cols[5] || "").trim(), 10);
        const key = (cols[6] || "").trim();
        const value = (cols[7] || "").trim();

        if (recordType === "meta") {
          if (key === "jobName") setJobName(value);
          if (key === "customer") setCustomerName(value);
          if (key === "company") setCompanyName(value);
          if (key === "operator") setOperatorName(value);
        }

        if (recordType === "setting") {
          if (key === "stockLength") newSettings.stockLength = parseFloat(value) || newSettings.stockLength;
          if (key === "stockWidth") newSettings.stockWidth = value ? parseFloat(value) : undefined;
          if (key === "bladeKerf") newSettings.bladeKerf = parseFloat(value) || newSettings.bladeKerf;
          if (key === "unit" && (value === "mm" || value === "cm" || value === "in")) newSettings.unit = value;
          if (key === "materialType") newSettings.materialType = value;
          if (key === "thickness") newSettings.thickness = value;
        }

        if (recordType === "part") {
          if (!id || !Number.isFinite(length) || !Number.isFinite(quantity)) continue;
          newParts.push({
            id,
            label: label || undefined,
            length,
            width: Number.isFinite(width) ? width : undefined,
            quantity,
          });
        }

        if (recordType === "scrap") {
          if (!id || !Number.isFinite(length) || !Number.isFinite(quantity)) continue;
          newScraps.push({
            id,
            label: label || undefined,
            length,
            width: Number.isFinite(width) ? width : undefined,
            quantity,
          });
        }
      }

      setSettings(newSettings);
      setParts(newParts);
      setScraps(newScraps);
      setImportSuccess("CSV job loaded successfully!");
      setImportJsonText("");
      setTimeout(() => {
        setIsDrawerOpen(false);
        setImportSuccess(null);
      }, 1500);
    } catch (e) {
      setImportError("Invalid CSV format. Use the CSV template.");
    }
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to delete all parts, scraps, and reset settings? This cannot be undone.")) {
      setParts([]);
      setScraps([]);
      setJobName("");
      setCustomerName("");
      setCompanyName("");
      setOperatorName("");
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

  // Firebase Auth State Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchCentralInventory(currentUser);
        // Sync user profile and check for Pro access
        try {
          const userRef = doc(db, "users", currentUser.uid);
          let userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            const isAdmin = currentUser.email === "martin@cozens.me.uk" || currentUser.email === "martincozens@gmail.com";
            const profile = {
              uid: currentUser.uid,
              email: currentUser.email,
              accessLevel: isAdmin ? "developer" : "free",
              role: isAdmin ? "admin" : "user",
              createdAt: new Date().toISOString(),
            };
            await setDoc(userRef, profile);
            userSnap = await getDoc(userRef);
          }
          
          const data = userSnap.data();
          if (data && (data.accessLevel === "pro" || data.accessLevel === "developer")) {
            setLicense({
              isPro: true,
              licenseKey: "CLOUD-ACTIVATED",
              activationToken: "cloud",
              deviceCount: 1,
            });
          } else {
            // Revert to localStorage check if not pro in cloud
            const storedToken = localStorage.getItem("itsmycut_pro_token");
            const storedKey = localStorage.getItem("itsmycut_pro_key");
            if (storedToken && storedKey) {
              try {
                const payload = JSON.parse(atob(storedToken.split(".")[0]));
                if (payload.activated && payload.licenseKey === storedKey) {
                  setLicense({
                    isPro: true,
                    licenseKey: storedKey,
                    activationToken: storedToken,
                    deviceCount: payload.deviceCount,
                  });
                  return;
                }
              } catch (e) {}
            }
            setLicense({ isPro: false });
          }
        } catch (err: any) {
          console.warn("Cloud profile check unavailable; continuing in local mode:", err);
          setCloudSyncError(getFriendlyCloudError(err, "Cloud profile sync unavailable right now."));
          setTimeout(() => setCloudSyncError(null), 4500);
        }
      } else {
        setCentralInventory([]);
        // Revert to localStorage license if signed out
        const storedToken = localStorage.getItem("itsmycut_pro_token");
        const storedKey = localStorage.getItem("itsmycut_pro_key");
        if (storedToken && storedKey) {
          try {
            const payload = JSON.parse(atob(storedToken.split(".")[0]));
            if (payload.activated && payload.licenseKey === storedKey) {
              setLicense({
                isPro: true,
                licenseKey: storedKey,
                activationToken: storedToken,
                deviceCount: payload.deviceCount,
              });
              return;
            }
          } catch (e) {}
        }
        setLicense({ isPro: false });
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchCentralInventory = async (currentUser?: User | null) => {
    const activeUser = currentUser || user;
    if (!activeUser) return;
    setLoadingCentralInventory(true);
    try {
      const q = query(collection(db, "offcuts_inventory"), where("status", "==", "available"));
      const querySnapshot = await getDocs(q);
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setCentralInventory(items);
    } catch (err: any) {
      console.error("Error fetching central inventory:", err);
      setCloudSyncError(getFriendlyCloudError(err, "Failed to load shared inventory."));
      setTimeout(() => setCloudSyncError(null), 4500);
    } finally {
      setLoadingCentralInventory(false);
    }
  };

  const handleSaveJobToCloud = async () => {
    if (!user) return;
    setCloudSyncing(true);
    setCloudSyncSuccess(null);
    setCloudSyncError(null);
    try {
      await setDoc(doc(db, "jobs", user.uid), {
        settings,
        parts,
        scraps,
        updatedAt: new Date().toISOString(),
        email: user.email
      });
      setCloudSyncSuccess("Cockpit state synced to cloud!");
      setTimeout(() => setCloudSyncSuccess(null), 3000);
    } catch (err: any) {
      console.error("Cloud sync error:", err);
      setCloudSyncError(getFriendlyCloudError(err, "Failed to sync to cloud."));
      setTimeout(() => setCloudSyncError(null), 4000);
    } finally {
      setCloudSyncing(false);
    }
  };

  const handleLoadJobFromCloud = async () => {
    if (!user) return;
    setCloudSyncing(true);
    setCloudSyncSuccess(null);
    setCloudSyncError(null);
    try {
      const docSnap = await getDoc(doc(db, "jobs", user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.settings) setSettings(data.settings);
        if (data.parts) setParts(data.parts);
        if (data.scraps) setScraps(data.scraps);
        setCloudSyncSuccess("Cockpit loaded from cloud!");
        setTimeout(() => setCloudSyncSuccess(null), 3000);
      } else {
        setCloudSyncError("No cloud saved job found for this account.");
        setTimeout(() => setCloudSyncError(null), 4000);
      }
    } catch (err: any) {
      console.error("Load cloud job error:", err);
      setCloudSyncError(getFriendlyCloudError(err, "Failed to load cloud job."));
      setTimeout(() => setCloudSyncError(null), 4000);
    } finally {
      setCloudSyncing(false);
    }
  };

  const fetchUsersList = async () => {
    setLoadingUsers(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        items.push(doc.data());
      });
      // Sort alphabetically by email
      items.sort((a, b) => (a.email || "").localeCompare(b.email || ""));
      setUsersList(items);
    } catch (err) {
      console.error("Error fetching user list:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateUserAccess = async (targetUid: string, newAccess: string) => {
    try {
      const userRef = doc(db, "users", targetUid);
      await updateDoc(userRef, {
        accessLevel: newAccess
      });
      setUsersList(prev => prev.map(u => u.uid === targetUid ? { ...u, accessLevel: newAccess } : u));
    } catch (err) {
      console.error("Error updating user access:", err);
      alert("Failed to update user access level.");
    }
  };

  const handlePublishOffcuts = async () => {
    if (!user) return;
    setCloudSyncing(true);
    setCloudSyncSuccess(null);
    setCloudSyncError(null);
    try {
      let count = 0;
      const { boards } = optimizationResult;
      for (const board of boards) {
        if (is2DMode && board.wasteRects) {
          for (const r of board.wasteRects) {
            if (r.w >= 100 && r.h >= 100) {
              await addDoc(collection(db, "offcuts_inventory"), {
                materialType: settings.materialType || "General Board",
                thickness: settings.thickness || "Generic",
                length: Math.round(r.w),
                width: Math.round(r.h),
                quantity: 1,
                status: "available",
                createdByUser: user.email,
                createdAt: new Date().toISOString(),
              });
              count++;
            }
          }
        } else if (!is2DMode && board.waste > 100) {
          await addDoc(collection(db, "offcuts_inventory"), {
            materialType: settings.materialType || "CLS Timber",
            thickness: settings.thickness || "Generic",
            length: Math.round(board.waste),
            width: 0,
            quantity: 1,
            status: "available",
            createdByUser: user.email,
            createdAt: new Date().toISOString(),
          });
          count++;
        }
      }
      await fetchCentralInventory(user);
      setCloudSyncSuccess(`Successfully published ${count} offcuts to central stock!`);
      setTimeout(() => setCloudSyncSuccess(null), 3000);
    } catch (err: any) {
      console.error("Publish offcuts error:", err);
      setCloudSyncError(err.message || "Failed to publish offcuts.");
      setTimeout(() => setCloudSyncError(null), 4000);
    } finally {
      setCloudSyncing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCloudSyncSuccess("Signed out successfully.");
      setTimeout(() => setCloudSyncSuccess(null), 2000);
    } catch (err: any) {
      console.error("Sign out error:", err);
    }
  };

  const handlePullToScraps = async (item: any) => {
    if (!user) return;
    try {
      // 1. Add to local scraps
      setScraps((prev) => {
        const roundedLength = Math.round(item.length);
        const roundedWidth = item.width ? Math.round(item.width) : undefined;
        const existing = prev.find(
          (s) => s.length === roundedLength && s.width === roundedWidth
        );
        if (existing) {
          return prev.map((s) =>
            s.length === roundedLength && s.width === roundedWidth
              ? { ...s, quantity: s.quantity + 1 }
              : s
          );
        } else {
          return [
            ...prev,
            {
              id: "scrap_" + Math.random().toString(36).substr(2, 9),
              length: roundedLength,
              width: roundedWidth,
              quantity: 1,
              label: `${item.materialType} ${item.thickness}`,
            },
          ];
        }
      });

      // 2. Mark reserved in Firestore
      const docRef = doc(db, "offcuts_inventory", item.id);
      await updateDoc(docRef, {
        status: "reserved",
        reservedByUser: user.email,
        reservedAt: new Date().toISOString(),
      });
      await fetchCentralInventory(user);
      setCloudSyncSuccess("Offcut claimed & added to your scraps!");
      setTimeout(() => setCloudSyncSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error pulling scrap:", err);
      setCloudSyncError("Failed to claim offcut.");
      setTimeout(() => setCloudSyncError(null), 3000);
    }
  };

  const handleReleaseOffcut = async (itemId: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, "offcuts_inventory", itemId);
      await updateDoc(docRef, {
        status: "available",
        reservedByUser: null,
        reservedAt: null,
      });
      await fetchCentralInventory(user);
      setCloudSyncSuccess("Offcut returned to stock pool.");
      setTimeout(() => setCloudSyncSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error releasing offcut:", err);
    }
  };

  const handleConsumeOffcut = async (itemId: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, "offcuts_inventory", itemId);
      await updateDoc(docRef, {
        status: "consumed",
        consumedAt: new Date().toISOString(),
      });
      await fetchCentralInventory(user);
      setCloudSyncSuccess("Offcut marked as consumed/cut.");
      setTimeout(() => setCloudSyncSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error consuming offcut:", err);
    }
  };

  const handleAddManualOffcut = async (offcut: {
    length: number;
    width?: number;
    materialType: string;
    thickness: string;
  }) => {
    if (!user) return;
    try {
      await Promise.race([
        addDoc(collection(db, "offcuts_inventory"), {
          materialType: offcut.materialType,
          thickness: offcut.thickness,
          length: Math.round(offcut.length),
          width: offcut.width ? Math.round(offcut.width) : 0,
          quantity: 1,
          status: "available",
          createdByUser: user.email,
          createdAt: new Date().toISOString(),
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timed out publishing offcut. Check sync/login and retry.")), 10000);
        }),
      ]);
      await fetchCentralInventory(user);
      setCloudSyncSuccess("Manual offcut published to workshop stock!");
      setTimeout(() => setCloudSyncSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error publishing offcut:", err);
      setCloudSyncError("Failed to publish manual offcut.");
      setTimeout(() => setCloudSyncError(null), 3000);
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
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-850">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{user.email}</span>
                </span>
                <button
                  onClick={handleSaveJobToCloud}
                  disabled={cloudSyncing}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus:outline-none disabled:opacity-50"
                  title="Upload configuration to Firebase cloud storage"
                >
                  {cloudSyncing ? <RefreshCw size={14} className="animate-spin" /> : <Cloud size={14} />}
                  <span>Sync</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/30 text-slate-350 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all focus:outline-none"
              >
                <Cloud size={14} />
                <span>Cloud Login</span>
              </button>
            )}

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
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Menu</p>
                <select
                  value={drawerPage}
                  onChange={(e) => setDrawerPage(e.target.value as DrawerPage)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-200 focus:outline-none"
                >
                  <option value="materials">Materials</option>
                  <option value="history">History</option>
                  <option value="kerf">Kerf</option>
                  <option value="account">Account</option>
                  <option value="data">Data</option>
                </select>
              </div>

              {drawerPage === "materials" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Material Presets</h4>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono font-bold">Load &amp; Close</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {materialPresets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleLoadPreset(preset)}
                        className="p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-emerald-500/40 text-left rounded-xl transition-all"
                      >
                        <span className="block text-sm font-bold text-slate-200">{preset.name}</span>
                        <span className="block text-[10px] text-slate-500 font-mono">Type: {preset.type}</span>
                        <span className="block text-[10px] text-slate-500 font-mono">Thickness: {preset.thickness}</span>
                        <span className="block text-[10px] text-slate-500 font-mono">Size: {preset.length}{preset.width > 0 ? ` x ${preset.width}` : ""} {preset.unit}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-850">
                    <h5 className="text-[11px] font-bold text-slate-350 uppercase tracking-wider">Add New Material</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} placeholder="Name e.g. Moisture Resist MDF" className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none" />
                      <input value={newPresetType} onChange={(e) => setNewPresetType(e.target.value)} placeholder="Type e.g. MDF" className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none" />
                      <input value={newPresetThickness} onChange={(e) => setNewPresetThickness(e.target.value)} placeholder="Thickness e.g. 18mm" className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none" />
                      <input value={newPresetLength} onChange={(e) => setNewPresetLength(e.target.value)} placeholder={`Length (${settings.unit})`} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none" />
                      <input value={newPresetWidth} onChange={(e) => setNewPresetWidth(e.target.value)} placeholder={`Width (${settings.unit}, optional)`} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono focus:outline-none col-span-2" />
                    </div>
                    <button onClick={handleAddMaterialPreset} className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider">Add Material Preset</button>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-850">
                    <h5 className="text-[11px] font-bold text-slate-350 uppercase tracking-wider">Import Material Presets</h5>
                    <button
                      onClick={() => navigator.clipboard.writeText(MATERIAL_PRESET_CSV_TEMPLATE)}
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-200 uppercase"
                    >
                      Copy Material CSV Template
                    </button>
                    <textarea
                      value={presetImportText}
                      onChange={(e) => setPresetImportText(e.target.value)}
                      placeholder={MATERIAL_PRESET_CSV_TEMPLATE}
                      className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-300 font-mono focus:outline-none"
                    />
                    {presetImportError && <p className="text-[10px] text-rose-400">{presetImportError}</p>}
                    <button onClick={handleImportMaterialPresets} className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-white uppercase tracking-wider">Import Presets CSV</button>
                  </div>
                </div>
              )}

              {drawerPage === "history" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Job History</h4>
                  <button onClick={handleSaveCurrentToHistory} className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider">Save Current Job Snapshot</button>
                  {jobHistory.length === 0 ? (
                    <p className="text-[11px] text-slate-500">No history saved yet.</p>
                  ) : (
                    <div className="max-h-[420px] overflow-y-auto space-y-2">
                      {jobHistory.map((entry) => (
                        <div key={entry.id} className="p-2.5 bg-slate-950 border border-slate-850 rounded-lg space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-slate-200 truncate">{entry.title}</p>
                            <p className="text-[10px] text-slate-500 font-mono shrink-0">{formatDateTimeGb(entry.createdAt)}</p>
                          </div>
                          <p className="text-[10px] text-slate-500">Customer: {entry.customer || "-"} | Operator: {entry.operator || "-"}</p>
                          <div className="flex gap-2">
                            <button onClick={() => handleLoadHistoryEntry(entry.id)} className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded text-[10px] text-slate-200 font-bold uppercase flex items-center justify-center gap-1"><FolderOpen size={11} />Load</button>
                            <button onClick={() => handleDeleteHistoryEntry(entry.id)} className="px-2 py-1.5 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-900/40 rounded text-[10px] text-rose-300 font-bold"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {drawerPage === "kerf" && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Blade Kerf by Machine</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {MACHINE_KERF_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handleUpdateKerf(preset.value)}
                        className={`p-2.5 border rounded-lg text-left transition-all ${settings.bladeKerf === preset.value ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300" : "bg-slate-950 border-slate-850 text-slate-300 hover:border-slate-700"}`}
                      >
                        <span className="block text-[11px] font-bold">{preset.label}</span>
                        <span className="block text-[10px] font-mono mt-0.5">{preset.value} {settings.unit}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {drawerPage === "account" && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Pro License</h4>
                    {license.isPro ? (
                      <div className="p-3 bg-slate-955/60 border border-slate-850 rounded-xl space-y-2">
                        <p className="text-xs font-bold text-emerald-400">Pro Active</p>
                        <p className="text-[10px] text-slate-400 font-mono">{license.licenseKey?.slice(0, 12)}...</p>
                        <button onClick={handleDeactivateLicense} className="w-full py-1.5 bg-rose-955/20 border border-rose-900/30 text-rose-400 rounded-lg text-[10px] font-bold uppercase">Deactivate</button>
                      </div>
                    ) : (
                      <form onSubmit={handleActivateLicense} className="space-y-2">
                        <input type="text" value={licenseKeyInput} onChange={(e) => setLicenseKeyInput(e.target.value)} placeholder="IMC-XXXX-XXXX-XXXX" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-mono text-slate-200 focus:outline-none" />
                        {activationError && <p className="text-[10px] text-rose-400">{activationError}</p>}
                        <button type="submit" disabled={activationLoading} className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold uppercase">{activationLoading ? "Validating..." : "Activate Pro Key"}</button>
                      </form>
                    )}
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-850">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Workshop Sync</h4>
                    {user ? (
                      <div className="space-y-2">
                        <p className="text-[11px] text-slate-400">Signed in as {user.email}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <button onClick={handleSaveJobToCloud} disabled={cloudSyncing} className="py-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-[10px] font-bold uppercase">Save Job</button>
                          <button onClick={handleLoadJobFromCloud} disabled={cloudSyncing} className="py-2 bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 rounded-lg text-[10px] font-bold uppercase">Load Job</button>
                        </div>
                        <button onClick={handlePublishOffcuts} disabled={cloudSyncing} className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-[10px] font-bold uppercase">Publish Offcuts</button>
                        <button onClick={handleSignOut} className="w-full py-1.5 bg-rose-955/20 border border-rose-900/30 text-rose-400 rounded-lg text-[10px] font-bold uppercase">Sign Out</button>
                      </div>
                    ) : (
                      <button onClick={() => { setIsDrawerOpen(false); setIsAuthModalOpen(true); }} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold uppercase">Connect Workshop Account</button>
                    )}
                  </div>
                </div>
              )}

              {drawerPage === "data" && (
                <div className="space-y-4">
                  <div className="space-y-2 pt-2 border-t border-slate-850">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Import &amp; Export CSV</h4>
                    <button onClick={handleExportWorkspace} className="w-full py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg text-xs font-bold text-slate-200 uppercase">{copiedBackup ? "Copied" : "Export Job CSV"}</button>
                    <button onClick={() => navigator.clipboard.writeText(JOB_CSV_TEMPLATE)} className="w-full py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-200 uppercase">Copy Job CSV Template</button>
                    <textarea value={importJsonText} onChange={(e) => setImportJsonText(e.target.value)} placeholder={JOB_CSV_TEMPLATE} className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] font-mono text-slate-300 focus:outline-none" />
                    {importError && <p className="text-[10px] text-rose-400">{importError}</p>}
                    {importSuccess && <p className="text-[10px] text-emerald-400">{importSuccess}</p>}
                    <button onClick={handleImportWorkspace} className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold uppercase">Load CSV Job</button>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-850">
                    <Link href="/help" onClick={() => setIsDrawerOpen(false)} className="w-full py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5">
                      <HelpCircle size={14} className="text-emerald-400" />
                      View Help &amp; User Guide
                    </Link>
                    <button onClick={handleClearAll} className="w-full py-2 bg-rose-955/20 hover:bg-rose-955/40 border border-rose-900/30 text-rose-350 rounded-xl text-xs font-bold uppercase tracking-wider">Clear All Data</button>
                  </div>
                </div>
              )}
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

          <div className="mb-5">
            <BentoBox
              title="Report &amp; Job Details"
              subtitle="Shown on print/PDF cut lists"
              icon={<FileText size={16} />}
              badge="Visible"
              badgeType="success"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={jobName} onChange={(e) => setJobName(e.target.value)} placeholder="Job name" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none" />
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none" />
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company doing the cutting" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none" />
                <input value={operatorName} onChange={(e) => setOperatorName(e.target.value)} placeholder="Operator" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none" />
              </div>
            </BentoBox>
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

            {/* Box 2: Cut Parts List */}
            <BentoBox 
              title="Cut Parts List" 
              subtitle="Add parts manually or paste a list to import"
              icon={<Layers size={16} />}
              badge="Input"
            >
              <PartMatrix
                parts={parts}
                setParts={setParts}
                settings={settings}
                isPro={license.isPro}
                onUpgradeTrigger={() => setIsUpgradeModalOpen(true)}
              />
              {/* Collapsible Quick Paste Import */}
              <QuickPasteCLI onParse={handleQuickPasteParse} is2DMode={is2DMode} />
            </BentoBox>

            {/* Box 3: Offcuts & Workshop Stock (merged scrap pile + shared inventory) */}
            <BentoBox 
              title="Offcuts & Workshop Stock" 
              subtitle="Local scraps and shared team inventory"
              icon={<Database size={16} />}
              badge={user ? "Cloud Sync" : "Offcuts"}
              badgeType={user ? "success" : "info"}
            >
              <ScrapPile
                scraps={scraps}
                setScraps={setScraps}
                settings={settings}
              />
              {/* Shared Workshop Inventory (cloud) */}
              <div className="mt-4 pt-4 border-t border-slate-800/60">
                <SharedInventory
                  user={user}
                  centralInventory={centralInventory}
                  loadingCentralInventory={loadingCentralInventory}
                  onPullToScraps={handlePullToScraps}
                  onReleaseOffcut={handleReleaseOffcut}
                  onConsumeOffcut={handleConsumeOffcut}
                  onAddManualOffcut={handleAddManualOffcut}
                  onTriggerLogin={() => setIsAuthModalOpen(true)}
                  settings={settings}
                />
              </div>
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

        {/* AUTH MODAL */}
        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onSuccess={() => {
              setCloudSyncSuccess("Login successful!");
              setTimeout(() => setCloudSyncSuccess(null), 3000);
            }}
          />
        )}

        {/* Floating Status Notification Toast */}
        {(cloudSyncSuccess || cloudSyncError) && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center gap-3 ${
              cloudSyncSuccess 
                ? "bg-slate-900/95 border-emerald-500/30 text-emerald-400" 
                : "bg-slate-900/95 border-rose-500/30 text-rose-450"
            }`}>
              <div className={`p-1.5 rounded-lg ${cloudSyncSuccess ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                {cloudSyncSuccess ? <Cloud size={16} className="text-emerald-400 animate-pulse" /> : <Cloud size={16} className="text-rose-400" />}
              </div>
              <span className="text-xs font-bold font-mono tracking-wide">
                {cloudSyncSuccess || cloudSyncError}
              </span>
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
            <div className="flex items-start gap-3">
              <img src="/cutlist-logo.png" alt="Its My Cutlist Logo" className="h-12 w-12 object-contain" />
              <div>
                <h1 className="text-2xl font-black tracking-tight uppercase">ITS MY CUTLIST</h1>
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-700">Workshop Cutting Instructions</p>
                <p className="text-xs font-mono text-slate-700">Job: {jobName || "Untitled Job"}</p>
              </div>
            </div>
            <div className="text-right text-xs font-mono">
              <p className="font-bold">Date: {new Date().toLocaleDateString("en-GB")}</p>
              <p className="font-bold">Time: {new Date().toLocaleTimeString("en-GB", { hour12: false })}</p>
              <p>Generated by Its My Cutlist</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3 text-xs font-mono">
            <p>Customer: <strong>{customerName || "-"}</strong></p>
            <p>Company Cutting: <strong>{companyName || "-"}</strong></p>
            <p>Operator: <strong>{operatorName || "-"}</strong></p>
            <p>Job Ref: <strong>{jobName || "-"}</strong></p>
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
                <th className="py-1 font-bold">Material &amp; Thickness</th>
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
                    <td className="py-1.5 font-mono text-slate-700">{settings.materialType || "Standard"} - {settings.thickness || "Not Spec'd"}</td>
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
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">
                      Board #{bIdx + 1} - {isScrap ? "Scrap Offcut Board" : "Stock Board"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                      Material: {settings.materialType || "Standard"} ({settings.thickness || "Not Spec'd"})
                    </span>
                  </div>
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
                      const isVerticalLabel = cutW < cutH * 0.42;
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
                          {isVerticalLabel ? (
                            <div className="rotate-90 origin-center flex flex-col items-center justify-center">
                              <span className="text-[9px] font-bold font-mono leading-none whitespace-nowrap">{cut.length}×{cut.width}</span>
                              {cut.label && <span className="text-[8px] font-semibold uppercase leading-none mt-0.5 whitespace-nowrap">{cut.label}</span>}
                            </div>
                          ) : (
                            <>
                              <span className="text-[9px] font-bold font-mono leading-none">{cut.length}×{cut.width}</span>
                              {cut.label && <span className="text-[8px] truncate font-semibold uppercase leading-none mt-0.5">{cut.label}</span>}
                            </>
                          )}
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
