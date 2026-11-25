import { Fragment, useMemo, useState } from 'react';
import { CheckSquare, Compass, Filter, RotateCcw, Square } from 'lucide-react';
import { BEGINNER_12_IDS, TITLES, getCharacterChipLabel, realitiesById } from '../data/index.ts';
import type { EntityRef, TitleEra } from '../data/types.ts';
import { titleTmdbQuery } from '../lib/tmdb.ts';
import type { TimelinePreset } from '../state/useAppState.ts';
import { EntityVisual, SectionDivider, ViewHeroBanner } from './TvaArt.tsx';
import { Redactable } from './Redactable.tsx';

type OrderMode = 'chrono' | 'release';
type EraFilter = 'all' | 'pre-phase-1' | 'infinity' | 'defenders' | 'multiverse';
type WatchFilter = 'all' | 'unwatched' | 'watched';

const BEGINNER_SET = new Set(BEGINNER_12_IDS);

export function SacredTimeline({
  watchedSet,
  spoilerShield,
  tmdbApiKey,
  timelinePreset,
  onChangePreset,
  onToggleWatched,
  onMarkEraWatched,
  onSelect,
}: {
  watchedSet: Set<string>;
  spoilerShield: boolean;
  tmdbApiKey: string;
  timelinePreset: TimelinePreset;
  onChangePreset: (preset: TimelinePreset) => void;
  onToggleWatched: (titleId: string) => void;
  onMarkEraWatched: (era: TitleEra, watched: boolean) => void;
  onSelect: (ref: EntityRef) => void;
}) {
  const [orderMode, setOrderMode] = useState<OrderMode>('chrono');
  const [eraFilter, setEraFilter] = useState<EraFilter>('all');
  const [realityFilter, setRealityFilter] = useState<string>('all');
  const [watchFilter, setWatchFilter] = useState<WatchFilter>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const uniqueRealities = useMemo(() => {
    const ids = Array.from(new Set(TITLES.map((t) => t.realityId)));
    return ids.map((id) => realitiesById.get(id)!).filter(Boolean);
  }, []);

  const filteredTitles = useMemo(() => {
    const list = TITLES.filter((t) => {
      if (eraFilter === 'pre-phase-1' && t.era !== 'pre-phase-1') return false;
      if (eraFilter === 'infinity' && !['phase-1', 'phase-2', 'phase-3'].includes(t.era)) return false;
      if (eraFilter === 'defenders' && t.era !== 'defenders') return false;
      if (eraFilter === 'multiverse' && !['phase-4', 'phase-5', 'phase-6'].includes(t.era)) return false;
      if (realityFilter !== 'all' && t.realityId !== realityFilter) return false;
      if (timelinePreset === 'beginner' && !BEGINNER_SET.has(t.id)) return false;
      if (timelinePreset === 'essential' && t.importance !== 'essential') return false;
      if (timelinePreset === 'key' && t.importance === 'background') return false;
      if (watchFilter === 'watched' && !watchedSet.has(t.id)) return false;
      if (watchFilter === 'unwatched' && watchedSet.has(t.id)) return false;
      return true;
    });

    return [...list].sort((a, b) =>
      orderMode === 'chrono'
        ? a.chronoOrder - b.chronoOrder
        : a.releaseDate.localeCompare(b.releaseDate),
    );
  }, [orderMode, eraFilter, realityFilter, timelinePreset, watchFilter, watchedSet]);

  return (
    <div className="space-y-5">
      <ViewHeroBanner
        staticImagePath="./places/tva-yggdrasil.jpg"
        posterInsetWikiPage="Avengers:_Doomsday"
        catalogStamp="TVA CHRONOLOGY REEL // FULL WATCH ORDER"
        title={`Archival Timeline Reel (${filteredTitles.length})`}
        subtitle="Pre-Phase-1 legacy foundations, Phases 1–3, Canon Defenders Saga, and Phases 4–6 leading to Dec 18, 2026."
        accentColor="#c2410c"
        emblem="tva"
      >
        <div className="flex items-center gap-1 rounded border border-[#cbb895]/40 bg-[#1a130e]/90 p-1">
          <button
            type="button"
            onClick={() => setOrderMode('chrono')}
            className={`rounded px-3 py-1.5 text-xs font-mono-code font-semibold ${
              orderMode === 'chrono'
                ? 'bg-amber-400 text-[#1a130e]'
                : 'text-[#dfd1b5] hover:text-amber-300'
            }`}
          >
            Story Chronological
          </button>
          <button
            type="button"
            onClick={() => setOrderMode('release')}
            className={`rounded px-3 py-1.5 text-xs font-mono-code font-semibold ${
              orderMode === 'release'
                ? 'bg-amber-400 text-[#1a130e]'
                : 'text-[#dfd1b5] hover:text-amber-300'
            }`}
          >
            Release Order
          </button>
        </div>
      </ViewHeroBanner>

      <div className="tva-folder rounded-md p-4 space-y-4">

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <Filter className="w-4 h-4 text-[#c2410c] shrink-0" />
          <select
            value={eraFilter}
            onChange={(e) => setEraFilter(e.target.value as EraFilter)}
            className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1.5 text-xs font-mono-code text-[#1d1610]"
          >
            <option value="all">All Eras ({TITLES.length})</option>
            <option value="pre-phase-1">Pre-Phase 1 Legacy (Fox/Sony/Blade)</option>
            <option value="infinity">Infinity Saga (Phases 1–3)</option>
            <option value="defenders">Defenders Saga (Canon)</option>
            <option value="multiverse">Multiverse Saga (Phases 4–6)</option>
          </select>

          <select
            value={realityFilter}
            onChange={(e) => setRealityFilter(e.target.value)}
            className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1.5 text-xs font-mono-code text-[#1d1610]"
          >
            <option value="all">All Realities</option>
            {uniqueRealities.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} — {r.name}
              </option>
            ))}
          </select>

          <select
            value={timelinePreset}
            onChange={(e) => onChangePreset(e.target.value as TimelinePreset)}
            className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1.5 text-xs font-mono-code text-[#1d1610]"
          >
            <option value="all">All Importance Tiers ({TITLES.length})</option>
            <option value="beginner">Beginner 12-Title Catch-Up</option>
            <option value="essential">Essential Only</option>
            <option value="key">Essential + Key Context</option>
          </select>

          <select
            value={watchFilter}
            onChange={(e) => setWatchFilter(e.target.value as WatchFilter)}
            className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1.5 text-xs font-mono-code text-[#1d1610]"
          >
            <option value="all">Watched &amp; Unwatched</option>
            <option value="unwatched">Unwatched Only</option>
            <option value="watched">Watched Only</option>
          </select>

          {(eraFilter !== 'all' ||
            realityFilter !== 'all' ||
            timelinePreset !== 'all' ||
            watchFilter !== 'all' ||
            orderMode !== 'chrono') && (
            <button
              type="button"
              onClick={() => {
                setOrderMode('chrono');
                setEraFilter('all');
                setRealityFilter('all');
                onChangePreset('all');
                setWatchFilter('all');
              }}
              className="inline-flex items-center gap-1 rounded border border-[#b45309] bg-[#b45309]/10 px-2.5 py-1.5 text-xs font-mono-code font-semibold text-[#9a3412] hover:bg-[#b45309]/20"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          )}

          <div className="ml-auto flex flex-wrap gap-1.5">
            {(['phase-1', 'phase-2', 'phase-3', 'phase-4', 'phase-5', 'phase-6'] as TitleEra[]).map((era) => (
              <button
                key={era}
                type="button"
                onClick={() => onMarkEraWatched(era, true)}
                className="rounded border border-[#cbb895] bg-[#fffaf0] px-2 py-1 text-[10px] font-mono-code uppercase font-semibold text-[#61503e] hover:border-[#047857] hover:text-[#047857]"
                title={`Mark all ${era} titles as watched`}
              >
                ✓ {era}
              </button>
            ))}
          </div>
        </div>

        {timelinePreset === 'beginner' && (
          <div className="rounded border border-[#047857] bg-[#047857]/10 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#065f46]">
            <span className="flex items-center gap-2">
              <Compass className="w-4 h-4 shrink-0" />
              <span>
                <strong>Beginner 12-Title Catch-Up Active:</strong> The 12 fastest, story-ordered chapters to understand every major player in Avengers: Doomsday.
              </span>
            </span>
            <button
              type="button"
              onClick={() => onChangePreset('all')}
              className="font-mono-code font-bold underline hover:text-[#1d1610]"
            >
              Show all {TITLES.length} titles
            </button>
          </div>
        )}
      </div>

      {/* Archival Filmstrip Ledger */}
      <div className="relative pl-6 sm:pl-8 space-y-3">
        <div className="absolute left-2.5 sm:left-3.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[#c2410c] via-[#d97706] to-[#047857]" />

        {filteredTitles.map((t, index) => {
          const reality = realitiesById.get(t.realityId);
          const watched = watchedSet.has(t.id);
          const color = reality?.color ?? '#c2410c';
          const isOpen = expandedIds.has(t.id);
          const prevEra = index > 0 ? filteredTitles[index - 1]!.eraLabel : null;
          const showEraDivider = t.eraLabel !== prevEra;
          const tierBorder =
            t.importance === 'essential'
              ? '#c2410c'
              : t.importance === 'key'
                ? '#1d4ed8'
                : '#8c775c';

          return (
            <Fragment key={t.id}>
              {showEraDivider && (
                <div className="relative z-10 -ml-6 sm:-ml-8 bg-[#efe5d1] pt-2 pb-1.5 first:pt-0">
                  <SectionDivider
                    badge={t.era.toUpperCase()}
                    title={t.eraLabel}
                    accentColor={color}
                  />
                </div>
              )}
              <div
                onClick={() => onSelect({ kind: 'title', id: t.id })}
                className={`relative tva-folder tva-comic-corner rounded-md p-3.5 cursor-pointer hover:border-[#b45309] transition-colors border-l-4 ${
                  t.id === 'avengers-doomsday' ? 'ring-2 ring-[#047857]' : ''
                }`}
                style={{ borderLeftColor: tierBorder }}
              >
                <span
                  className="absolute -left-[25px] sm:-left-[27px] top-6 w-3 h-3 rounded-full ring-4 ring-[#efe5d1]"
                  style={{ backgroundColor: color }}
                  title={reality?.name}
                />

              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWatched(t.id);
                  }}
                  aria-label={watched ? `Unmark ${t.title}` : `Mark ${t.title} watched`}
                  className={`mt-1 shrink-0 transition-colors ${
                    watched ? 'text-[#047857]' : 'text-[#61503e] hover:text-[#c2410c]'
                  }`}
                >
                  {watched ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                </button>

                <EntityVisual
                  variant="poster"
                  code={reality?.code ?? 'MCU'}
                  title={t.title}
                  subtitle={`${t.year}`}
                  accentColor={color}
                  emblem={t.id === 'avengers-doomsday' ? 'doom' : 'tva'}
                  wikiPage={t.wikiPage}
                  tmdbQuery={titleTmdbQuery(t)}
                  tmdbApiKey={tmdbApiKey}
                  compact
                />

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono-code font-bold text-[#61503e]">#{index + 1}</span>
                      <h3 className={`text-base font-bold ${watched ? 'text-[#61503e] line-through' : 'text-[#1d1610]'}`}>
                        {t.title}
                      </h3>
                      <span className="text-xs font-mono-code font-semibold text-[#9a3412]">({t.year})</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="tva-ink-stamp tva-stamp-angled" style={{ borderColor: color, color }}>
                        {reality?.code}
                      </span>
                      <span
                        className={`tva-ink-stamp tva-stamp-angled ${
                          t.importance === 'essential'
                            ? 'border-[#b45309] bg-[#b45309]/10 text-[#92400e]'
                            : t.importance === 'key'
                              ? 'border-[#1d4ed8] bg-[#1d4ed8]/10 text-[#1e40af]'
                              : 'border-[#cbb895] bg-[#fffaf0] text-[#61503e]'
                        }`}
                      >
                        {t.importance}
                      </span>
                    </div>
                  </div>

                  <Redactable
                    titleIds={[t.id]}
                    watchedSet={watchedSet}
                    spoilerShield={spoilerShield}
                    label="Timeline Beat"
                  >
                    <p className={`text-xs text-[#1d1610]/90 leading-relaxed ${isOpen ? '' : 'line-clamp-1'}`}>
                      <span className="font-mono-code font-bold text-[#047857] uppercase text-[10px] mr-1.5">
                        Doomsday Link:
                      </span>
                      {t.doomsdayConnection}
                    </p>
                  </Redactable>

                  {isOpen && (
                    <div className="pt-1 space-y-1.5">
                      <div className="text-[10px] font-mono-code text-[#61503e] uppercase">
                        {t.eraLabel}{t.runtime ? ` · ${t.runtime}` : ''}
                      </div>
                      {t.keyCharacterIds.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          {t.keyCharacterIds.map((cId) => (
                            <span
                              key={cId}
                              className="rounded bg-[#fffaf0] border border-[#cbb895] px-2 py-0.5 text-[11px] text-[#1d1610]"
                            >
                              {getCharacterChipLabel(cId)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] font-mono-code pt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(t.id);
                      }}
                      className="text-[#9a3412] font-semibold hover:underline"
                    >
                      {isOpen
                        ? '− Less'
                        : `+ Details${t.keyCharacterIds.length > 0 ? ` & Cast (${t.keyCharacterIds.length})` : ''}`}
                    </button>
                    <span className="text-[#61503e]">Open Folder →</span>
                  </div>
                </div>
              </div>
            </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
