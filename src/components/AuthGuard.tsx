"use client";

import React, { useEffect, useState } from "react";
import { auth } from "@/utils/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import AuthModal from "./AuthModal";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400 min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono">Verifying Access...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AuthModal 
          isOpen={true} 
          onClose={() => {}} 
          onSuccess={() => {}} 
          hideCloseButton={true} 
        />
      </div>
    );
  }

  return <>{children}</>;
}
