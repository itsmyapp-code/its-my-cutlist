import Image from "next/image";
import Workspace from "@/components/Workspace";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";

export const metadata = {
  title: "Its My Cutlist | Free 1D & 2D Bin-Packing Optimizer",
  description: "Saves material waste down to near 0%. Optimize cuts for timber, metal, PVC, and sheets entirely in your browser. Fast, secure, and private by design.",
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Visual background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.06),rgba(255,255,255,0))] pointer-events-none"></div>

      {/* Main navigation header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-30 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/cutlist-logo.png"
              alt="Its My Cutlist Logo"
              width={36}
              height={36}
              className="rounded-lg object-contain border border-slate-800 shadow-lg"
              priority
            />
            <span className="text-lg font-bold tracking-tight text-white uppercase hidden sm:inline-block">
              ITS MY <span className="text-emerald-400">CUTLIST</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-850">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              100% Offline Engine
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-850">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
              Private by Design
            </span>
          </div>
        </div>
      </header>

      {/* Cockpit Workspace */}
      <main className="flex-1 flex flex-col relative z-10 print:bg-white print:text-black">
        <Workspace />
      </main>

      {/* Compliance & Footers */}
      <div className="print:hidden">
        <Footer />
        <CookieBanner />
      </div>
    </div>
  );
}
