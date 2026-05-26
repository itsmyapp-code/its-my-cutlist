"use client";

import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    statisticalOptOut: false, // Default is opt-in (allowed by exemption but with opt-out)
    marketing: false,         // Default is blocked (requires explicit opt-in)
  });

  useEffect(() => {
    // Check if user has already set cookie preferences
    const savedConsent = localStorage.getItem("imc_cookie_consent");
    if (!savedConsent) {
      setIsOpen(true);
    } else {
      try {
        setPreferences(JSON.parse(savedConsent));
      } catch (e) {
        setIsOpen(true);
      }
    }
  }, []);

  const saveConsent = (updatedPrefs: typeof preferences) => {
    localStorage.setItem("imc_cookie_consent", JSON.stringify(updatedPrefs));
    setPreferences(updatedPrefs);
    setIsOpen(false);
    
    // Dispatch event so other parts of the app can respond if needed
    window.dispatchEvent(new Event("cookie-preferences-changed"));
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      statisticalOptOut: false, // statistical allowed
      marketing: true,          // marketing explicitly accepted
    });
  };

  const handleRejectAll = () => {
    saveConsent({
      necessary: true,
      statisticalOptOut: true, // statistical opt-out activated
      marketing: false,        // marketing rejected
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-slate-900 border-t border-slate-800 text-slate-100 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-semibold tracking-tight text-white">
            Cookie Consent &amp; Privacy Preferences
          </h3>
          <p className="text-sm text-slate-400 max-w-4xl leading-relaxed">
            We use essential cookies to store appearance preferences and keep you signed in. We also run lightweight local statistical metrics to improve your layout optimization experience. Under the Data (Use and Access) Act, you have the right to opt-out of local analytics and refuse optional marketing cookies immediately below. No data is stored on our servers.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Essential (Always Active)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
              Local Stats (Opt-out available in settings)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-600"></span>
              Marketing Trackers (Blocked by default)
            </span>
          </div>
        </div>

        {/* Equal Prominence Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 justify-end">
          <button
            onClick={handleRejectAll}
            className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Reject All
          </button>
          <button
            onClick={handleAcceptAll}
            className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
