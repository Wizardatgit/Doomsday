import { useMemo } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  GitBranch,
  MapPin,
  Network,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  CHARACTERS,
  ICONIC_PLACES,
  REALITIES,
  THREADS,
  TITLES,
  charactersById,
  factionsById,
  realitiesById,
} from '../data/index.ts';
import type { AppView, EntityRef } from '../data/index.ts';
import { EntityVisual } from './TvaArt.tsx';
import { Redactable } from './Redactable.tsx';

const FLAGSHIP_CHARACTER_IDS = [
  'doctor-doom',
  'steve-rogers',
  'loki',
  'reed-richards',
  'cyclops',
  'yelena-belova',
  'sam-wilson',
  'shuri',
];

const FEATURED_PLACE_IDS = [
  'place-watchtower',
  'place-baxter',
  'place-xmansion',
  'place-void',
  'place-wakanda',
  'place-talokan',
  'place-latveria',
  'place-steve-1940s',
];

const CONVERGENCE_THREAD_IDS = [
  'thread-doom-franklin',
  'thread-f4-breach',
  'thread-loki-world-tree',
  'thread-monica-xmen',
  'thread-steve-stolen-lives',
  'thread-two-avengers',
];

const PATH_PRESETS: { label: string; fromKey: string; toKey: string; note: string }[] = [
  {
    label: 'Blade (1998) → Avengers: Doomsday',
    fromKey: 'title:blade-1998',
    toKey: 'title:avengers-doomsday',
    note: 'Pre-Phase 1 Void Resistance to Gambit',
  },
  {
    label: 'Iron Man (2008) → Doctor Doom',
    fromKey: 'title:iron-man',
    toKey: 'character:doctor-doom',
    note: 'RDJ Anchor Being to Multiverse Threat',
  },
  {
    label: 'The Marvels → Professor X',
    fromKey: 'title:the-marvels',
    toKey: 'character:professor-x',
    note: 'Monica’s spacetime rift to Earth-10005',
  },
  {
    label: 'Fantastic Four (2005) → Gambit',
    fromKey: 'title:fantastic-four-2005',
    toKey: 'character:gambit',
    note: 'Chris Evans Torch to Void Resistance',
  },
];

