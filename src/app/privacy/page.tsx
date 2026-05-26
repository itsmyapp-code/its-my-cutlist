import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy | Its My Cutlist",
  description: "Privacy Policy for Its My Cutlist. Future-proofed compliance through Spring 2027.",
};

export default function PrivacyPage() {
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
              Privacy Policy
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
                1. Data Collection
              </h2>
              <p className="text-sm">
                We collect essential usage parameters stored in your browser LocalStorage. For diagnostic or payment key verification, we process Identity (Name), Contact (Email), Technical (IP address), and Usage data. No part layout cut definitions are ever transmitted to or stored on our servers.
              </p>
            </section>

            <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-900 space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                2. Recognised Legitimate Interests
              </h2>
              <p className="text-sm">
                Under relevant data security laws (including the Data Use and Access Act), we process critical data for &quot;Recognised Legitimate Interests&quot; including site security, critical technical bug response, crime prevention, and service availability without requiring a separate balancing test.
              </p>
            </section>

            <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-900 space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                3. Automated Decision Making
              </h2>
              <p className="text-sm">
                If automated algorithms or artificial intelligence systems are ever deployed for significant decisions impacting you, users have the right to request meaningful human intervention, express their point of view, and contest the automated output.
              </p>
            </section>

            <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-900 space-y-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                4. Complaint Rights
              </h2>
              <p className="text-sm">
                Users have the right to raise complaints directly through our electronic form or via the contact email below. We commit to acknowledging all formal privacy complaints within 30 days and resolving them in accordance with statutory guidelines.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
