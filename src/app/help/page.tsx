import Link from "next/link";
import Footer from "@/components/Footer";
import { 
  HelpCircle, 
  Terminal, 
  Settings, 
  Grid, 
  Layers, 
  BookOpen, 
  Sparkles, 
  ArrowLeft,
  CheckCircle,
  FileText
} from "lucide-react";

export const metadata = {
  title: "Help & User Guide | Its My Cutlist",
  description: "Learn how to optimize your cuts, use the Quick Paste CLI, configure 1D & 2D bin-packing settings, and manage your cutting workspace.",
};

export default function HelpPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Visual background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.04),rgba(255,255,255,0))] pointer-events-none"></div>

      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors uppercase">
              ITS MY <span className="text-emerald-400">CUTLIST</span>
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-xs px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-medium transition-all"
          >
            <ArrowLeft size={14} />
            Back to Cockpit
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 relative z-10">
        <div className="space-y-12">
          {/* Header Introduction */}
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-emerald-450 mb-2 flex items-center gap-2">
              <BookOpen size={14} />
              Knowledge Hub &amp; Documentation
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">
              Help &amp; User Guide
            </h1>
            <p className="text-slate-400 text-lg mt-3 max-w-3xl leading-relaxed">
              Get the most out of Its My Cutlist. Find format syntax guides, physical setting setups, and workshop manifest controls designed for fast construction packing.
            </p>
          </div>

          {/* Quick Start / Core Concept */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/40 p-8 rounded-2xl border border-slate-900">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5 mb-4">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <CheckCircle size={18} />
                </span>
                The 1D vs 2D packing system
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  <strong>Its My Cutlist</strong> automatically shifts operating modes based on your material inputs:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-emerald-400">1D Linear Cut Mode:</strong> Active when <em>Material Width</em> is empty or 0. Best for timber lengths, tubes, metal bars, and trim profiles.
                  </li>
                  <li>
                    <strong className="text-emerald-400">2D Sheet Cut Mode:</strong> Triggers when you input a positive <em>Material Width</em>. Best for plywood, MDF, sheet metal, panels, and plastic plates.
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-800/80 pt-6 md:pt-0 md:pl-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Key Physical Settings
              </h3>
              <ul className="space-y-3 text-xs font-mono text-slate-350">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">&bull;</span>
                  <span><strong>Blade Kerf:</strong> The width of your saw blade teeth. Usually 3mm/0.12in. Essential for calculating final yield.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">&bull;</span>
                  <span><strong>Scrap Pile:</strong> Add custom leftover pieces. The solver always consumes these scraps before touching new stock boards.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Detailed Sections */}
          <div className="space-y-10">
            {/* Quick Paste CLI Syntax */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Terminal size={22} className="text-emerald-400" />
                Quick Paste CLI Syntax Guide
              </h2>
              <p className="text-sm text-slate-300">
                Instead of manual line item creation, you can write or copy-paste text directly into the CLI. The parser instantly analyzes rows separated by spaces, slashes, commas, or semicolons.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1D Examples */}
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-900 space-y-3">
                  <div className="text-xs font-bold text-indigo-405 font-mono uppercase tracking-wider">
                    1D Linear Mode Syntax
                  </div>
                  <div className="font-mono text-xs text-slate-400 space-y-2">
                    <div className="p-2 bg-slate-900/60 rounded border border-slate-850/50">
                      <span className="text-emerald-400">4 x 1100</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">Quantity of 4, length of 1100</span>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded border border-slate-850/50">
                      <span className="text-emerald-400">1100 @ 4</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">Length of 1100, quantity of 4</span>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded border border-slate-850/50">
                      <span className="text-emerald-400">850</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">Single item of length 850 (qty defaults to 1)</span>
                    </div>
                  </div>
                </div>

                {/* 2D Examples */}
                <div className="bg-slate-950 p-6 rounded-xl border border-slate-900 space-y-3">
                  <div className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">
                    2D Sheet Mode Syntax
                  </div>
                  <div className="font-mono text-xs text-slate-400 space-y-2">
                    <div className="p-2 bg-slate-900/60 rounded border border-slate-850/50">
                      <span className="text-emerald-400">4 x 1200 x 800</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">Quantity of 4, length 1200, width 800</span>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded border border-slate-850/50">
                      <span className="text-emerald-400">1200 x 800 @ 4</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">Length 1200, width 800, quantity of 4</span>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded border border-slate-850/50">
                      <span className="text-emerald-400">1200 x 800</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">Length 1200, width 800 (qty defaults to 1)</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Reading Waste and Leftover Space Dimensions */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Layers size={22} className="text-indigo-400" />
                Reading Waste &amp; Offcut Dimensions
              </h2>
              <p className="text-sm text-slate-300">
                To maximize raw stock efficiency and reuse scrap sheets, the <strong>Live Render Canvas</strong> automatically calculates and labels the dimensions of leftover offcut pieces.
              </p>
              
              <div className="bg-slate-900/20 p-6 rounded-xl border border-slate-900/80 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="flex-1 space-y-2">
                    <h3 className="text-base font-semibold text-white">How offcut dimensions are displayed:</h3>
                    <p className="text-sm text-slate-350 leading-relaxed">
                      Leftover spaces are rendered with a <strong>dashed border</strong> and labeled with their size in your active units (e.g. <code className="text-slate-200 bg-slate-950 px-1 py-0.5 rounded border border-slate-800">450×820 Offcut</code>).
                    </p>
                    <p className="text-sm text-slate-350 leading-relaxed">
                      You can instantly record these dimensions to cut them into smaller panels or save them in your workshop scrap inventory for future jobs.
                    </p>
                  </div>
                  <div className="w-full sm:w-64 shrink-0 bg-slate-950 p-4 rounded-lg border border-slate-850 flex flex-col items-center justify-center min-h-[100px]">
                    <div className="border border-dashed border-slate-800/80 bg-slate-900/10 text-slate-500 px-4 py-3 rounded text-center">
                      <span className="font-mono text-sm block font-bold">450 × 820</span>
                      <span className="text-[10px] tracking-wider uppercase block opacity-70 mt-1">OFFCUT</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Interactive Swipe-to-Cut Manifest */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Grid size={22} className="text-emerald-400" />
                Interactive swipe-cut checklist
              </h2>
              <div className="space-y-3 text-sm text-slate-300">
                <p>
                  On the shop floor, paper checklists easily get ruined or lost. Tap the <strong className="text-white">Active Cut Tracking</strong> button in the Live Render header:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    The app highlights the current piece you need to cut (outlined in bright yellow with a blinking <code className="text-amber-300 bg-amber-950/30 px-1 rounded border border-amber-900/30">Next</code> label).
                  </li>
                  <li>
                    Once a cut is completed, click/tap the piece to mark it green and immediately highlight the next physical cut direction.
                  </li>
                  <li>
                    Guarantees you never lose your place, even in loud, dusty environments.
                  </li>
                </ul>
              </div>
            </section>

            {/* Offline and Security Features */}
            <section className="space-y-4 bg-slate-900/15 p-6 rounded-xl border border-slate-900">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-455 animate-pulse" />
                Workshop Security &amp; Offline Operation
              </h2>
              <p className="text-sm text-slate-350 leading-relaxed">
                Its My Cutlist is designed as an <strong>Offline-First Application</strong>. All calculations, layout packs, and settings run locally in your web browser. For collaborative teams, you can optionally connect a Firebase Workshop account to share offcuts databases and sync project lists in real-time. Without cloud sync, all your data remains strictly local and private.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
