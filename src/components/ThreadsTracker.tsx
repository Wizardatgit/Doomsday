import { useMemo, useState } from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { THREADS, charactersById, titlesById } from '../data/index.ts';
import type { EntityRef, ThreadCategory } from '../data/types.ts';
import { Redactable } from './Redactable.tsx';

export function ThreadsTracker({
  watchedSet,
  spoilerShield,
  showTheories,
  onSelect,
}: {
  watchedSet: Set<string>;
  spoilerShield: boolean;
  showTheories: boolean;
  onSelect: (ref: EntityRef) => void;
}) {
  const [category, setCategory] = useState<'all' | ThreadCategory>('all');

  const visibleThreads = useMemo(() => {
    return THREADS.filter((th) => {
      if (!showTheories && th.isTheory) return false;
      if (category !== 'all' && th.category !== category) return false;
      return true;
    });
  }, [category, showTheories]);

  return (
    <div className="space-y-5">
      <div className="tva-folder rounded-md p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#1d1610] flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#c2410c]" /> Case Threads &amp; Post-Credits Ledger
            </h1>
            <p className="text-xs text-[#61503e]">
              Track unresolved stingers, artifacts (Ten Rings, Quantum Bands, Adamantium), and multiverse fractures from setup to Doomsday payoff.
            </p>
          </div>
          {!showTheories && (
            <span className="text-[11px] font-mono-code text-[#61503e]">
              Theory Layer OFF (enable switch in left TemPad console)
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['all', 'incursion', 'post-credits', 'faction', 'artifact', 'mystery'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded px-3 py-1 text-xs font-mono-code uppercase border transition-colors ${
                category === cat
                  ? 'border-[#1d1610] bg-[#1d1610] text-[#f59e0b] font-bold'
                  : 'border-[#cbb895] bg-[#fffaf0] text-[#61503e] hover:text-[#1d1610]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {visibleThreads.map((th) => (
          <article
            key={th.id}
            onClick={() => onSelect({ kind: 'thread', id: th.id })}
            className={`tva-folder rounded-md p-5 cursor-pointer hover:border-[#b45309] transition-colors space-y-3 ${
              th.isTheory ? 'border-[#7e22ce]' : ''
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="tva-ink-stamp border-[#c2410c] bg-[#c2410c]/10 text-[#9a3412]">
                  {th.category}
                </span>
                <span className="tva-ink-stamp border-[#047857] bg-[#047857]/10 text-[#065f46]">
                  {th.status}
                </span>
                {th.isTheory && (
                  <span className="tva-ink-stamp border-[#7e22ce] bg-[#7e22ce]/10 text-[#6b21a8]">
                    <Sparkles className="w-3 h-3" /> Unconfirmed Theory
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono-code text-[#61503e]">
                Origin: {titlesById.get(th.originTitleId)?.title}
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#1d1610]">{th.title}</h2>

            <Redactable
              titleIds={th.keyTitleIds}
              watchedSet={watchedSet}
              spoilerShield={spoilerShield}
              label="Thread Details"
            >
              <p className="text-xs text-[#1d1610]/85 leading-relaxed">{th.summary}</p>
              <p className="text-xs text-[#047857] font-medium mt-2">
                <strong className="font-mono-code uppercase text-[10px] mr-1.5">Doomsday Impact:</strong>
                {th.doomsdayImpact}
              </p>
            </Redactable>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
              {th.beats.map((b, i) => (
                <div key={i} className="tva-sheet rounded p-2.5 space-y-1">
                  <div className="text-[11px] font-mono-code font-bold text-[#9a3412]">
                    {titlesById.get(b.titleId)?.title}
                  </div>
                  <Redactable titleIds={[b.titleId]} watchedSet={watchedSet} spoilerShield={spoilerShield}>
                    <p className="text-[11px] text-[#61503e]">{b.note}</p>
                  </Redactable>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {th.characterIds.map((cId) => (
                <span
                  key={cId}
                  className="rounded bg-[#fffaf0] border border-[#cbb895] px-2 py-0.5 text-[11px] text-[#1d1610]"
                >
                  {charactersById.get(cId)?.name}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
