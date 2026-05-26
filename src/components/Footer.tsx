"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full bg-slate-900 border-t border-slate-800 py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand & Copy with Logo */}
        <div className="flex flex-col items-center md:items-start space-y-3 text-center md:text-left">
          <div className="flex items-center gap-3">
            <Image
              src="/itsmyapp_logo.png"
              alt="ItsMyApp Logo"
              width={28}
              height={28}
              className="rounded object-contain"
            />
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-slate-200">Its my Cutlist</span> powered by{" "}
              <a
                href="https://itsmyapp.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline hover:text-emerald-300 font-bold"
              >
                ItsMyApp.co.uk
              </a>{" "}
              | All rights reserved | &copy; 2026
            </div>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Contact us:{" "}
            <a
              href="mailto:hello@itsmyapp.co.uk"
              className="text-slate-400 hover:text-emerald-400 underline transition-colors"
            >
              hello@itsmyapp.co.uk
            </a>
          </div>
        </div>

        {/* Compliance Links */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-450">
          <Link
            href="/terms"
            className="hover:text-emerald-400 transition-colors focus:outline-none focus:underline"
          >
            Terms of Service
          </Link>
          <Link
            href="/privacy"
            className="hover:text-emerald-400 transition-colors focus:outline-none focus:underline"
          >
            Privacy Policy
          </Link>
          <Link
            href="/cookies"
            className="hover:text-emerald-400 transition-colors focus:outline-none focus:underline"
          >
            Cookie Policy
          </Link>
          <Link
            href="/accessibility"
            className="hover:text-emerald-400 transition-colors focus:outline-none focus:underline"
          >
            Accessibility Statement
          </Link>
        </div>

        {/* Security & Offline Indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Zero Server / Private by Design</span>
        </div>
      </div>
    </footer>
  );
}

