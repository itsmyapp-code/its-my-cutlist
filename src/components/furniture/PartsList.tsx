'use client';
import { useState } from 'react';
import type { ComponentPiece } from '@/types/furniture';

interface PartsListProps {
  pieces: ComponentPiece[];
}

export default function PartsList({ pieces }: PartsListProps) {
  const [open, setOpen] = useState(true);

  // Group pieces by name for display
  const grouped = pieces.reduce<Record<string, ComponentPiece[]>>((acc, p) => {
    if (!acc[p.name]) acc[p.name] = [];
    acc[p.name].push(p);
    return acc;
  }, {});

  return (
    <aside className="mb-4 rounded-xl border border-slate-800 bg-slate-900/95 p-4 backdrop-blur-xl">
      <header className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-200">Parts List</h3>
        <button
          onClick={() => setOpen(!open)}
          className="text-slate-400 hover:text-emerald-400"
          aria-label={open ? 'Collapse parts list' : 'Expand parts list'}
        >
          {open ? '▾' : '▸'}
        </button>
      </header>
      {open && (
        <ul className="space-y-2 text-sm text-slate-300 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
          {Object.entries(grouped).map(([name, items]) => (
            <li key={name} className="flex justify-between">
              <span>{name}</span>
              <span className="font-medium text-slate-200">{items.length}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
