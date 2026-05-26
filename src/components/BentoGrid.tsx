import React from "react";

interface BentoBoxProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeType?: "success" | "warning" | "info" | "default";
  className?: string;
  children: React.ReactNode;
}

export function BentoBox({
  title,
  subtitle,
  icon,
  badge,
  badgeType = "default",
  className = "",
  children,
}: BentoBoxProps) {
  const getBadgeStyles = () => {
    switch (badgeType) {
      case "success":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "warning":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "info":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      default:
        return "bg-slate-800 text-slate-400 border border-slate-700/50";
    }
  };

  return (
    <div
      className={`relative flex flex-col bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 shadow-lg hover:shadow-emerald-950/10 transition-all duration-300 group overflow-hidden ${className}`}
    >
      {/* Decorative top gradient glow */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-700/30 to-transparent group-hover:via-emerald-500/40 transition-all duration-500"></div>

      {/* Panel Header */}
      <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 group-hover:text-emerald-400 group-hover:border-emerald-500/20 transition-all">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide uppercase">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-slate-400 font-medium mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {badge && (
          <span className={`text-xs font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${getBadgeStyles()}`}>
            {badge}
          </span>
        )}
      </div>

      {/* Panel Content */}
      <div className="flex-1 flex flex-col min-h-0 text-slate-300">
        {children}
      </div>
    </div>
  );
}

interface BentoGridProps {
  className?: string;
  children: React.ReactNode;
}

export function BentoGrid({ className = "", children }: BentoGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 auto-rows-auto ${className}`}>
      {children}
    </div>
  );
}
