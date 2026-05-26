import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Accessibility Statement | Its My Cutlist",
  description: "Accessibility commitment and support details for Its My Cutlist. Future-proofed compliance through Spring 2027.",
};

export default function AccessibilityPage() {
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
              Accessibility Statement
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
                Commitment to Accessibility
              </h2>
              <p className="text-sm">
                Its My Cutlist is dedicated to providing a highly accessible optimization tool for builders, woodworkers, and operators. We target full WCAG 2.1 Level AA compliance across all layout panels, workspace elements, and input spreadsheets.
              </p>
            </section>

            <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-900 space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                Support Features
              </h2>
              <p className="text-sm">
                Our application includes native support for full keyboard navigation, screen reader compatibility, adjustable contrast schemes, and high-density labels suited for high-glare or rugged environments such as workshop floors or open builder yards.
              </p>
            </section>

            <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-900 space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                Feedback and Contact
              </h2>
              <p className="text-sm">
                If you encounter any accessibility issues or layout blockages while operating the app, please reach out to us at <a href="mailto:hello@itsmyapp.co.uk" className="text-emerald-400 hover:underline">hello@itsmyapp.co.uk</a>. We will review all feedback and respond within 7-10 business days.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
