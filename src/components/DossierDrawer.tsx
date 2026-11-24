import {
  ArrowRight,
  CheckSquare,
  GitBranch,
  Globe2,
  Network,
  Sparkles,
  Square,
  X,
} from 'lucide-react';
import {
  CHARACTERS,
  THREADS,
  TITLES,
  charactersById,
  factionsById,
  realitiesById,
  threadsById,
  titlesById,
} from '../data/index.ts';
import type { EntityRef } from '../data/index.ts';
import { EntityVisual } from './TvaArt.tsx';
import { Redactable } from './Redactable.tsx';

export function DossierDrawer({
  selected,
  onClose,
  onSelect,
  onFocusGraph,
  onTracePath,
  watchedSet,
  onToggleWatched,
  spoilerShield,
  showTheories,
  tmdbApiKey,
}: {
  selected: EntityRef | null;
  onClose: () => void;
  onSelect: (ref: EntityRef) => void;
  onFocusGraph: (ref: EntityRef) => void;
  onTracePath: (ref: EntityRef) => void;
  watchedSet: Set<string>;
  onToggleWatched: (titleId: string) => void;
  spoilerShield: boolean;
  showTheories: boolean;
  tmdbApiKey: string;
}) {
  if (!selected) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-xl h-full overflow-y-auto bg-[#f6ecd7] border-l-2 border-[#bfa982] shadow-2xl flex flex-col text-[#1d1610]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-3.5 bg-[#efe2c6]/95 backdrop-blur border-b border-[#cbb895]">
          <span className="tva-ink-stamp border-[#9a3412] bg-[#9a3412]/10 text-[#9a3412]">
            CASE FILE // {selected.kind.toUpperCase()}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onFocusGraph(selected)}
              className="inline-flex items-center gap-1 rounded border border-[#1d1610] bg-[#1d1610] px-2.5 py-1 text-xs font-mono-code font-semibold text-[#f59e0b] hover:bg-[#32261c]"
            >
              <Network className="w-3.5 h-3.5" /> CRT Web
            </button>
            <button
              type="button"
              onClick={() => onTracePath(selected)}
              className="inline-flex items-center gap-1 rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1 text-xs font-mono-code font-semibold text-[#1d1610] hover:border-[#b45309]"
            >
              <GitBranch className="w-3.5 h-3.5 text-[#c2410c]" /> Trace Path
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#e1d1b0] text-[#61503e] hover:text-[#1d1610]"
              aria-label="Close dossier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {selected.kind === 'character' && (() => {
            const c = charactersById.get(selected.id);
            if (!c) return <p className="text-sm text-[#61503e]">Character not found.</p>;
            const faction = factionsById.get(c.factionId);
            const originR = realitiesById.get(c.originRealityId);
            const currentR = realitiesById.get(c.currentRealityId);
            const relatedThreads = THREADS.filter(
              (th) => (showTheories || !th.isTheory) && th.characterIds.includes(c.id),
            );
            const firstTitle = titlesById.get(c.firstAppearanceTitleId);
            const lastTitle = titlesById.get(c.lastSeenTitleId);

            return (
              <>
                <div className="flex gap-4 items-start">
                  <EntityVisual
                    variant="polaroid"
                    code={c.catalogCode}
                    title={c.name}
                    subtitle={c.alias}
                    accentColor={faction?.color ?? '#c2410c'}
                    emblem={faction?.emblem ?? 'tva'}
                    wikiPage={c.wikiPage}
                    tmdbQuery={c.tmdbPersonId ? { kind: 'person', id: c.tmdbPersonId } : undefined}
                    tmdbApiKey={tmdbApiKey}
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className="tva-ink-stamp"
                        style={{
                          borderColor: faction?.color ?? '#b45309',
                          color: faction?.color ?? '#b45309',
                          backgroundColor: `${faction?.color ?? '#b45309'}15`,
                        }}
                      >
                        {faction?.shortName ?? c.factionId}
                      </span>
                      <span className="tva-ink-stamp border-[#61503e] bg-[#fffaf0] text-[#1d1610]">
                        {c.doomsdayStatus}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#1d1610] leading-tight">{c.name}</h2>
                    <p className="text-sm text-[#9a3412] font-semibold">
                      {c.alias} · <span className="text-[#61503e] font-normal">Played by {c.actor}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs font-mono-code">
                      <button
                        type="button"
                        onClick={() => onSelect({ kind: 'reality', id: c.originRealityId })}
                        className="rounded bg-[#fffaf0] border border-[#cbb895] px-2 py-0.5 text-[#1d1610] hover:border-[#b45309]"
                      >
                        Origin: {originR?.code}
                      </button>
                      {c.currentRealityId !== c.originRealityId && (
                        <>
                          <ArrowRight className="w-3.5 h-3.5 text-[#c2410c]" />
                          <button
                            type="button"
                            onClick={() => onSelect({ kind: 'reality', id: c.currentRealityId })}
                            className="rounded bg-[#c2410c]/10 border border-[#c2410c] px-2 py-0.5 text-[#9a3412] font-semibold"
                          >
                            Current: {currentR?.code}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="tva-sheet rounded-md p-4 space-y-3">
                  <div>
                    <h3 className="text-[11px] font-mono-code uppercase tracking-widest text-[#9a3412] font-bold">
                      Who Are They?
                    </h3>
                    <p className="mt-1 text-sm text-[#1d1610] leading-relaxed">{c.whoAreThey}</p>
                  </div>

                  <div className="border-t border-[#e1d4b9] pt-3">
                    <h3 className="text-[11px] font-mono-code uppercase tracking-widest text-[#9a3412] font-bold">
                      How Did They Get Here?
                    </h3>
                    <div className="mt-1">
                      <Redactable
                        titleIds={[c.lastSeenTitleId]}
                        watchedSet={watchedSet}
                        spoilerShield={spoilerShield}
                        label="Journey Summary"
                      >
                        <p className="text-sm text-[#1d1610] leading-relaxed">{c.howTheyGotHere}</p>
                      </Redactable>
                    </div>
                  </div>

                  <div className="border-t border-[#e1d4b9] pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-mono-code uppercase text-[#61503e]">First Appearance</span>
                      {firstTitle && (
                        <button
                          type="button"
                          onClick={() => onSelect({ kind: 'title', id: firstTitle.id })}
                          className="block mt-0.5 text-[#9a3412] hover:underline text-left font-semibold"
                        >
                          {firstTitle.title} ({firstTitle.year})
                        </button>
                      )}
                    </div>
                    <div>
                      <span className="font-mono-code uppercase text-[#61503e]">Last Seen</span>
                      {lastTitle && (
                        <button
                          type="button"
                          onClick={() => onSelect({ kind: 'title', id: lastTitle.id })}
                          className="block mt-0.5 text-[#9a3412] hover:underline text-left font-semibold"
                        >
                          {lastTitle.title} ({lastTitle.year})
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#61503e] font-bold">
                    Timeline Beats ({c.journey.filter((j) => showTheories || !j.isTheory).length})
                  </h3>
                  <div className="space-y-2 border-l-2 border-[#cbb895] pl-4 ml-1.5">
                    {c.journey
                      .filter((j) => showTheories || !j.isTheory)
                      .map((j, idx) => {
                        const title = titlesById.get(j.titleId);
                        return (
                          <div key={`${j.titleId}-${idx}`} className="relative tva-sheet rounded p-3 space-y-1.5">
                            <span className="absolute -left-[23px] top-4 w-2.5 h-2.5 rounded-full bg-[#c2410c] ring-4 ring-[#f6ecd7]" />
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => onSelect({ kind: 'title', id: j.titleId })}
                                className="text-xs font-bold text-[#9a3412] hover:underline text-left"
                              >
                                {title?.title ?? j.titleId} ({title?.year})
                              </button>
                              {j.realityShiftTo && (
                                <span className="tva-ink-stamp border-[#c2410c] bg-[#c2410c]/10 text-[#9a3412]">
                                  → {realitiesById.get(j.realityShiftTo)?.code}
                                </span>
                              )}
                            </div>
                            <Redactable
                              titleIds={[j.titleId]}
                              watchedSet={watchedSet}
                              spoilerShield={spoilerShield}
                            >
                              <p className="text-xs text-[#1d1610]/90 leading-relaxed">{j.beat}</p>
                            </Redactable>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {relatedThreads.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#61503e] font-bold">
                      Connected Plot Threads
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {relatedThreads.map((th) => (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => onSelect({ kind: 'thread', id: th.id })}
                          className={`rounded border px-2.5 py-1.5 text-xs text-left transition-colors ${
                            th.isTheory
                              ? 'border-[#7e22ce] bg-[#7e22ce]/10 text-[#581c87] hover:bg-[#7e22ce]/20'
                              : 'border-[#cbb895] bg-[#fffaf0] text-[#1d1610] hover:border-[#b45309]'
                          }`}
                        >
                          {th.isTheory && <Sparkles className="w-3 h-3 inline mr-1 text-[#7e22ce]" />}
                          {th.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {selected.kind === 'title' && (() => {
            const t = titlesById.get(selected.id);
            if (!t) return <p className="text-sm text-[#61503e]">Title not found.</p>;
            const reality = realitiesById.get(t.realityId);
            const watched = watchedSet.has(t.id);
            const titleThreads = THREADS.filter(
              (th) => (showTheories || !th.isTheory) && th.keyTitleIds.includes(t.id),
            );

            return (
              <>
                <div className="flex gap-4 items-start">
                  <EntityVisual
                    variant="poster"
                    code={reality?.code ?? 'MCU'}
                    title={t.title}
                    subtitle={`${t.year}`}
                    accentColor={reality?.color ?? '#c2410c'}
                    emblem={t.id === 'avengers-doomsday' ? 'doom' : 'tva'}
                    wikiPage={t.wikiPage ?? t.title.replace(/ /g, '_')}
                    tmdbQuery={
                      t.tmdbId && t.tmdbMediaType
                        ? { kind: 'title', mediaType: t.tmdbMediaType, id: t.tmdbId }
                        : undefined
                    }
                    tmdbApiKey={tmdbApiKey}
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="tva-ink-stamp border-[#9a3412] bg-[#9a3412]/10 text-[#9a3412]">
                        {t.eraLabel}
                      </span>
                      <span className="tva-ink-stamp border-[#61503e] bg-[#fffaf0] text-[#1d1610]">
                        {t.importance}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-[#1d1610] leading-tight">{t.title}</h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#61503e] font-mono-code">
                      <span>{t.releaseDate}</span>
                      {t.runtime && <span>· {t.runtime}</span>}
                      <button
                        type="button"
                        onClick={() => onSelect({ kind: 'reality', id: t.realityId })}
                        className="text-[#9a3412] font-semibold hover:underline"
                      >
                        · {reality?.name}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleWatched(t.id)}
                      className={`inline-flex items-center gap-2 rounded border px-3 py-1.5 text-xs font-mono-code font-semibold transition-colors ${
                        watched
                          ? 'border-[#047857] bg-[#047857]/15 text-[#065f46]'
                          : 'border-[#cbb895] bg-[#fffaf0] text-[#1d1610] hover:border-[#b45309]'
                      }`}
                    >
                      {watched ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      {watched ? 'Watched (Logged)' : 'Mark as Watched'}
                    </button>
                  </div>
                </div>

                <div className="tva-sheet rounded-md p-4 space-y-3">
                  <div>
                    <h3 className="text-[11px] font-mono-code uppercase tracking-widest text-[#9a3412] font-bold">
                      Case Summary
                    </h3>
                    <div className="mt-1">
                      <Redactable titleIds={[t.id]} watchedSet={watchedSet} spoilerShield={spoilerShield}>
                        <p className="text-sm text-[#1d1610] leading-relaxed">{t.summary}</p>
                      </Redactable>
                    </div>
                  </div>
                  <div className="border-t border-[#e1d4b9] pt-3">
                    <h3 className="text-[11px] font-mono-code uppercase tracking-widest text-[#047857] font-bold">
                      Road to Doomsday Connection
                    </h3>
                    <div className="mt-1">
                      <Redactable
                        titleIds={[t.id]}
                        watchedSet={watchedSet}
                        spoilerShield={spoilerShield}
                        label="Doomsday Link"
                      >
                        <p className="text-sm text-[#1d1610] leading-relaxed">{t.doomsdayConnection}</p>
                      </Redactable>
                    </div>
                  </div>
                </div>

                {t.postCredits && t.postCredits.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#c2410c] font-bold">
                      Post-Credits Stingers
                    </h3>
                    {t.postCredits.map((pc, idx) => (
                      <div key={idx} className="tva-sheet rounded p-3 space-y-2 border-[#ea580c]/40">
                        <span className="tva-ink-stamp border-[#c2410c] bg-[#c2410c]/10 text-[#9a3412]">
                          {pc.label}
                        </span>
                        <Redactable
                          titleIds={[t.id]}
                          watchedSet={watchedSet}
                          spoilerShield={spoilerShield}
                          label="Post-Credits"
                        >
                          <p className="text-xs text-[#1d1610] leading-relaxed">{pc.summary}</p>
                        </Redactable>
                        <div className="flex flex-wrap gap-2">
                          {pc.leadsToTitleId && (
                            <button
                              type="button"
                              onClick={() => onSelect({ kind: 'title', id: pc.leadsToTitleId! })}
                              className="text-xs font-mono-code font-semibold text-[#9a3412] hover:underline"
                            >
                              Leads to → {titlesById.get(pc.leadsToTitleId)?.title}
                            </button>
                          )}
                          {pc.threadId && (
                            <button
                              type="button"
                              onClick={() => onSelect({ kind: 'thread', id: pc.threadId! })}
                              className="text-xs font-mono-code font-semibold text-[#c2410c] hover:underline"
                            >
                              Thread → {threadsById.get(pc.threadId)?.title}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {t.keyCharacterIds.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#61503e] font-bold">
                      Key Characters ({t.keyCharacterIds.length})
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {t.keyCharacterIds.map((cId) => {
                        const ch = charactersById.get(cId);
                        if (!ch) return null;
                        return (
                          <button
                            key={cId}
                            type="button"
                            onClick={() => onSelect({ kind: 'character', id: cId })}
                            className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1 text-xs font-medium text-[#1d1610] hover:border-[#b45309]"
                          >
                            {ch.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {titleThreads.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#61503e] font-bold">
                      Plot Threads Touched
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {titleThreads.map((th) => (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => onSelect({ kind: 'thread', id: th.id })}
                          className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1 text-xs font-semibold text-[#9a3412] hover:border-[#b45309]"
                        >
                          {th.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {selected.kind === 'reality' && (() => {
            const r = realitiesById.get(selected.id);
            if (!r) return <p className="text-sm text-[#61503e]">Reality not found.</p>;
            const anchor = r.anchorBeingId ? charactersById.get(r.anchorBeingId) : null;
            const residents = CHARACTERS.filter(
              (c) => c.originRealityId === r.id || c.currentRealityId === r.id,
            );
            const rTitles = TITLES.filter((t) => t.realityId === r.id);

            return (
              <>
                <EntityVisual
                  variant="plate"
                  code={r.code}
                  title={r.name}
                  subtitle={r.placeName}
                  accentColor={r.color}
                  wikiPage={r.wikiPage}
                />

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Globe2 className="w-5 h-5" style={{ color: r.color }} />
                    <span className="tva-ink-stamp" style={{ borderColor: r.color, color: r.color }}>
                      {r.code} · {r.status}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-[#1d1610]">{r.name}</h2>
                  <p className="text-xs font-mono-code text-[#61503e]">
                    {r.designation} · Landmark: {r.placeName}
                  </p>
                </div>

                <div className="tva-sheet rounded-md p-4 space-y-3">
                  <p className="text-sm text-[#1d1610] leading-relaxed">{r.summary}</p>
                  {anchor && (
                    <div className="border-t border-[#e1d4b9] pt-3">
                      <span className="text-[11px] font-mono-code uppercase text-[#9a3412] font-bold">
                        Anchor Being / Keystone
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelect({ kind: 'character', id: anchor.id })}
                        className="block mt-1 text-sm font-semibold text-[#9a3412] hover:underline"
                      >
                        {anchor.name} ({anchor.alias})
                      </button>
                    </div>
                  )}
                  <div className="border-t border-[#e1d4b9] pt-3 space-y-1.5">
                    <span className="text-[11px] font-mono-code uppercase text-[#9a3412] font-bold">
                      Notable Multiversal Events
                    </span>
                    <ul className="space-y-1 text-xs text-[#1d1610]/90 list-disc pl-4">
                      {r.notableEvents.map((ev, i) => (
                        <li key={i}>{ev}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#61503e] font-bold">
                    Connected Players ({residents.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {residents.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onSelect({ kind: 'character', id: c.id })}
                        className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1 text-xs text-[#1d1610] hover:border-[#b45309]"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#61503e] font-bold">
                    Titles Set Here ({rTitles.length})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {rTitles.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onSelect({ kind: 'title', id: t.id })}
                        className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1 text-xs font-semibold text-[#9a3412] hover:border-[#b45309]"
                      >
                        {t.title} ({t.year})
                      </button>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}

          {selected.kind === 'thread' && (() => {
            const th = threadsById.get(selected.id);
            if (!th) return <p className="text-sm text-[#61503e]">Thread not found.</p>;
            return (
              <>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="tva-ink-stamp border-[#c2410c] bg-[#c2410c]/10 text-[#9a3412]">
                      {th.category} · {th.status}
                    </span>
                    {th.isTheory && (
                      <span className="tva-ink-stamp border-[#7e22ce] bg-[#7e22ce]/10 text-[#6b21a8]">
                        <Sparkles className="w-3 h-3" /> Unconfirmed Theory
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-[#1d1610]">{th.title}</h2>
                </div>

                <div className="tva-sheet rounded-md p-4 space-y-3">
                  <Redactable
                    titleIds={th.keyTitleIds}
                    watchedSet={watchedSet}
                    spoilerShield={spoilerShield}
                    label="Plot Thread"
                  >
                    <p className="text-sm text-[#1d1610] leading-relaxed">{th.summary}</p>
                    <div className="border-t border-[#e1d4b9] pt-3 mt-3">
                      <h3 className="text-[11px] font-mono-code uppercase tracking-widest text-[#047857] font-bold">
                        Doomsday Impact
                      </h3>
                      <p className="mt-1 text-sm text-[#1d1610] leading-relaxed">{th.doomsdayImpact}</p>
                    </div>
                  </Redactable>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#61503e] font-bold">
                    Step-by-Step Progression
                  </h3>
                  <div className="space-y-2">
                    {th.beats.map((b, i) => {
                      const t = titlesById.get(b.titleId);
                      return (
                        <div key={i} className="tva-sheet rounded p-3 space-y-1">
                          <button
                            type="button"
                            onClick={() => onSelect({ kind: 'title', id: b.titleId })}
                            className="text-xs font-bold text-[#9a3412] hover:underline"
                          >
                            {t?.title} ({t?.year})
                          </button>
                          <Redactable titleIds={[b.titleId]} watchedSet={watchedSet} spoilerShield={spoilerShield}>
                            <p className="text-xs text-[#1d1610]/90">{b.note}</p>
                          </Redactable>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#61503e] font-bold">
                    Key Players
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {th.characterIds.map((cId) => {
                      const c = charactersById.get(cId);
                      if (!c) return null;
                      return (
                        <button
                          key={cId}
                          type="button"
                          onClick={() => onSelect({ kind: 'character', id: cId })}
                          className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1 text-xs text-[#1d1610] hover:border-[#b45309]"
                        >
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </aside>
    </div>
  );
}
