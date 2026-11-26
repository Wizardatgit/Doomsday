import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Flame,
  Network,
  Play,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  BEGINNER_PRIMER,
  CHARACTERS,
  FACTIONS,
  GLOSSARY_TERMS,
  ICONIC_PLACES,
  REALITIES,
  THREADS,
  TITLES,
  charactersById,
  factionsById,
  getCharacterChipLabel,
  realitiesById,
  titlesById,
} from '../data/index.ts';
import type { AppView, EntityRef } from '../data/index.ts';
import { personTmdbQuery, titleTmdbQuery } from '../lib/tmdb.ts';
import { EntityVisual, FactionEmblemIcon, SectionDivider } from './TvaArt.tsx';
import { Redactable } from './Redactable.tsx';
import { StoryProjector } from './StoryProjector.tsx';

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
  welcomeExpanded,
  onToggleWelcome,
  onOpenBeginnerPath,
  onSelect,
  onNavigate,
  onOpenFaction,
  onLaunchPresetPath,
}: {
  watchedSet: Set<string>;
  spoilerShield: boolean;
  showTheories: boolean;
  tmdbApiKey: string;
  welcomeExpanded: boolean;
  onToggleWelcome: () => void;
  onOpenBeginnerPath: () => void;
  onSelect: (ref: EntityRef) => void;
  onNavigate: (view: AppView) => void;
  onOpenFaction: (factionId: string) => void;
  onLaunchPresetPath: (fromKey: string, toKey: string) => void;
}) {
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const factionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of CHARACTERS) {
      counts.set(c.factionId, (counts.get(c.factionId) ?? 0) + 1);
    }
    return counts;
  }, []);
  const essentialTitles = useMemo(() => TITLES.filter((t) => t.importance === 'essential'), []);
  const watchedEssential = useMemo(
    () => essentialTitles.filter((t) => watchedSet.has(t.id)).length,
    [essentialTitles, watchedSet],
  );
  const daysToDoomsday = useMemo(() => {
    const release = new Date('2026-12-18T00:00:00').getTime();
    return Math.max(0, Math.floor((release - Date.now()) / 86_400_000));
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
      {/* New to Marvel? Compact Bar / Expandable Briefing */}
      <section className="tva-folder rounded-md p-3.5 sm:p-4 border-l-4 border-l-[#047857]">
        {!welcomeExpanded ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs">
              <Compass className="w-4 h-4 text-[#047857] shrink-0" />
              <span className="font-bold text-[#1d1610]">New to Marvel?</span>
              <span className="text-[#61503e]">
                30-second starter guide, 12-movie catch-up path, and jargon glossary.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenBeginnerPath}
                className="inline-flex items-center gap-1 rounded bg-[#047857] px-2.5 py-1 text-xs font-mono-code font-bold text-white hover:bg-[#065f46]"
              >
                Beginner 12-Title Path <ArrowRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={onToggleWelcome}
                className="inline-flex items-center gap-1 rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1 text-xs font-mono-code font-semibold text-[#047857] hover:border-[#047857]"
              >
                30-Sec Guide &amp; Glossary <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#cbb895] pb-3">
              <div className="space-y-1">
                <span className="tva-ink-stamp border-[#047857] bg-[#047857]/10 text-[#065f46]">
                  <Compass className="w-3 h-3" /> VISITOR ORIENTATION // ZERO MARVEL KNOWLEDGE NEEDED
                </span>
                <h2 className="text-xl font-bold text-[#1d1610]">
                  New to Marvel? Start Here in 30 Seconds
                </h2>
                <p className="text-xs text-[#61503e]">
                  Never seen all 90+ titles? No problem: this short briefing explains the entire setup for <strong>Avengers: Doomsday</strong> without jargon.
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleWelcome}
                className="inline-flex items-center gap-1 rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1 text-[11px] font-mono-code text-[#61503e] hover:text-[#1d1610]"
              >
                Collapse <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {BEGINNER_PRIMER.map((card) => (
                <div key={card.step} className="tva-sheet rounded p-3.5 space-y-1.5">
                  <div className="text-[10px] font-mono-code font-bold text-[#047857]">
                    BRIEFING {card.step}
                  </div>
                  <h3 className="text-sm font-bold text-[#1d1610]">{card.title}</h3>
                  <p className="text-xs text-[#61503e] leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={onOpenBeginnerPath}
                  className="inline-flex items-center gap-1.5 rounded bg-[#047857] px-3.5 py-2 text-xs font-mono-code font-bold uppercase text-white hover:bg-[#065f46] transition-colors"
                >
                  Beginner 12-Title Catch-Up Path <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setGlossaryOpen((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded border border-[#cbb895] bg-[#fffaf0] px-3 py-2 text-xs font-mono-code font-semibold text-[#1d1610] hover:border-[#b45309]"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#c2410c]" />
                  {glossaryOpen ? 'Hide Marvel Glossary' : `Marvel Jargon Glossary (${GLOSSARY_TERMS.length} Terms)`}
                </button>
              </div>
              <span className="text-[11px] font-mono-code text-[#61503e]">
                Tip: Switch on <strong>REDACT UNWATCHED</strong> in the left console to avoid spoilers.
              </span>
            </div>

            {glossaryOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 border-t border-[#cbb895] pt-3">
                {GLOSSARY_TERMS.map((g) => (
                  <div key={g.term} className="rounded border border-[#d7c7a7] bg-[#fffdf7] p-2.5 space-y-1">
                    <div className="text-xs font-mono-code font-bold text-[#9a3412]">{g.term}</div>
                    <p className="text-[11px] text-[#61503e] leading-relaxed">{g.meaning}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Asymmetric Top Desk Spread: Left Master Manila Folder + Right Pinned Polaroid Mugshots */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div className="xl:col-span-5 tva-folder rounded-md p-5 flex flex-col gap-4">
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
              subtitle="Yggdrasil Multiverse Loom · Active Monitoring"
              accentColor="#c2410c"
              staticImagePath="./places/tva-yggdrasil.jpg"
              wikiPage="Multiverse_(Marvel_Cinematic_Universe)"
              preferWikiOverStatic
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
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById('tva-story-projector')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="inline-flex items-center gap-1.5 rounded border border-[#047857]/40 bg-[#047857]/10 px-3.5 py-2 text-xs font-mono-code font-bold uppercase text-[#065f46] hover:bg-[#047857]/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> 60-Sec Story
              </button>
            </div>
          </div>
        </div>

        {/* Right: Pinned Polaroid Evidence Mugshots + Confirmed Factions Strip */}
        <div className="xl:col-span-7 flex flex-col gap-5">
          <div className="tva-folder rounded-md p-5 flex flex-col gap-4">
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
                      tmdbQuery={personTmdbQuery(c.actor)}
                      tmdbApiKey={tmdbApiKey}
                      hideZoomTrigger
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

          <div className="tva-folder rounded-md p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#cbb895] pb-2">
              <div>
                <span className="text-[10px] font-mono-code uppercase tracking-widest text-[#9a3412] font-bold">
                  ACTIVE COALITIONS // JUMP TO DOSSIER
                </span>
                <h3 className="text-sm font-bold text-[#1d1610]">
                  Confirmed Factions ({FACTIONS.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('factions')}
                className="text-xs font-mono-code font-semibold text-[#9a3412] hover:underline inline-flex items-center gap-1"
              >
                All Dossiers <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FACTIONS.map((faction) => {
                const count = factionCounts.get(faction.id) ?? 0;
                return (
                  <button
                    key={faction.id}
                    type="button"
                    onClick={() => onOpenFaction(faction.id)}
                    className="tva-sheet rounded p-2 text-left flex items-center gap-2 hover:border-[#9a3412] hover:-translate-y-0.5 transition-all group"
                    style={{ borderTop: `3px solid ${faction.color}` }}
                  >
                    <span className="w-7 h-7 rounded flex items-center justify-center shrink-0 border border-[#cbb895]/70 bg-[#231a13]">
                      <FactionEmblemIcon
                        emblem={faction.emblem}
                        color={faction.color}
                        className="w-4 h-4"
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-[#1d1610] truncate group-hover:text-[#9a3412]">
                        {faction.shortName}
                      </div>
                      <div className="text-[10px] font-mono-code text-[#61503e]">
                        {count} {count === 1 ? 'agent' : 'agents'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Playable 5-Beat TVA Orientation Story Projector */}
      <StoryProjector watchedSet={watchedSet} spoilerShield={spoilerShield} onSelect={onSelect} />

      {/* Iconic Locations & Realities Filmstrip */}
      <section className="space-y-3">
        <SectionDivider
          badge="SECTOR // 01"
          title="Surveillance Plates: Key Places & Realities"
          accentColor="#c2410c"
          rightSlot={
            <button
              type="button"
              onClick={() => onNavigate('realities')}
              className="text-xs font-mono-code font-semibold text-[#9a3412] hover:underline inline-flex items-center gap-1"
            >
              All {ICONIC_PLACES.length} Places &amp; {REALITIES.length} Realities <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
          {featuredPlaces.map((place) => {
            const reality = realitiesById.get(place.realityId);
            return (
              <button
                key={place.id}
                type="button"
                onClick={() => onSelect({ kind: 'place', id: place.id })}
                className="relative tva-folder rounded-md p-2.5 text-left hover:border-[#b45309] hover:-translate-y-0.5 transition-all space-y-2"
              >
                <span aria-hidden="true" className="tva-tape pointer-events-none" />
                <EntityVisual
                  variant="plate"
                  code={reality?.code ?? 'PLACE'}
                  title={place.name}
                  subtitle={place.name}
                  accentColor={reality?.color ?? '#c2410c'}
                  staticImagePath={place.imagePath}
                  wikiPage={place.wikiPage}
                  preferWikiOverStatic={place.preferGenuineWiki}
                  hideZoomTrigger
                />
                <p className="text-[11px] text-[#61503e] line-clamp-1 leading-relaxed px-0.5">
                  {place.summary}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Core 6 Convergence Threads */}
      <section className="space-y-3">
        <SectionDivider
          badge="DOSSIER // 02"
          title="Start Here: 6 Core Convergence Case Files"
          accentColor="#9a3412"
          rightSlot={
            <button
              type="button"
              onClick={() => onNavigate('threads')}
              className="text-xs font-mono-code font-semibold text-[#9a3412] hover:underline inline-flex items-center gap-1"
            >
              All Case Threads ({THREADS.filter((t) => showTheories || !t.isTheory).length}){' '}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {coreThreads.map((th, idx) => {
            const leadTitle = th.keyTitleIds.map((id) => titlesById.get(id)).find(Boolean);
            const leadReality = leadTitle ? realitiesById.get(leadTitle.realityId) : undefined;
            return (
              <div
                key={th.id}
                onClick={() => onSelect({ kind: 'thread', id: th.id })}
                className="tva-folder tva-comic-corner rounded-md p-4 cursor-pointer hover:border-[#b45309] hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-3 border-l-4 border-l-[#c2410c]"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono-code font-bold text-[#61503e]">
                        FILE #{String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="tva-ink-stamp tva-stamp-angled border-[#c2410c] bg-[#c2410c]/10 text-[#9a3412]">
                        {th.category}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono-code uppercase font-bold text-[#047857]">
                      {th.status}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    {leadTitle && (
                      <div className="shrink-0">
                        <EntityVisual
                          variant="poster"
                          code={leadReality?.code ?? leadTitle.realityId}
                          title={leadTitle.title}
                          subtitle={String(leadTitle.year)}
                          accentColor={leadReality?.color ?? '#c2410c'}
                          wikiPage={leadTitle.wikiPage}
                          tmdbQuery={titleTmdbQuery(leadTitle)}
                          tmdbApiKey={tmdbApiKey}
                          compact
                          hideZoomTrigger
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="text-base font-bold text-[#1d1610] leading-snug">{th.title}</h3>
                      <Redactable titleIds={th.keyTitleIds} watchedSet={watchedSet} spoilerShield={spoilerShield}>
                        <p className="text-xs text-[#61503e] leading-relaxed line-clamp-2">{th.summary}</p>
                      </Redactable>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {th.characterIds.slice(0, 3).map((cId) => {
                      const ch = charactersById.get(cId);
                      if (!ch) return null;
                      const factionColor = factionsById.get(ch.factionId)?.color ?? '#c2410c';
                      return (
                        <button
                          key={cId}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect({ kind: 'character', id: cId });
                          }}
                          className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#f4ebd4] border border-[#d4c3a3] text-[#1d1610] hover:border-[#b45309] inline-flex items-center gap-1"
                        >
                          <span
                            aria-hidden="true"
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: factionColor }}
                          />
                          {getCharacterChipLabel(cId)}
                        </button>
                      );
                    })}
                    {th.characterIds.length > 3 && (
                      <span className="text-[10px] font-mono-code text-[#61503e] px-1.5 py-0.5">
                        +{th.characterIds.length - 3}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono-code font-semibold text-[#9a3412] border-t border-dashed border-[#d4c3a3] pt-2">
                  <span>
                    {th.characterIds.length} {th.characterIds.length === 1 ? 'player' : 'players'} ·{' '}
                    {th.keyTitleIds.length} {th.keyTitleIds.length === 1 ? 'title' : 'titles'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect({ kind: 'thread', id: th.id });
                    }}
                    aria-label={`Open dossier for ${th.title}`}
                    className="py-1 hover:underline"
                  >
                    Open Folder →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Path Finder Quick Slips */}
      <section className="tva-folder tva-comic-corner rounded-md p-5 space-y-3 border-l-4 border-l-[#d97706]">
        <SectionDivider
          badge="VECTOR // 03"
          title="Connect Any Two Dots (Path Tracer)"
          accentColor="#d97706"
          rightSlot={
            <button
              type="button"
              onClick={() => onNavigate('pathfinder')}
              className="text-xs font-mono-code font-semibold text-[#9a3412] hover:underline inline-flex items-center gap-1"
            >
              Custom Path Tracer <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        />
        <p className="text-xs text-[#61503e]">
          Trace the shortest documented chain linking any legacy movie or Phase 5 stinger straight into Doomsday.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PATH_PRESETS.map((p, idx) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onLaunchPresetPath(p.fromKey, p.toKey)}
              className="tva-sheet rounded p-3 text-left hover:border-[#b45309] hover:-translate-y-0.5 transition-all space-y-1.5 border-t-2 border-t-[#c2410c]"
            >
              <div className="flex items-center justify-between text-[9px] font-mono-code uppercase text-[#9a3412] font-bold">
                <span>ROUTE 0{idx + 1}</span>
                <span>TRACE →</span>
              </div>
              <div className="text-xs font-bold text-[#1d1610]">{p.label}</div>
              <div className="text-[11px] text-[#61503e] border-t border-dashed border-[#dfd2b8] pt-1.5">{p.note}</div>
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
