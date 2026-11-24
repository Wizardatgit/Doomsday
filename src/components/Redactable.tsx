import { useState, type ReactNode } from 'react';
import { Eye, ShieldAlert } from 'lucide-react';
import { titlesById } from '../data/index.ts';
import { isRedacted } from '../lib/spoiler.ts';

export function Redactable({
  titleIds,
  watchedSet,
  spoilerShield,
  children,
  label,
}: {
  titleIds: string[];
  watchedSet: Set<string>;
  spoilerShield: boolean;
  children: ReactNode;
  label?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const hidden = isRedacted(titleIds, watchedSet, spoilerShield) && !revealed;

  if (!hidden) {
    return <>{children}</>;
  }

  const unwatchedNames = titleIds
    .filter((id) => !watchedSet.has(id))
    .map((id) => titlesById.get(id)?.title ?? id)
    .slice(0, 2)
    .join(', ');

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setRevealed(true);
      }}
      className="tva-redacted group w-full text-left rounded-sm px-3 py-2 flex items-center justify-between gap-3 hover:border-amber-500 transition-colors"
      title="Click to temporarily declassify this TVA archival line"
    >
      <span className="flex items-center gap-2 min-w-0">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-[11px] font-mono-code uppercase tracking-wider text-amber-400 truncate">
          [REDACTED{label ? ` · ${label}` : ''} — UNWATCHED: {unwatchedNames}]
        </span>
      </span>
      <span className="inline-flex items-center gap-1 text-[10px] font-mono-code uppercase text-[#e6d6b5] group-hover:text-amber-300 shrink-0">
        <Eye className="w-3 h-3" /> Declassify
      </span>
    </button>
  );
}
