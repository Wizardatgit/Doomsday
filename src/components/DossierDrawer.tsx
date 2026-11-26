import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckSquare,
  ExternalLink,
  GitBranch,
  Globe2,
  MapPin,
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
  formatTitleWithYear,
  getCharacterChipLabel,
  placesById,
  realitiesById,
  threadsById,
  titlesById,
} from '../data/index.ts';
import type { EntityRef, LoreConfidence, SourceCitation } from '../data/types.ts';
import { personTmdbQuery, titleTmdbQuery } from '../lib/tmdb.ts';
import { useDialogA11y } from '../lib/useDialogA11y.ts';
import { fetchWikiImageMeta, type WikiImageMeta } from '../lib/wikiImages.ts';
import { EntityVisual, useImageLightbox } from './TvaArt.tsx';
import { Redactable } from './Redactable.tsx';

type DossierTab = 'briefing' | 'timeline' | 'connections';

function DossierTabBar({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: { id: DossierTab; label: string }[];
  activeTab: DossierTab;
  onChange: (tab: DossierTab) => void;
}) {
  return (
    <div role="tablist" aria-label="Dossier sections" className="flex flex-wrap gap-1.5 border-b-2 border-[#cbb895] pt-1">
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`px-3 py-1.5 text-xs font-mono-code font-bold rounded-t border border-b-0 -mb-[2px] transition-colors ${
              active
                ? 'bg-[#fffaf0] text-[#9a3412] border-[#cbb895] border-b-2 border-b-[#fffaf0]'
                : 'bg-[#eadbc0] text-[#61503e] border-transparent hover:text-[#1d1610]'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

const CONFIDENCE_BADGE: Record<LoreConfidence, { label: string; cls: string }> = {
  official: {
    label: 'Official / Released Record',
    cls: 'border-[#047857] bg-[#047857]/10 text-[#065f46]',
  },
  reported: {
    label: 'Trade Reported',
    cls: 'border-[#b45309] bg-[#b45309]/10 text-[#92400e]',
  },
  theory: {
    label: 'Unconfirmed Theory',
    cls: 'border-[#7e22ce] bg-[#7e22ce]/10 text-[#6b21a8]',
  },
};

function SourceCitationsBlock({
  confidence,
  sources,
  wikiPage,
  isTheory,
}: {
  confidence?: LoreConfidence;
  sources?: SourceCitation[];
  wikiPage?: string;
  isTheory?: boolean;
}) {
  const badgeKey: LoreConfidence = confidence ?? (isTheory ? 'theory' : 'official');
  const badge = CONFIDENCE_BADGE[badgeKey];
  const links: SourceCitation[] = [...(sources ?? [])];
  if (wikiPage) {
    const wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiPage).replace(/%3A/g, ':').replace(/%2F/g, '/')}`;
    if (!links.some((s) => s.url === wikiUrl || s.url.includes(wikiPage))) {
      links.push({ label: 'Wikipedia Reference', url: wikiUrl });
    }
  }

  return (
    <div className="border-t border-[#e1d4b9] pt-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-mono-code uppercase tracking-widest text-[#61503e] font-bold">
          Archival Verification &amp; Sources
        </span>
        <span className={`tva-ink-stamp ${badge.cls}`}>{badge.label}</span>
      </div>
      {links.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {links.map((src) => (
            <a
              key={src.url}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded border border-[#cbb895] bg-[#fffaf0] px-2 py-1 text-[11px] font-mono-code text-[#9a3412] hover:border-[#b45309] hover:underline"
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              {src.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/** Shows native-resolution original Marvel comics/MCU scan when Wikimedia resolution is under 600px. */
function OriginalMarvelInset({
  wikiPage,
  preferGenuineWiki,
  title,
  code,
  accentColor,
}: {
  wikiPage?: string;
  preferGenuineWiki?: boolean;
  title: string;
  code: string;
  accentColor: string;
}) {
  const { openLightbox } = useImageLightbox();
  const [meta, setMeta] = useState<WikiImageMeta | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setMeta(null);
    setFailed(false);
    if (!preferGenuineWiki || !wikiPage) return;
    let active = true;
    fetchWikiImageMeta(wikiPage).then((res) => {
      if (active && res && res.width > 0 && res.width < 600) {
        setMeta(res);
      }
    });
    return () => {
      active = false;
    };
  }, [wikiPage, preferGenuineWiki]);

  if (!meta || failed) return null;

  return (
    <div className="border-t border-[#e1d4b9] pt-3 flex items-center gap-3">
      <button
        type="button"
        onClick={() =>
          openLightbox({
            url: meta.url,
            code: `${code} · ORIGINAL SCAN`,
            title,
            subtitle: `Native Marvel Archival Reference (${meta.width}×${meta.height})`,
            accentColor,
          })
        }
        className="shrink-0 rounded-sm border border-[#cbb895] bg-[#140f0c] p-1 hover:border-[#b45309] transition-colors cursor-zoom-in"
        title="Inspect native-resolution Marvel reference"
      >
        <img
          src={meta.url}
          alt={`${title} archival reference`}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-20 max-h-24 object-contain"
        />
      </button>
      <div className="min-w-0 space-y-0.5">
        <div className="text-[10px] font-mono-code uppercase tracking-widest text-[#9a3412] font-bold">
          Original Marvel Archival Scan
        </div>
        <p className="text-xs text-[#61503e] leading-snug">
          Displayed at crisp native resolution ({meta.width}×{meta.height}px) rather than stretched across the widescreen header. Click thumbnail to inspect.
        </p>
      </div>
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState<DossierTab>('briefing');
  const drawerRef = useRef<HTMLElement>(null);
  useDialogA11y(drawerRef, Boolean(selected));

  useEffect(() => {
    setActiveTab('briefing');
  }, [selected?.kind, selected?.id]);

  if (!selected) return null;

  return (
    <div
      className="tva-backdrop-fade fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Case file dossier: ${selected.kind} ${selected.id}`}
        tabIndex={-1}
        className="tva-drawer-slide w-full max-w-xl h-full overflow-y-auto bg-[#f6ecd7] border-l-2 border-[#bfa982] shadow-2xl flex flex-col text-[#1d1610]"
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
            const visibleJourney = c.journey.filter((j) => showTheories || !j.isTheory);
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
                    tmdbQuery={personTmdbQuery(c.actor)}
                    tmdbApiKey={tmdbApiKey}
                    clickImageToZoom
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className="tva-ink-stamp text-[#1d1610]"
                        style={{
                          borderColor: faction?.color ?? '#b45309',
                          backgroundColor: `${faction?.color ?? '#b45309'}15`,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: faction?.color ?? '#b45309' }}
                          aria-hidden="true"
                        />
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

                <DossierTabBar
                  activeTab={activeTab}
                  onChange={setActiveTab}
                  tabs={[
                    { id: 'briefing', label: 'Briefing' },
                    { id: 'timeline', label: `Journey (${visibleJourney.length})` },
                    { id: 'connections', label: `Threads (${relatedThreads.length})` },
                  ]}
                />

                {activeTab === 'briefing' && (
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
                            {formatTitleWithYear(firstTitle)}
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
                            {formatTitleWithYear(lastTitle)}
                          </button>
                        )}
                      </div>
                    </div>

                    {c.otherPortrayals && c.otherPortrayals.length > 0 && (
                      <div className="border-t border-[#e1d4b9] pt-3 space-y-2">
                        <h3 className="text-[11px] font-mono-code uppercase tracking-widest text-[#61503e] font-bold">
                          Other Actors &amp; Multiverse Variants
                        </h3>
                        <div className="space-y-1.5">
                          {c.otherPortrayals.map((note, idx) => (
                            <div
                              key={`${note.actor}-${idx}`}
                              className="tva-sheet rounded p-2.5 flex flex-col gap-1.5"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span
                                    className={`tva-ink-stamp !text-[9px] ${
                                      note.kind === 'recast'
                                        ? 'border-[#b45309] bg-[#f59e0b]/15 text-[#9a3412]'
                                        : note.kind === 'variant'
                                          ? 'border-[#7e22ce] bg-[#7e22ce]/10 text-[#6b21a8]'
                                          : 'border-[#8c775c] bg-[#f4ebd4] text-[#4a3b2c]'
                                    }`}
                                  >
                                    {note.kind}
                                  </span>
                                  {note.realityCode && (
                                    <span className="text-[10px] font-mono-code font-bold text-[#61503e] bg-[#efe3c8] px-1.5 py-0.5 rounded">
                                      {note.realityCode}
                                    </span>
                                  )}
                                  <span className="text-xs font-bold text-[#1d1610]">{note.actor}</span>
                                </div>
                                {note.relatedCharacterId && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onSelect({ kind: 'character', id: note.relatedCharacterId! })
                                    }
                                    className="text-[11px] font-mono-code font-bold text-[#9a3412] hover:underline shrink-0"
                                  >
                                    Open Dossier →
                                  </button>
                                )}
                              </div>
                              <p className="text-[11px] text-[#4a3b2c] leading-relaxed">
                                {note.context}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <SourceCitationsBlock
                      confidence={c.confidence}
                      sources={c.sources}
                      wikiPage={c.wikiPage}
                      isTheory={c.isTheory}
                    />
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="space-y-2.5 border-l-2 border-[#cbb895] pl-4 ml-1.5">
                    {visibleJourney.map((j, idx) => {
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
                              {title ? formatTitleWithYear(title) : j.titleId}
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
                )}

                {activeTab === 'connections' && (
                  <div className="space-y-4">
                    {relatedThreads.length === 0 ? (
                      <p className="text-xs text-[#61503e]">No active plot threads linked directly.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {relatedThreads.map((th) => (
                          <button
                            key={th.id}
                            type="button"
                            onClick={() => onSelect({ kind: 'thread', id: th.id })}
                            className={`rounded border px-3 py-2 text-xs text-left transition-colors ${
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
                    )}
                    <div className="tva-sheet rounded p-3 text-xs space-y-1">
                      <span className="font-mono-code uppercase text-[10px] text-[#61503e] font-bold">
                        Last Known Status
                      </span>
                      <Redactable
                        titleIds={[c.lastSeenTitleId]}
                        watchedSet={watchedSet}
                        spoilerShield={spoilerShield}
                      >
                        <p className="text-[#047857] font-medium">{c.lastKnownStatus}</p>
                      </Redactable>
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
            const postCreditsCount = t.postCredits?.length ?? 0;

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
                    wikiPage={t.wikiPage}
                    tmdbQuery={titleTmdbQuery(t)}
                    tmdbApiKey={tmdbApiKey}
                    clickImageToZoom
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

                <DossierTabBar
                  activeTab={activeTab}
                  onChange={setActiveTab}
                  tabs={[
                    { id: 'briefing', label: 'Briefing' },
                    { id: 'timeline', label: `Post-Credits (${postCreditsCount})` },
                    { id: 'connections', label: `Cast & Threads (${t.keyCharacterIds.length + titleThreads.length})` },
                  ]}
                />

                {activeTab === 'briefing' && (
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

                    <SourceCitationsBlock
                      confidence={t.confidence}
                      sources={t.sources}
                      wikiPage={t.wikiPage}
                    />
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="space-y-2">
                    {postCreditsCount === 0 ? (
                      <div className="tva-sheet rounded p-4 text-xs text-[#61503e]">
                        No major multiverse/Doomsday post-credits stinger logged for this entry.
                      </div>
                    ) : (
                      t.postCredits!.map((pc, idx) => (
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
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'connections' && (
                  <div className="space-y-4">
                    {t.keyCharacterIds.length > 0 ? (
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
                                title={`${ch.alias} · ${ch.actor}`}
                                className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1 text-xs font-medium text-[#1d1610] hover:border-[#b45309]"
                              >
                                {getCharacterChipLabel(cId)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="tva-sheet rounded p-3 text-xs text-[#61503e]">
                        No Doomsday-roster cast tracked directly in this standalone or alternate-branch entry.
                      </div>
                    )}

                    {titleThreads.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#61503e] font-bold">
                          Plot Threads Touched ({titleThreads.length})
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
                  staticImagePath={r.imagePath}
                  wikiPage={r.wikiPage}
                  preferWikiOverStatic={r.preferGenuineWiki}
                  clickImageToZoom
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

                <DossierTabBar
                  activeTab={activeTab}
                  onChange={setActiveTab}
                  tabs={[
                    { id: 'briefing', label: 'Overview' },
                    { id: 'connections', label: `Players & Titles (${residents.length + rTitles.length})` },
                  ]}
                />

                {activeTab === 'briefing' && (
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

                    <OriginalMarvelInset
                      wikiPage={r.wikiPage}
                      preferGenuineWiki={r.preferGenuineWiki}
                      title={r.name}
                      code={r.code}
                      accentColor={r.color}
                    />

                    <SourceCitationsBlock
                      confidence={r.confidence}
                      sources={r.sources}
                      wikiPage={r.wikiPage}
                      isTheory={r.isTheory}
                    />
                  </div>
                )}

                {activeTab === 'connections' && (
                  <div className="space-y-4">
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
                            {formatTitleWithYear(t)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
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

                <DossierTabBar
                  activeTab={activeTab}
                  onChange={setActiveTab}
                  tabs={[
                    { id: 'briefing', label: 'Briefing' },
                    { id: 'timeline', label: `Progression (${th.beats.length})` },
                    { id: 'connections', label: `Players & Scope (${th.characterIds.length + th.keyTitleIds.length})` },
                  ]}
                />

                {activeTab === 'briefing' && (
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

                    <SourceCitationsBlock
                      confidence={th.confidence}
                      sources={th.sources}
                      isTheory={th.isTheory}
                    />
                  </div>
                )}

                {activeTab === 'timeline' && (
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
                            {t ? formatTitleWithYear(t) : b.titleId}
                          </button>
                          <Redactable titleIds={[b.titleId]} watchedSet={watchedSet} spoilerShield={spoilerShield}>
                            <p className="text-xs text-[#1d1610]/90">{b.note}</p>
                          </Redactable>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeTab === 'connections' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#61503e] font-bold">
                        Key Players ({th.characterIds.length})
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
                              title={`${c.alias} · ${c.actor}`}
                              className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1 text-xs text-[#1d1610] hover:border-[#b45309]"
                            >
                              {getCharacterChipLabel(cId)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#61503e] font-bold">
                        Related Releases ({th.keyTitleIds.length})
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {th.keyTitleIds.map((tId) => {
                          const t = titlesById.get(tId);
                          if (!t) return null;
                          return (
                            <button
                              key={tId}
                              type="button"
                              onClick={() => onSelect({ kind: 'title', id: tId })}
                              className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1 text-xs font-semibold text-[#9a3412] hover:border-[#b45309]"
                            >
                              {formatTitleWithYear(t)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {selected.kind === 'place' && (() => {
            const p = placesById.get(selected.id);
            if (!p) return <p className="text-sm text-[#61503e]">Place not found.</p>;
            const parentReality = realitiesById.get(p.realityId);
            const accent = parentReality?.color ?? '#c2410c';

            return (
              <>
                <EntityVisual
                  variant="plate"
                  code={parentReality?.code ?? 'SECTOR'}
                  title={p.name}
                  subtitle={parentReality ? `${parentReality.code} · ${parentReality.name}` : p.name}
                  accentColor={accent}
                  staticImagePath={p.imagePath}
                  wikiPage={p.wikiPage}
                  preferWikiOverStatic={p.preferGenuineWiki}
                  clickImageToZoom
                />

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <MapPin className="w-5 h-5" style={{ color: accent }} />
                    {parentReality && (
                      <button
                        type="button"
                        onClick={() => onSelect({ kind: 'reality', id: parentReality.id })}
                        className="tva-ink-stamp hover:underline"
                        style={{ borderColor: accent, color: accent }}
                      >
                        {parentReality.code} · {parentReality.name}
                      </button>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-[#1d1610]">{p.name}</h2>
                  <p className="text-xs font-mono-code text-[#61503e]">
                    {p.keyCharacterIds.length} key players · {p.keyTitleIds.length} linked releases
                  </p>
                </div>

                <DossierTabBar
                  activeTab={activeTab}
                  onChange={setActiveTab}
                  tabs={[
                    { id: 'briefing', label: 'Overview' },
                    {
                      id: 'connections',
                      label: `Players & Titles (${p.keyCharacterIds.length + p.keyTitleIds.length})`,
                    },
                  ]}
                />

                {activeTab === 'briefing' && (
                  <div className="tva-sheet rounded-md p-4 space-y-3">
                    <Redactable
                      titleIds={p.keyTitleIds}
                      watchedSet={watchedSet}
                      spoilerShield={spoilerShield}
                      label="Location Details"
                    >
                      <p className="text-sm text-[#1d1610] leading-relaxed">{p.summary}</p>
                    </Redactable>

                    {parentReality && (
                      <div className="border-t border-[#e1d4b9] pt-3">
                        <span className="text-[11px] font-mono-code uppercase text-[#9a3412] font-bold">
                          Parent Reality Plane
                        </span>
                        <button
                          type="button"
                          onClick={() => onSelect({ kind: 'reality', id: parentReality.id })}
                          className="block mt-1 text-sm font-semibold text-[#9a3412] hover:underline"
                        >
                          {parentReality.code} - {parentReality.name} →
                        </button>
                      </div>
                    )}

                    <OriginalMarvelInset
                      wikiPage={p.wikiPage}
                      preferGenuineWiki={p.preferGenuineWiki}
                      title={p.name}
                      code={parentReality?.code ?? 'SECTOR'}
                      accentColor={accent}
                    />

                    <SourceCitationsBlock
                      confidence="official"
                      wikiPage={p.preferGenuineWiki ? p.wikiPage : undefined}
                    />
                  </div>
                )}

                {activeTab === 'connections' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#61503e] font-bold">
                        Connected Players ({p.keyCharacterIds.length})
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {p.keyCharacterIds.map((cId) => {
                          const c = charactersById.get(cId);
                          if (!c) return null;
                          return (
                            <button
                              key={cId}
                              type="button"
                              onClick={() => onSelect({ kind: 'character', id: cId })}
                              title={`${c.alias} · ${c.actor}`}
                              className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1 text-xs text-[#1d1610] hover:border-[#b45309]"
                            >
                              {getCharacterChipLabel(cId)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xs font-mono-code uppercase tracking-widest text-[#61503e] font-bold">
                        Key Appearances ({p.keyTitleIds.length})
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {p.keyTitleIds.map((tId) => {
                          const t = titlesById.get(tId);
                          if (!t) return null;
                          return (
                            <button
                              key={tId}
                              type="button"
                              onClick={() => onSelect({ kind: 'title', id: tId })}
                              className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1 text-xs font-semibold text-[#9a3412] hover:border-[#b45309]"
                            >
                              {formatTitleWithYear(t)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </aside>
    </div>
  );
}
