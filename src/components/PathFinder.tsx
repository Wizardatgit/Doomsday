import { useMemo } from 'react';
import {
  ArrowDown,
  ArrowLeftRight,
  Bookmark,
  CheckCircle2,
  Compass,
  Globe2,
  Shuffle,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  charactersById,
  factionsById,
  formatTitleWithYear,
  getCharacterChipLabel,
  realitiesById,
  threadsById,
  titlesById,
} from '../data/index.ts';
import type { EntityRef } from '../data/index.ts';
import { buildUnifiedGraph, findShortestPath, type UnifiedGraph } from '../lib/graph.ts';
import { personTmdbQuery, titleTmdbQuery } from '../lib/tmdb.ts';
import { EntityVisual, ViewHeroBanner } from './TvaArt.tsx';
import { Redactable } from './Redactable.tsx';

export const QUICK_PAIRS = [
  { label: 'X-Men (2000) → Doomsday', from: 'title:x-men-2000', to: 'title:avengers-doomsday' },
  { label: 'Blade (1998) → Gambit', from: 'title:blade-1998', to: 'character:gambit' },
  { label: 'Iron Man (2008) → Doctor Doom', from: 'title:iron-man', to: 'character:doctor-doom' },
  { label: 'The Marvels → Professor X', from: 'title:the-marvels', to: 'character:professor-x' },
  { label: 'First Avenger → Steve Rogers', from: 'title:captain-america-first-avenger', to: 'character:steve-rogers' },
  { label: 'Fantastic Four (2005) → Gambit', from: 'title:fantastic-four-2005', to: 'character:gambit' },
  { label: "Spider-Man (2002) → Doctor Strange", from: 'title:spider-man-2002', to: 'character:doctor-strange' },
  { label: 'Deadpool → Franklin Richards', from: 'character:deadpool', to: 'character:franklin-richards' },
];

/** Picks a random reachable multi-hop pair distinct from the active origin/target pair. */
export function pickRandomTracePair(
  graph: UnifiedGraph,
  currentOrigin: string,
  currentTarget: string,
): { from: string; to: string } {
  const candidates = Array.from(graph.nodes.values()).filter((n) => n.kind !== 'reality');
  let twoHopFallback: { from: string; to: string } | null = null;

  for (let attempt = 0; attempt < 28 && candidates.length >= 2; attempt += 1) {
    const a = candidates[Math.floor(Math.random() * candidates.length)];
    const b = candidates[Math.floor(Math.random() * candidates.length)];
    if (!a || !b || a.key === b.key) continue;
    if (a.key === currentOrigin && b.key === currentTarget) continue;
    const path = findShortestPath(graph, a.key, b.key);
    if (!path || path.length < 2) continue;
    if (path.length >= 3) return { from: a.key, to: b.key };
    if (!twoHopFallback) twoHopFallback = { from: a.key, to: b.key };
  }

  if (twoHopFallback) return twoHopFallback;

  const altPresets = QUICK_PAIRS.filter(
    (q) =>
      (q.from !== currentOrigin || q.to !== currentTarget) &&
      graph.nodes.has(q.from) &&
      graph.nodes.has(q.to),
  );
  if (altPresets.length > 0) {
    const chosen = altPresets[Math.floor(Math.random() * altPresets.length)];
    return { from: chosen.from, to: chosen.to };
  }
  return { from: QUICK_PAIRS[0].from, to: QUICK_PAIRS[0].to };
}

