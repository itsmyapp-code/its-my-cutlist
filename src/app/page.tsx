import Workspace from "@/components/Workspace";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";

export const metadata = {
  title: "Its My Cutlist | Free 1D & 2D Bin-Packing Optimizer",
  description: "Saves material waste down to near 0%. Optimize cuts for timber, metal, PVC, and sheets entirely in your browser. Fast, secure, with optional real-time cloud team sharing.",
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Visual background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.06),rgba(255,255,255,0))] pointer-events-none"></div>

      {/* Cockpit Workspace (Sticky Header is now managed inside Workspace for interactive presets) */}
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
