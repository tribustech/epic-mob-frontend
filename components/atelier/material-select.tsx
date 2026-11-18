"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { AtelierMaterial } from "@/lib/atelier/types";

/** Show the search box once the list gets long (the CRM catalog can hold dozens of decors). */
const SEARCH_FROM = 8;

const subtitle = (m: AtelierMaterial) => [m.brand, m.decorCode].filter(Boolean).join(" · ");

function Swatch({ style }: { style: CSSProperties }) {
  return (
    <span
      className="inline-block h-7 w-7 shrink-0 rounded-md border border-black/20 bg-cover bg-center"
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * Compact material picker: a dropdown of names with the decor colour / texture on the left,
 * instead of a grid of large tiles (which would not scale to the whole CRM catalog).
 */
export function MaterialSelect({
  label,
  materials,
  selectedId,
  swatch,
  onSelect,
}: {
  label: string;
  materials: AtelierMaterial[];
  selectedId: string | undefined;
  swatch: (m: AtelierMaterial) => CSSProperties;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const labelId = useId();
  const selected = materials.find((m) => m.id === selectedId);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter((m) => `${m.name} ${subtitle(m)}`.toLowerCase().includes(q));
  }, [materials, query]);

  // close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = (id: string) => {
    onSelect(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className="relative mt-3">
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <button
        type="button"
        className="atelier-input flex items-center gap-3 text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelId}
        onClick={() => setOpen((v) => !v)}
      >
        {selected ? <Swatch style={swatch(selected)} /> : <span className="h-7 w-7 shrink-0" />}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{selected?.name ?? "Alege materialul"}</span>
          {selected && subtitle(selected) && (
            <span className="block truncate text-xs text-[var(--home-ivory)]/60">{subtitle(selected)}</span>
          )}
        </span>
        <ChevronDown size={18} aria-hidden="true" className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute inset-x-0 z-20 mt-1 rounded-xl border border-[var(--home-ivory)]/15 bg-[var(--home-black)] p-1 shadow-lg">
          {materials.length >= SEARCH_FROM && (
            <label className="flex items-center gap-2 border-b border-[var(--home-ivory)]/10 px-2 pb-1">
              <Search size={16} aria-hidden="true" className="text-[var(--home-ivory)]/50" />
              <input
                type="search"
                className="w-full bg-transparent py-2 text-sm outline-none"
                placeholder="Caută după nume sau cod"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </label>
          )}
          <ul id={listId} role="listbox" aria-labelledby={labelId} className="max-h-72 overflow-y-auto py-1">
            {matches.length === 0 && (
              <li className="px-3 py-2 text-sm text-[var(--home-ivory)]/55">Niciun material nu se potrivește.</li>
            )}
            {matches.map((m) => (
              <li
                key={m.id}
                role="option"
                aria-selected={m.id === selectedId}
                tabIndex={0}
                onClick={() => choose(m.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    choose(m.id);
                  }
                }}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm outline-none transition-colors focus-visible:bg-black/5 ${
                  m.id === selectedId ? "bg-[var(--home-orange-soft)]" : "hover:bg-black/5"
                }`}
              >
                <Swatch style={swatch(m)} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{m.name}</span>
                  {subtitle(m) && (
                    <span className="block truncate text-xs text-[var(--home-ivory)]/55">{subtitle(m)}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