export function CommandHub({
  watchedSet,
  spoilerShield,
  showTheories,
  tmdbApiKey,
  onSelect,
  onNavigate,
  onLaunchPresetPath,
}: {
  watchedSet: Set<string>;
  spoilerShield: boolean;
  showTheories: boolean;
  tmdbApiKey: string;
  onSelect: (ref: EntityRef) => void;
  onNavigate: (view: AppView) => void;
  onLaunchPresetPath: (fromKey: string, toKey: string) => void;
}) {
  const essentialTitles = useMemo(() => TITLES.filter((t) => t.importance === 'essential'), []);
  const watchedEssential = useMemo(
    () => essentialTitles.filter((t) => watchedSet.has(t.id)).length,
    [essentialTitles, watchedSet],
  );
  const daysToDoomsday = useMemo(() => {
    const release = new Date('2026-12-18T00:00:00').getTime();
    return Math.max(0, Math.ceil((release - Date.now()) / 86_400_000));
  }, []);

  const flagshipChars = useMemo(
    () => FLAGSHIP_CHARACTER_IDS.map((id) => charactersById.get(id)!).filter(Boolean),
    [],
  );

  const featuredPlaces = useMemo(
    () => ICONIC_PLACES.filter((p) => FEATURED_PLACE_IDS.includes(p.id)),
    [],
  );

  const coreThreads = useMemo(
    () => THREADS.filter((th) => CONVERGENCE_THREAD_IDS.includes(th.id)),
    [],
  );

  const confirmedCount = useMemo(
    () => CHARACTERS.filter((c) => c.doomsdayStatus === 'confirmed').length,
    [],
  );

  const essentialPct = Math.round((watchedEssential / essentialTitles.length) * 100);

  return (
    <div className="space-y-7">
      {/* Asymmetric Top Desk Spread: Left Master Manila Folder + Right Pinned Polaroid Mugshots */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <div className="xl:col-span-5 tva-folder rounded-md p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="tva-ink-stamp border-[#9a3412] bg-[#9a3412]/10 text-[#9a3412]">
                <Flame className="w-3 h-3" /> MASTER CONVERGENCE BRIEF
              </span>
              <span className="tva-ink-stamp border-[#047857] bg-[#047857]/10 text-[#065f46]">
                T-{daysToDoomsday} DAYS
              </span>
            </div>

            <EntityVisual
              variant="plate"
              code="TVA-00 // CITADEL"
              title="Time Variance Authority & World Tree"
              subtitle="Yggdrasil Multiverse Loom — Active Monitoring"
              accentColor="#c2410c"
              wikiPage="Time_Variance_Authority"
            />

            <h1 className="text-2xl sm:text-3xl font-bold text-[#1d1610] tracking-tight leading-tight">
              Every Dot Leading Into <span className="text-[#9a3412]">Avengers: Doomsday</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#61503e] leading-relaxed">
              An archival TVA desk tracing every player, home reality, pre-Phase-1 crossover, and post-credits stinger converging on December 18, 2026.
            </p>
          </div>

          <div className="space-y-3">
            <div className="tva-sheet rounded p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <span className="text-[#61503e] font-semibold">ESSENTIAL PREP</span>
                <span className="text-[#9a3412] font-bold">
                  {watchedEssential}/{essentialTitles.length} ({essentialPct}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#e4d6bb] overflow-hidden border border-[#cbb895]">
                <div
                  className="h-full bg-gradient-to-r from-[#c2410c] via-[#d97706] to-[#047857] transition-all duration-300"
                  style={{ width: `${essentialPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono-code text-[#61503e]">
                <span>{watchedSet.size}/{TITLES.length} Total Watched</span>
                <span>{REALITIES.length} Realities · {confirmedCount} Confirmed Cast</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onNavigate('graph')}
                className="inline-flex items-center gap-1.5 rounded bg-[#1d1610] px-3.5 py-2 text-xs font-mono-code font-bold uppercase text-[#f59e0b] hover:bg-[#32261c]"
              >
                <Network className="w-3.5 h-3.5" /> Open CRT Web
              </button>
              <button
                type="button"
                onClick={() => onNavigate('timeline')}
                className="inline-flex items-center gap-1.5 rounded border border-[#cbb895] bg-[#fffaf0] px-3.5 py-2 text-xs font-mono-code font-semibold uppercase text-[#1d1610] hover:border-[#b45309]"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#047857]" /> Timeline Reel
              </button>
            </div>
          </div>
        </div>

        {/* Right: Pinned Polaroid Evidence Mugshots */}
        <div className="xl:col-span-7 tva-folder rounded-md p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#cbb895] pb-3">
            <div>
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#9a3412] font-bold">
                EVIDENCE PINBOARD // CONFIRMED PLAYERS
              </span>
              <h2 className="text-lg font-bold text-[#1d1610]">Key Doomsday Personnel</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('dossiers')}
              className="text-xs font-mono-code font-semibold text-[#9a3412] hover:underline inline-flex items-center gap-1"
            >
              <Users className="w-3.5 h-3.5" /> All {CHARACTERS.length} Mugshots <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {flagshipChars.map((c, idx) => {
              const faction = factionsById.get(c.factionId);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelect({ kind: 'character', id: c.id })}
                  className={`group text-left transition-transform hover:-translate-y-1 flex flex-col items-center ${
                    idx % 2 === 0 ? '-rotate-1 hover:rotate-0' : 'rotate-1 hover:rotate-0'
                  }`}
                >
                  <EntityVisual
                    variant="polaroid"
                    code={c.catalogCode}
                    title={c.name}
                    subtitle={c.name}
                    accentColor={faction?.color ?? '#c2410c'}
                    emblem={faction?.emblem ?? 'tva'}
                    wikiPage={c.wikiPage}
                    tmdbQuery={c.tmdbPersonId ? { kind: 'person', id: c.tmdbPersonId } : undefined}
                    tmdbApiKey={tmdbApiKey}
                    className="w-full"
                  />
                  <span className="mt-1 text-[10px] font-mono-code text-[#61503e] truncate max-w-full">
                    {faction?.shortName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Iconic Locations & Realities Filmstrip */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono-code uppercase tracking-widest text-[#1d1610] font-bold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#c2410c]" /> Surveillance Plates: Key Places & Realities
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('realities')}
            className="text-xs font-mono-code font-semibold text-[#9a3412] hover:underline inline-flex items-center gap-1"
          >
            All {ICONIC_PLACES.length} Places & {REALITIES.length} Realities <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {featuredPlaces.map((place) => {
            const reality = realitiesById.get(place.realityId);
            return (
              <button
                key={place.id}
                type="button"
                onClick={() => onSelect({ kind: 'reality', id: place.realityId })}
                className="tva-folder rounded-md p-2.5 text-left hover:border-[#b45309] transition-colors space-y-2"
              >
                <EntityVisual
                  variant="plate"
                  code={reality?.code ?? 'PLACE'}
                  title={place.name}
                  subtitle={place.name}
                  accentColor={reality?.color ?? '#c2410c'}
                  wikiPage={place.wikiPage}
                />
                <p className="text-[11px] text-[#61503e] line-clamp-2 leading-relaxed px-0.5">
                  {place.summary}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Core 6 Convergence Threads */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-mono-code uppercase tracking-widest text-[#1d1610] font-bold">
            Start Here: 6 Core Convergence Case Files
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('threads')}
            className="text-xs font-mono-code font-semibold text-[#9a3412] hover:underline inline-flex items-center gap-1"
          >
            All Case Threads ({THREADS.filter((t) => showTheories || !t.isTheory).length}){' '}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {coreThreads.map((th) => (
            <div
              key={th.id}
              onClick={() => onSelect({ kind: 'thread', id: th.id })}
              className="tva-folder rounded-md p-4 cursor-pointer hover:border-[#b45309] transition-colors flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="tva-ink-stamp border-[#c2410c] bg-[#c2410c]/10 text-[#9a3412]">
                    {th.category}
                  </span>
                  <span className="text-[10px] font-mono-code uppercase font-bold text-[#047857]">
                    {th.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#1d1610]">{th.title}</h3>
                <Redactable titleIds={th.keyTitleIds} watchedSet={watchedSet} spoilerShield={spoilerShield}>
                  <p className="text-xs text-[#61503e] leading-relaxed line-clamp-3">{th.summary}</p>
                </Redactable>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono-code font-semibold text-[#9a3412] border-t border-[#e1d4b9] pt-2">
                <span>
                  {th.characterIds.length} players · {th.keyTitleIds.length} titles
                </span>
                <span>Open Folder →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Path Finder Quick Slips */}
      <section className="tva-folder rounded-md p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-mono-code uppercase tracking-widest text-[#1d1610] font-bold flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-[#c2410c]" /> Connect Any Two Dots (Path Tracer)
            </h2>
            <p className="text-xs text-[#61503e] mt-0.5">
              Trace the shortest documented chain linking any legacy movie or Phase 5 stinger straight into Doomsday.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('pathfinder')}
            className="text-xs font-mono-code font-semibold text-[#9a3412] hover:underline inline-flex items-center gap-1"
          >
            Custom Path Tracer <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PATH_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onLaunchPresetPath(p.fromKey, p.toKey)}
              className="tva-sheet rounded p-3 text-left hover:border-[#b45309] transition-colors space-y-1"
            >
              <div className="text-xs font-bold text-[#1d1610]">{p.label}</div>
              <div className="text-[11px] text-[#61503e]">{p.note}</div>
            </button>
          ))}
        </div>

        {showTheories && (
          <div className="rounded border border-[#7e22ce] bg-[#7e22ce]/10 px-3 py-2 text-xs text-[#581c87] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#7e22ce] shrink-0" />
            <span>
              <strong>Theory Layer Active:</strong> Speculative threads (Tony Stark likeness, Battleworld synthesis, 616 × 10005 incursion trigger) are visible and plum-badged.
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
