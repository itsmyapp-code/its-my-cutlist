'use client';
import { useState } from 'react';
import { X, HelpCircle } from 'lucide-react';

/**
 * HelpModal – a premium modal that explains how to use the Parametric Furniture Modeler.
 * Uses the same dark‑mode palette and glass‑morphism backdrop as the rest of the app.
 */
export default function HelpModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger button – can be placed anywhere (header already imports this component) */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-slate-400 hover:text-emerald-450 transition-colors cursor-pointer"
        aria-label="Open help modal"
      >
        <HelpCircle className="w-4 h-4" />
        <span className="text-xs">Help</span>
      </button>

      {/* Backdrop – dims the page when modal is open */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-10 left-1/2 z-50 w-11/12 max-w-xl -translate-x-1/2 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl transition-all duration-300 flex flex-col max-h-[85vh] ${
          open ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        }`}
        aria-modal="true"
        role="dialog"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800/60 shrink-0">
          <h3 className="text-sm font-bold text-slate-200">Modeler Help</h3>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-emerald-400 cursor-pointer"
            aria-label="Close help modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 text-sm text-slate-300">
          <section>
            <h4 className="mb-2.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">1️⃣ Getting Started</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
              <li>Choose a furniture type (Wardrobe or Chest of Drawers).</li>
              <li>Set overall dimensions (Width, Height, Depth).</li>
              <li>Configure the number of shelves or drawers.</li>
            </ol>
          </section>

          <section>
            <h4 className="mb-2.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">2️⃣ Advanced Options (Hamburger Menu)</h4>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300">
              <li><strong>Shelf Fitting</strong>: “Router slots” (adds 12mm width) or “Solid 12mm (biscuits & glue)”.</li>
              <li><strong>Back Panel Fitting</strong>: “Nailed to Back” or “Dado Joint Groove” (recessed inset).</li>
              <li><strong>Drawer Settings</strong>: Adjust clearances per side for metal runners (standard is 13mm) and drawer box wall thickness (typically 12mm).</li>
              <li>Toggle Wireframe view and adjust Exploded View slider.</li>
            </ul>
          </section>

          <section>
            <h4 className="mb-2.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">3️⃣ Parts List & Cut‑list</h4>
            <p className="text-slate-300 leading-relaxed">The parts table on the right side lists all required furniture panels with quantities and cut dimensions, grouped by thickness and material (e.g. 18mm MDF, 6mm Ply, 12mm Drawer Box).</p>
          </section>

          <section>
            <h4 className="mb-2.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">4️⃣ Export & Print</h4>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300">
              <li>Click **Export to Cutlist App** to instantly copy all cut dimensions and load them into the main optimization workspace to layout sheet cuts.</li>
              <li>Click **Print Spec** to view a print-ready document including the Modeler Logo and Job details.</li>
            </ul>
          </section>

          <section>
            <h4 className="mb-2.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">5️⃣ Tips & Tricks</h4>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300">
              <li>When using “Router slots”, the program automatically adds 12mm to the shelf width to account for slotting into side panels.</li>
              <li>“Solid 12mm” shelves automatically toggle to the 12mm material classification.</li>
              <li>Drawer runner clearance represents the gap left on each side of the box (standard runner slides require 13mm clearance).</li>
            </ul>
          </section>
        </div>
      </aside>
    </>
  );
}
