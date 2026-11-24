import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Globe2, Shield, Users } from 'lucide-react';
import {
  CHARACTERS,
  FACTIONS,
  charactersById,
  realitiesById,
} from '../data/index.ts';
import type { EntityRef } from '../data/index.ts';
import { EntityVisual, FactionEmblemIcon, ViewHeroBanner } from './TvaArt.tsx';
import { Redactable } from './Redactable.tsx';

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'bg-emerald-100 text-emerald-900 border-emerald-700/30',
  likely: 'bg-amber-100 text-amber-900 border-amber-700/30',
  wildcard: 'bg-violet-100 text-violet-900 border-violet-700/30',
  legacy: 'bg-sky-100 text-sky-900 border-sky-700/30',
};

export function FactionsHub({
  watchedSet,
  spoilerShield,
  tmdbApiKey,
  initialExpandedFactionId,
  onClearInitialFaction,
  onSelect,
}: {
  watchedSet: Set<string>;
  spoilerShield: boolean;
  tmdbApiKey: string;
  initialExpandedFactionId?: string | null;
  onClearInitialFaction?: () => void;
  onSelect: (ref: EntityRef) => void;
}) {
  const [expandedFactions, setExpandedFactions] = useState<Set<string>>(() =>
    initialExpandedFactionId ? new Set([initialExpandedFactionId]) : new Set(),
  );
  const [showDetailedStatuses, setShowDetailedStatuses] = useState(false);

  useEffect(() => {
    if (!initialExpandedFactionId) return;
    setExpandedFactions((prev) => {
      const next = new Set(prev);
      next.add(initialExpandedFactionId);
      return next;
    });
    const timer = setTimeout(() => {
      document
        .getElementById(`faction-dossier-${initialExpandedFactionId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
    onClearInitialFaction?.();
    return () => clearTimeout(timer);
  }, [initialExpandedFactionId, onClearInitialFaction]);

  const membersByFaction = useMemo(() => {
    const map = new Map<string, typeof CHARACTERS>();
    for (const f of FACTIONS) map.set(f.id, []);
    for (const c of CHARACTERS) {
      const arr = map.get(c.factionId);
      if (arr) arr.push(c);
    }
    return map;
  }, []);

  const toggleFaction = (id: string) => {
    setExpandedFactions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allExpanded = expandedFactions.size === FACTIONS.length;
  const toggleAll = () => {
    if (allExpanded) {
      setExpandedFactions(new Set());
    } else {
      setExpandedFactions(new Set(FACTIONS.map((f) => f.id)));
    }
  };

  return (
    <div className="space-y-6">
      <ViewHeroBanner
        wikiPage="Thunderbolts*"
        catalogStamp="TVA FACTION ARCHIVE // COALITION CASE FILES"
        title="Faction Case Dossiers"
        subtitle={`${FACTIONS.length} active factions & multiverse coalitions converging on December 18, 2026. Expand any folder full-width to inspect operatives.`}
        accentColor="#b45309"
        emblem="thunderbolts"
      >
        <button
          type="button"
          onClick={() => setShowDetailedStatuses((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-mono-code font-semibold border transition-colors ${
            showDetailedStatuses
              ? 'bg-amber-400 text-[#1a130e] border-amber-300'
              : 'bg-[#2a2018]/90 text-[#f5e7c8] border-[#cbb895]/40 hover:border-amber-400'
          }`}
        >
          {showDetailedStatuses ? (
            <>
              <EyeOff className="w-3.5 h-3.5" /> Hide Field Statuses
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" /> Show Detailed Statuses
            </>
          )}
        </button>

        <button
          type="button"
          onClick={toggleAll}
          className="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[11px] font-mono-code font-semibold bg-[#2a2018]/90 text-[#f5e7c8] border border-[#cbb895]/40 hover:border-amber-400 transition-colors"
        >
          {allExpanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> Collapse All
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" /> Expand All ({FACTIONS.length})
            </>
          )}
        </button>
      </ViewHeroBanner>

      {/* Single-column full-width accordion stack — zero empty side gaps */}
      <div className="space-y-4">
        {FACTIONS.map((faction) => {
          const members = membersByFaction.get(faction.id) ?? [];
          const homeReality = realitiesById.get(faction.realityId);
          const leader = faction.leaderId ? charactersById.get(faction.leaderId) : undefined;
          const isExpanded = expandedFactions.has(faction.id);
          const caughtUpCount = members.filter((m) => watchedSet.has(m.lastSeenTitleId)).length;

          return (
            <section
              key={faction.id}
              id={`faction-dossier-${faction.id}`}
              className="tva-folder rounded-md overflow-hidden transition-all"
            >
              {/* Atmospheric home-world backdrop header strip */}
              <ViewHeroBanner
                compactBanner
                wikiPage={homeReality?.wikiPage}
                catalogStamp={`${faction.code} // ${homeReality?.code ?? 'MULTIVERSE'}`}
                title={faction.name}
                subtitle={
                  homeReality
                    ? `${homeReality.name} · ${homeReality.placeName}`
                    : `${faction.shortName} Multiverse Coalition`
                }
                accentColor={faction.color}
                emblem={faction.emblem}
                className="rounded-none border-0 border-b border-[#cbb895]"
              />

              {/* Summary + Accordion Controls */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleFaction(faction.id)}
                    aria-expanded={isExpanded}
                    className="flex-1 text-left flex items-start gap-3 group"
                  >
                    <span
                      className="w-10 h-10 rounded flex items-center justify-center shrink-0 border border-[#cbb895] bg-[#1e1712] mt-0.5"
                      style={{ boxShadow: `inset 0 0 0 1px ${faction.color}44` }}
                    >
                      <FactionEmblemIcon
                        emblem={faction.emblem}
                        color={faction.color}
                        className="w-5 h-5"
                      />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-code">
                        <span className="inline-flex items-center gap-1 font-bold text-[#9a3412]">
                          <Users className="w-3.5 h-3.5" /> {members.length} operatives
                        </span>
                        {watchedSet.size > 0 && (
                          <span className="text-[#61503e]">
                            · {caughtUpCount}/{members.length} caught up
                          </span>
                        )}
                        {leader && (
                          <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 bg-[#f4ebd9] border border-[#cbb895] text-[#3f3122]">
                            <Shield className="w-3 h-3 text-[#9a3412]" /> Lead: {leader.name}
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm text-[#433628] leading-relaxed ${
                          isExpanded ? '' : 'line-clamp-2'
                        }`}
                      >
                        {faction.summary}
                      </p>
                    </div>
                  </button>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleFaction(faction.id)}
                      className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-mono-code font-bold border transition-colors ${
                        isExpanded
                          ? 'bg-[#1e1712] text-amber-300 border-[#3c2d22]'
                          : 'bg-[#f4ebd9] text-[#1d1610] border-[#cbb895] hover:border-[#9a3412] hover:text-[#9a3412]'
                      }`}
                    >
                      {isExpanded ? (
                        <>
                          Collapse <ChevronUp className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Open Dossier ({members.length}) <ChevronDown className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    {homeReality && (
                      <button
                        type="button"
                        onClick={() => onSelect({ kind: 'reality', id: homeReality.id })}
                        className="inline-flex items-center gap-1 text-[11px] font-mono-code text-[#61503e] hover:text-[#9a3412] hover:underline"
                      >
                        <Globe2 className="w-3.5 h-3.5" /> {homeReality.designation}
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsed Quick Operative Chips */}
                {!isExpanded && members.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#d8c8ab]">
                    {members.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onSelect({ kind: 'character', id: m.id })}
                        className="inline-flex items-center gap-1.5 rounded-sm bg-[#fcf8ee] border border-[#cbb895] px-2 py-1 text-xs font-medium text-[#1d1610] hover:border-[#9a3412] hover:text-[#9a3412] transition-colors"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: faction.color }}
                        />
                        <span>{m.name}</span>
                        <span className="text-[10px] font-mono-code text-[#7c6953]">
                          {m.catalogCode}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Expanded Full-Width Two-Column Polaroid Roster */}
                {isExpanded && (
                  <div className="pt-3 border-t border-[#cbb895] grid grid-cols-1 md:grid-cols-2 gap-3">
                    {members.map((c) => {
                      const currentR = realitiesById.get(c.currentRealityId);
                      return (
                        <div
                          key={c.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => onSelect({ kind: 'character', id: c.id })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onSelect({ kind: 'character', id: c.id });
                            }
                          }}
                          className="tva-sheet rounded p-3 flex items-start gap-3 text-left cursor-pointer hover:border-[#9a3412] transition-colors group"
                        >
                          <EntityVisual
                            variant="polaroid"
                            compact
                            code={c.catalogCode}
                            title={c.name}
                            subtitle={c.actor}
                            accentColor={faction.color}
                            emblem={faction.emblem}
                            wikiPage={c.wikiPage}
                            tmdbQuery={
                              c.tmdbPersonId ? { kind: 'person', id: c.tmdbPersonId } : undefined
                            }
                            tmdbApiKey={tmdbApiKey}
                          />

                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <div className="min-w-0">
                                <h3 className="text-sm font-bold text-[#1d1610] group-hover:text-[#9a3412] truncate">
                                  {c.name}
                                </h3>
                                <p className="text-[11px] font-mono-code text-[#61503e] truncate">
                                  {c.alias} · {c.actor}
                                </p>
                              </div>
                              <span
                                className={`px-1.5 py-0.5 text-[10px] font-mono-code uppercase font-semibold rounded border ${
                                  STATUS_BADGE[c.doomsdayStatus] ??
                                  'bg-stone-100 text-stone-800 border-stone-300'
                                }`}
                              >
                                {c.doomsdayStatus}
                              </span>
                            </div>

                            {currentR && (
                              <div className="text-[11px] font-mono-code text-[#5a4734]">
                                Current Vector: {currentR.designation} ({currentR.name})
                              </div>
                            )}

                            <p className="text-xs text-[#433628] line-clamp-2 leading-relaxed">
                              {c.whoAreThey}
                            </p>

                            {showDetailedStatuses && (
                              <div className="pt-1">
                                <Redactable
                                  titleIds={[c.lastSeenTitleId]}
                                  watchedSet={watchedSet}
                                  spoilerShield={spoilerShield}
                                  label="status"
                                >
                                  <p className="text-xs bg-[#f3ead6] border border-[#d4c3a3] rounded px-2 py-1.5 text-[#302418]">
                                    <span className="font-mono-code text-[10px] font-bold uppercase text-[#9a3412] mr-1.5">
                                      Status:
                                    </span>
                                    {c.lastKnownStatus}
                                  </p>
                                </Redactable>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
