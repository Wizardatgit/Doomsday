import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw, Sparkles } from 'lucide-react';
import { THREADS, getCharacterChipLabel, titlesById } from '../data/index.ts';
import type { EntityRef, ThreadCategory } from '../data/types.ts';
import { Redactable } from './Redactable.tsx';
import { ViewHeroBanner } from './TvaArt.tsx';

const CATEGORY_ACCENT: Record<ThreadCategory, string> = {
  incursion: '#b91c1c',
  'post-credits': '#c2410c',
  faction: '#1d4ed8',
  artifact: '#047857',
  mystery: '#7e22ce',
};

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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleThreads = useMemo(() => {
    return THREADS.filter((th) => {
      if (!showTheories && th.isTheory) return false;
      if (category !== 'all' && th.category !== category) return false;
      return true;
    });
  }, [category, showTheories]);

  return (
    <div className="space-y-5">
      <ViewHeroBanner
        staticImagePath="./places/baxter-828.jpg"
        posterInsetWikiPage="The_Fantastic_Four:_First_Steps"
        catalogStamp="TVA CONVERGENCE DESK // PLOT THREAD LEDGER"
        title="Case Threads & Post-Credits Ledger"
        subtitle="Track unresolved stingers, artifacts, and multiverse fractures threading straight into Avengers: Doomsday."
        accentColor="#0f766e"
        emblem="f4"
      >
        {!showTheories && (
          <span className="rounded border border-[#cbb895]/40 bg-[#1a130e]/90 px-2.5 py-1 text-[11px] font-mono-code text-amber-300">
            Theory Layer OFF
          </span>
        )}
      </ViewHeroBanner>
      <div className="tva-folder rounded-md p-4">

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter threads by category">
          {(['all', 'incursion', 'post-credits', 'faction', 'artifact', 'mystery'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              aria-pressed={category === cat}
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
          {category !== 'all' && (
            <button
              type="button"
              onClick={() => setCategory('all')}
              className="inline-flex items-center gap-1 rounded border border-[#b45309] bg-[#b45309]/10 px-2.5 py-1 text-xs font-mono-code font-semibold text-[#9a3412] hover:bg-[#b45309]/20"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3.5">
        {visibleThreads.map((th, idx) => {
          const isOpen = expandedIds.has(th.id);
          const accent = CATEGORY_ACCENT[th.category] ?? '#c2410c';
          return (
            <article
              key={th.id}
              onClick={() => onSelect({ kind: 'thread', id: th.id })}
              className={`tva-folder tva-comic-corner rounded-md p-4 sm:p-5 cursor-pointer hover:border-[#b45309] transition-colors space-y-3 border-l-4 ${
                th.isTheory ? 'border-[#7e22ce]' : ''
              }`}
              style={{ borderLeftColor: accent }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono-code font-bold text-[#61503e]">
                    CASE #{String(idx + 1).padStart(2, '0')}
                  </span>
                  <span
                    className="tva-ink-stamp tva-stamp-angled"
                    style={{ borderColor: accent, color: accent, backgroundColor: `${accent}14` }}
                  >
                    {th.category}
                  </span>
                  <span className="tva-ink-stamp tva-stamp-angled border-[#047857] bg-[#047857]/10 text-[#065f46]">
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
                <p className={`text-xs text-[#1d1610]/85 leading-relaxed ${isOpen ? '' : 'line-clamp-2'}`}>
                  {th.summary}
                </p>
                {isOpen && (
                  <p className="text-xs text-[#047857] font-medium mt-2">
                    <strong className="font-mono-code uppercase text-[10px] mr-1.5">Doomsday Impact:</strong>
                    {th.doomsdayImpact}
                  </p>
                )}
              </Redactable>

              {isOpen && (
                <>
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
                        {getCharacterChipLabel(cId)}
                      </span>
                    ))}
                  </div>
                </>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e1d4b9] pt-2 text-[11px] font-mono-code">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(th.id);
                  }}
                  className="inline-flex items-center gap-1 py-1 font-semibold text-[#9a3412] hover:underline"
                >
                  {isOpen ? (
                    <>
                      Hide breakdown <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      Show breakdown &amp; {th.beats.length} {th.beats.length === 1 ? 'beat' : 'beats'}{' '}
                      <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[#61503e]">
                    {th.characterIds.length} {th.characterIds.length === 1 ? 'player' : 'players'} ·
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect({ kind: 'thread', id: th.id });
                    }}
                    aria-label={`Open dossier for ${th.title}`}
                    className="py-1 font-semibold text-[#9a3412] hover:underline"
                  >
                    Open Dossier →
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