export function PathFinder({
  originKey,
  targetKey,
  onChangeOrigin,
  onChangeTarget,
  showTheories,
  watchedSet,
  spoilerShield,
  tmdbApiKey,
  onSelect,
}: {
  originKey: string;
  targetKey: string;
  onChangeOrigin: (key: string) => void;
  onChangeTarget: (key: string) => void;
  showTheories: boolean;
  watchedSet: Set<string>;
  spoilerShield: boolean;
  tmdbApiKey: string;
  onSelect: (ref: EntityRef) => void;
}) {
  const graph = useMemo(() => buildUnifiedGraph(showTheories), [showTheories]);

  const sortedOptions = useMemo(() => {
    const order = { character: 0, title: 1, thread: 2, reality: 3 };
    return Array.from(graph.nodes.values()).sort(
      (a, b) => order[a.kind] - order[b.kind] || a.label.localeCompare(b.label),
    );
  }, [graph]);

  const steps = useMemo(
    () => findShortestPath(graph, originKey, targetKey),
    [graph, originKey, targetKey],
  );

  const routeIntel = useMemo(() => {
    if (!steps || steps.length === 0) {
      return { realities: [], players: [], hasTheoryEdge: false };
    }
    const realityIds = new Set<string>();
    const playerIds = new Set<string>();
    let hasTheoryEdge = false;

    for (const s of steps) {
      if (s.edgeFromPrev?.isTheory) hasTheoryEdge = true;
      if (s.node.kind === 'reality') {
        realityIds.add(s.node.ref.id);
      } else if (s.node.kind === 'character') {
        playerIds.add(s.node.ref.id);
        const ch = charactersById.get(s.node.ref.id);
        if (ch) realityIds.add(ch.currentRealityId);
      } else if (s.node.kind === 'title') {
        const ti = titlesById.get(s.node.ref.id);
        if (ti) {
          realityIds.add(ti.realityId);
          for (const cid of ti.keyCharacterIds.slice(0, 4)) playerIds.add(cid);
        }
      } else if (s.node.kind === 'thread') {
        const th = threadsById.get(s.node.ref.id);
        if (th) {
          for (const cid of th.characterIds.slice(0, 4)) playerIds.add(cid);
        }
      }
    }

    const realities = Array.from(realityIds)
      .map((id) => realitiesById.get(id))
      .filter((r): r is NonNullable<typeof r> => Boolean(r));
    const players = Array.from(playerIds)
      .map((id) => charactersById.get(id))
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .slice(0, 8);

    return { realities, players, hasTheoryEdge };
  }, [steps]);

  const handleRandomTrace = () => {
    const next = pickRandomTracePair(graph, originKey, targetKey);
    onChangeOrigin(next.from);
    onChangeTarget(next.to);
  };

  const hopCount = steps ? Math.max(0, steps.length - 1) : 0;

  return (
    <div className="space-y-5">
      <ViewHeroBanner
        wikiPage="Multiverse_(Marvel_Cinematic_Universe)"
        staticImagePath="./places/tva-yggdrasil.jpg"
        preferWikiOverStatic
        catalogStamp="TVA CHRONOLOGY VECTOR TRACER"
        title='Path Tracer ("Connect Any Two Dots")'
        subtitle="Pick any two characters, films, realities, or threads to trace the chain linking them into Avengers: Doomsday."
        accentColor="#d97706"
        emblem="tva"
      />

      {/* Picker Bar + Presets + Random Trace */}
      <div className="tva-folder rounded-md p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <div className="space-y-1">
            <label htmlFor="path-origin-select" className="text-[11px] font-mono-code uppercase font-bold text-[#9a3412]">
              Origin Node
            </label>
            <select
              id="path-origin-select"
              value={graph.nodes.has(originKey) ? originKey : sortedOptions[0]?.key ?? ''}
              onChange={(e) => onChangeOrigin(e.target.value)}
              className="w-full rounded border border-[#cbb895] bg-[#fffaf0] px-3 py-2 text-xs text-[#1d1610] focus:border-[#b45309] focus:outline-none"
            >
              {sortedOptions.map((n) => (
                <option key={n.key} value={n.key}>
                  [{n.kind.toUpperCase()}] {n.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              onChangeOrigin(targetKey);
              onChangeTarget(originKey);
            }}
            className="rounded border border-[#cbb895] bg-[#fffaf0] p-2 text-[#c2410c] hover:border-[#b45309] self-center md:mb-0.5"
            title="Swap origin and target"
            aria-label="Swap origin and target"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          <div className="space-y-1">
            <label htmlFor="path-target-select" className="text-[11px] font-mono-code uppercase font-bold text-[#047857]">
              Target Node
            </label>
            <select
              id="path-target-select"
              value={graph.nodes.has(targetKey) ? targetKey : sortedOptions[0]?.key ?? ''}
              onChange={(e) => onChangeTarget(e.target.value)}
              className="w-full rounded border border-[#cbb895] bg-[#fffaf0] px-3 py-2 text-xs text-[#1d1610] focus:border-[#b45309] focus:outline-none"
            >
              {sortedOptions.map((n) => (
                <option key={n.key} value={n.key}>
                  [{n.kind.toUpperCase()}] {n.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-dashed border-[#d6c6a5]">
          <div className="flex flex-wrap gap-1.5 pt-1">
            {QUICK_PAIRS.map((q) => {
              const active = originKey === q.from && targetKey === q.to;
              return (
                <button
                  key={q.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    onChangeOrigin(q.from);
                    onChangeTarget(q.to);
                  }}
                  className={`rounded border px-2.5 py-1 text-[11px] font-mono-code transition-colors ${
                    active
                      ? 'border-[#b45309] bg-[#b45309] text-white font-bold shadow-xs'
                      : 'border-[#cbb895] bg-[#fffaf0] text-[#61503e] hover:border-[#b45309] hover:text-[#9a3412]'
                  }`}
                >
                  {q.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={handleRandomTrace}
            className="inline-flex items-center gap-1.5 rounded bg-[#1b1511] px-3 py-1.5 text-[11px] font-mono-code font-bold uppercase text-[#f59e0b] border border-[#3a2c22] hover:border-[#f59e0b] shrink-0"
          >
            <Shuffle className="w-3.5 h-3.5" /> Random Trace
          </button>
        </div>
      </div>

      {!steps ? (
        <div className="tva-folder rounded-md p-6 text-center space-y-3">
          <p className="text-sm text-[#61503e]">
            No direct narrative chain found between those two nodes with the current Theory Layer setting.
          </p>
          <button
            type="button"
            onClick={handleRandomTrace}
            className="inline-flex items-center gap-1.5 rounded bg-[#1b1511] px-3 py-1.5 text-xs font-mono-code font-bold uppercase text-[#f59e0b]"
          >
            <Shuffle className="w-3.5 h-3.5" /> Trace a Random Route
          </button>
        </div>
      ) : (
        <div className="tva-folder rounded-md overflow-hidden border-l-4 border-l-[#c2410c]">
          {/* Dark-Bakelite TemPad Vector Telemetry Header */}
          <div className="bg-[#1b1511] text-[#faf3e3] px-4 py-3 border-b border-[#3a2c22] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#f59e0b] font-bold mr-1">
                VECTOR TRACK
              </span>
              {steps.map((s, idx) => (
                <div key={s.node.key} className="inline-flex items-center gap-1.5 min-w-0">
                  {idx > 0 && (
                    <span aria-hidden="true" className="text-[#c58f36] font-mono-code text-[10px]">
                      ···&gt;
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded bg-[#261d17] border border-[#3d2e22] px-2 py-0.5 text-[11px] font-medium text-[#f7ebd4] max-w-[160px] truncate">
                    <span
                      aria-hidden="true"
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.node.color }}
                    />
                    <span className="truncate">{s.node.label}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <span className="rounded bg-[#261d17] border border-[#3d2e22] px-2 py-0.5 text-[10px] font-mono-code font-bold text-[#f59e0b]">
                {hopCount} {hopCount === 1 ? 'HOP' : 'HOPS'}
              </span>
              <span className="rounded bg-[#261d17] border border-[#3d2e22] px-2 py-0.5 text-[10px] font-mono-code font-bold text-[#e6d5b5]">
                {routeIntel.realities.length} {routeIntel.realities.length === 1 ? 'REALITY' : 'REALITIES'}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-mono-code font-bold ${
                  routeIntel.hasTheoryEdge
                    ? 'bg-[#7e22ce]/30 border border-[#a855f7]/50 text-[#e9d5ff]'
                    : 'bg-[#047857]/25 border border-[#10b981]/40 text-[#a7f3d0]'
                }`}
              >
                {routeIntel.hasTheoryEdge ? 'THEORY LINK' : 'CANON ROUTE'}
              </span>
            </div>
          </div>

          {/* 2-Column Spread: Evidence Board Chain (left) + Route Brief Sidebar (right) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 p-4 sm:p-5">
            {/* Left: Evidence Board Rail + Rich Dossier Cards */}
            <div className="xl:col-span-8 bg-[#f4ebd8]/65 rounded-md border border-[#d6c6a5] p-3.5 sm:p-4 space-y-1">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-dashed border-[#cbb895] text-[10px] font-mono-code uppercase font-bold text-[#9a3412]">
                <span>EVIDENCE TRAIL // CHRONOLOGICAL HOPS</span>
                <span>Click any card to open Dossier</span>
              </div>

              <div className="pt-2 space-y-1">
                {steps.map((step, i) => {
                  const char = step.node.kind === 'character' ? charactersById.get(step.node.ref.id) : null;
                  const title = step.node.kind === 'title' ? titlesById.get(step.node.ref.id) : null;
                  const reality = step.node.kind === 'reality' ? realitiesById.get(step.node.ref.id) : null;
                  const thread = step.node.kind === 'thread' ? threadsById.get(step.node.ref.id) : null;

                  const roleStamp = i === 0 ? 'ORIGIN' : i === steps.length - 1 ? 'TARGET' : 'BRIDGE';
                  const watched = title ? watchedSet.has(title.id) : false;
                  const bridgeTitle = step.edgeFromPrev?.titleId
                    ? titlesById.get(step.edgeFromPrev.titleId)
                    : undefined;

                  const summaryText = char
                    ? char.whoAreThey
                    : title
                      ? title.doomsdayConnection || title.summary
                      : reality
                        ? reality.summary
                        : thread?.summary ?? '';

                  return (
                    <div key={step.node.key} className="space-y-1">
                      {step.edgeFromPrev && (
                        <div className="flex items-center gap-3 pl-3 sm:pl-4 py-1">
                          <div className="flex flex-col items-center shrink-0 w-7">
                            <div className="w-0.5 h-3 border-l-2 border-dashed border-[#c2410c]/55" />
                            <ArrowDown className="w-3.5 h-3.5 text-[#c2410c]" />
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-mono-code font-semibold inline-flex items-center gap-1 ${
                                step.edgeFromPrev.isTheory
                                  ? 'border-[#7e22ce] bg-[#7e22ce]/10 text-[#6b21a8]'
                                  : 'border-[#c2410c] bg-[#fffaf0] text-[#9a3412]'
                              }`}
                            >
                              {step.edgeFromPrev.isTheory && <Sparkles className="w-3 h-3" />}
                              {step.edgeFromPrev.label}
                            </span>
                            {bridgeTitle && (
                              <span className="text-[10px] font-mono-code text-[#61503e] bg-[#efe3c8] px-2 py-0.5 rounded border border-[#d4c3a3]">
                                via {formatTitleWithYear(bridgeTitle)}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-stretch gap-3">
                        {/* Numbered Brass Track Station */}
                        <div className="flex flex-col items-center shrink-0 pt-3 w-7">
                          <span
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono-code font-bold shadow-xs border ${
                              i === 0
                                ? 'bg-[#9a3412] text-white border-[#7c2d12]'
                                : i === steps.length - 1
                                  ? 'bg-[#047857] text-white border-[#065f46]'
                                  : 'bg-[#1b1511] text-[#f59e0b] border-[#c58f36]'
                            }`}
                          >
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          {i < steps.length - 1 && (
                            <div className="flex-1 w-0.5 mt-1 border-l-2 border-dashed border-[#c2410c]/45" />
                          )}
                        </div>

                        {/* Enriched Dossier Card */}
                        <div
                          onClick={() => onSelect(step.node.ref)}
                          className="flex-1 min-w-0 tva-sheet tva-comic-corner tva-polaroid-lift rounded-md p-3.5 cursor-pointer hover:border-[#b45309] transition-colors flex gap-3.5 items-start"
                          style={{ borderLeft: `4px solid ${step.node.color}` }}
                        >
                          {char || title || reality ? (
                            <EntityVisual
                              variant={char ? 'polaroid' : 'poster'}
                              code={char?.catalogCode ?? reality?.code ?? `${title?.year}`}
                              title={step.node.label}
                              subtitle={char?.alias ?? reality?.placeName ?? `${title?.year}`}
                              accentColor={step.node.color}
                              staticImagePath={reality?.imagePath}
                              preferWikiOverStatic={reality?.preferGenuineWiki}
                              wikiPage={char?.wikiPage ?? reality?.wikiPage ?? title?.wikiPage}
                              tmdbQuery={
                                char
                                  ? personTmdbQuery(char.actor)
                                  : title
                                    ? titleTmdbQuery(title)
                                    : undefined
                              }
                              tmdbApiKey={tmdbApiKey}
                              compact
                              hideZoomTrigger
                            />
                          ) : (
                            <div
                              className="w-12 h-16 rounded-sm border border-[#cbb895] bg-[#1e1712] shrink-0 flex flex-col items-center justify-center gap-1 p-1"
                              style={{ borderTop: `3px solid ${step.node.color}` }}
                            >
                              <Bookmark className="w-4 h-4 text-[#f59e0b]" />
                              <span className="text-[7px] font-mono-code font-bold text-[#e6d5b5] uppercase">
                                CASE
                              </span>
                            </div>
                          )}

                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`tva-ink-stamp !text-[9px] ${
                                    roleStamp === 'ORIGIN'
                                      ? 'border-[#9a3412] bg-[#9a3412]/10 text-[#9a3412]'
                                      : roleStamp === 'TARGET'
                                        ? 'border-[#047857] bg-[#047857]/10 text-[#065f46]'
                                        : 'border-[#8c775c] bg-[#f4ebd4] text-[#4a3b2c]'
                                  }`}
                                >
                                  {roleStamp}
                                </span>
                                <span
                                  className="tva-ink-stamp !text-[9px] bg-[#fffaf0] text-[#1d1610]"
                                  style={{ borderColor: step.node.color }}
                                >
                                  {step.node.kind}
                                </span>
                              </div>
                              {watched && (
                                <span className="inline-flex items-center gap-1 rounded bg-[#047857]/15 px-1.5 py-0.5 text-[9px] font-mono-code font-bold text-[#065f46]">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> WATCHED
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelect(step.node.ref);
                              }}
                              className="text-base font-bold text-[#1d1610] hover:text-[#9a3412] hover:underline truncate max-w-full text-left block"
                            >
                              {step.node.label}
                            </button>

                            <p className="text-[11px] font-mono-code text-[#61503e] truncate">
                              {step.node.sublabel}
                            </p>

                            {summaryText && (
                              <Redactable
                                titleIds={step.node.titleIds}
                                watchedSet={watchedSet}
                                spoilerShield={spoilerShield}
                              >
                                <p className="text-xs text-[#4a3b2c] leading-relaxed line-clamp-2">
                                  {summaryText}
                                </p>
                              </Redactable>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Route Brief & Connected Intel Sidebar */}
            <aside className="xl:col-span-4 space-y-4">
              <div className="tva-sheet rounded-md p-4 space-y-3 border-t-[3px] border-t-[#b45309]">
                <div className="flex items-center justify-between gap-2 border-b border-dashed border-[#d4c3a3] pb-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono-code font-bold uppercase text-[#9a3412]">
                    <Compass className="w-3.5 h-3.5" /> Route Brief
                  </span>
                  <span className="text-[10px] font-mono-code font-bold text-[#61503e]">
                    {steps.length} NODES
                  </span>
                </div>

                <p className="text-xs text-[#4a3b2c] leading-relaxed">
                  Traces <strong className="text-[#1d1610]">{steps[0].node.label}</strong> to{' '}
                  <strong className="text-[#1d1610]">{steps[steps.length - 1].node.label}</strong> across{' '}
                  {hopCount} documented {hopCount === 1 ? 'link' : 'links'} touching{' '}
                  {routeIntel.realities.length || 1} {routeIntel.realities.length === 1 ? 'reality' : 'realities'}.
                </p>

                {routeIntel.realities.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-mono-code font-bold uppercase text-[#61503e]">
                      <Globe2 className="w-3 h-3 text-[#7c3aed]" /> Realities Crossed
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {routeIntel.realities.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => onSelect({ kind: 'reality', id: r.id })}
                          className="rounded border border-[#cbb895] bg-[#faf4e6] px-2 py-1 text-[11px] font-mono-code font-semibold text-[#1d1610] hover:border-[#b45309] inline-flex items-center gap-1.5"
                        >
                          <span
                            aria-hidden="true"
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: r.color }}
                          />
                          {r.code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {routeIntel.players.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-dashed border-[#d4c3a3]">
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-mono-code font-bold uppercase text-[#61503e]">
                      <Users className="w-3 h-3 text-[#047857]" /> Key Players Along Route
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {routeIntel.players.map((ch) => {
                        const fColor = factionsById.get(ch.factionId)?.color ?? '#c2410c';
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() => onSelect({ kind: 'character', id: ch.id })}
                            className="rounded border border-[#cbb895] bg-[#faf4e6] px-2 py-0.5 text-[11px] font-medium text-[#1d1610] hover:border-[#b45309] inline-flex items-center gap-1"
                          >
                            <span
                              aria-hidden="true"
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: fColor }}
                            />
                            {getCharacterChipLabel(ch.id)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-dashed border-[#d4c3a3]">
                  <button
                    type="button"
                    onClick={() => {
                      onChangeOrigin(targetKey);
                      onChangeTarget(originKey);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1.5 text-[11px] font-mono-code font-semibold text-[#1d1610] hover:border-[#b45309]"
                  >
                    <ArrowLeftRight className="w-3 h-3 text-[#c2410c]" /> Reverse Route
                  </button>
                  <button
                    type="button"
                    onClick={handleRandomTrace}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded bg-[#1b1511] px-2.5 py-1.5 text-[11px] font-mono-code font-bold text-[#f59e0b] hover:bg-[#2a2018]"
                  >
                    <Shuffle className="w-3 h-3" /> Random Trace
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
