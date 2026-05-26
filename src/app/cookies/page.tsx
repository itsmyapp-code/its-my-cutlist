import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Cookie Policy | Its My Cutlist",
  description: "Cookie Policy for Its My Cutlist. Future-proofed compliance through Spring 2027.",
};

export default function CookiesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              ITS MY <span className="text-emerald-400">CUTLIST</span>
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-medium transition-all"
          >
            Back to Cockpit
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-8">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-2">
              Legal Infrastructure
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              Cookie Policy
            </h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 font-mono">
              <span>Status: Future-Proofed (Spring 2027)</span>
              <span>•</span>
              <span>Contact: hello@itsmyapp.co.uk</span>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-slate-300 space-y-6 leading-relaxed">
            <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-900 space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                1. Strictly Necessary Cookies
              </h2>
              <p className="text-sm">
                These cookies and storage elements are absolutely essential for the application to function correctly. This includes storing visual appearance choices (e.g. Bento grid configuration, dark mode vs light mode theme states) and temporary browser-based security checks or license key validation indicators.
              </p>
            </section>

            <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-900 space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                2. Statistical &amp; Performance Cookies
              </h2>
              <p className="text-sm">
                Used strictly for tracking local layout usage metrics and execution statistics, allowing us to benchmark layout load performance across devices. These analytics are stored locally on your device, and we provide a simple, free client-side toggle to opt-out of collection at any time.
              </p>
            </section>

            <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-900 space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                3. Third-Party Tracking
              </h2>
              <p className="text-sm">
                Marketing, behavioral targeting, and third-party advertising scripts are blocked entirely by default. They will not execute or store storage tokens in your browser until you provide an active, explicit &quot;Accept All&quot; consent interaction with our privacy settings layer.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
