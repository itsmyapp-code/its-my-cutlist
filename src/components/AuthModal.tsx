"use client";

import React, { useState } from "react";
import { auth } from "@/utils/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { X, Lock, Mail, Loader2, Eye, EyeOff } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hideCloseButton?: boolean;
}

export default function AuthModal({ isOpen, onClose, onSuccess, hideCloseButton }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        setSuccessMessage("Account created successfully!");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email format.");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first to request a password reset.");
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset email sent. Please check your inbox!");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/invalid-email") {
        setError("Invalid email format.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else {
        setError(err.message || "Failed to send reset email.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-sm">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex justify-between items-center bg-slate-950/20">
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
              {isSignUp ? "Create Account" : "Partner Portal Sign In"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isSignUp ? "Register to save offcuts centrally" : "Access your shared workshop database"}
            </p>
          </div>
          {!hideCloseButton && (
            <button 
              onClick={onClose}
              className="p-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all focus:outline-none"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-955/30 border border-rose-900/50 rounded-xl text-rose-400 text-xs font-mono">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-955/20 border border-emerald-900/30 rounded-xl text-emerald-400 text-xs font-mono">
              {successMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-widest font-mono">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail size={14} />
              </span>
              <input
                type="email"
                required
                placeholder="you@workshop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-widest font-mono">
                Secure Password
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[9px] text-slate-500 hover:text-emerald-450 transition-colors font-semibold uppercase tracking-wider"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock size={14} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl pl-9 pr-10 py-2 text-sm text-slate-200 placeholder:text-slate-650 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 focus:outline-none"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-450 disabled:opacity-50 text-slate-955 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 focus:outline-none"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Processing...
              </>
            ) : (
              isSignUp ? "Create Workshop Account" : "Access Cockpit"
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="p-4 bg-slate-950/40 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setSuccessMessage(null);
            }}
            className="text-[11px] text-slate-400 hover:text-emerald-450 transition-all font-semibold uppercase tracking-wider"
          >
            {isSignUp 
              ? "Already have an account? Sign In" 
              : "Need a shared workshop database? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}
