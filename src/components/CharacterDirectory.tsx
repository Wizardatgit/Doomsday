import { useMemo, useState } from 'react';
import { ArrowRight, RotateCcw, Search } from 'lucide-react';
import {
  CHARACTERS,
  FACTIONS,
  REALITIES,
  factionsById,
  realitiesById,
  titlesById,
} from '../data/index.ts';
import type { DoomsdayStatus, EntityRef } from '../data/types.ts';
import { personTmdbQuery } from '../lib/tmdb.ts';
import { EntityVisual, ViewHeroBanner } from './TvaArt.tsx';
import { Redactable } from './Redactable.tsx';

export function CharacterDirectory({
  watchedSet,
  spoilerShield,
  tmdbApiKey,
  onSelect,
}: {
  watchedSet: Set<string>;
  spoilerShield: boolean;
  tmdbApiKey: string;
  onSelect: (ref: EntityRef) => void;
}) {
  const [query, setQuery] = useState('');
  const [factionFilter, setFactionFilter] = useState('all');
  const [realityFilter, setRealityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | DoomsdayStatus>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CHARACTERS.filter((c) => {
      if (factionFilter !== 'all' && c.factionId !== factionFilter) return false;
      if (realityFilter !== 'all' && c.currentRealityId !== realityFilter && c.originRealityId !== realityFilter) {
        return false;
      }
      if (statusFilter !== 'all' && c.doomsdayStatus !== statusFilter) return false;
      if (!q) return true;
      return `${c.name} ${c.alias} ${c.actor} ${c.whoAreThey} ${c.tags.join(' ')}`.toLowerCase().includes(q);
    });
  }, [query, factionFilter, realityFilter, statusFilter]);

  return (
    <div className="space-y-5">
      <ViewHeroBanner
        staticImagePath="./places/watchtower-616.jpg"
        posterInsetWikiPage="The_Avengers_(2012_film)"
        catalogStamp="TVA PERSONNEL ARCHIVE // SUBJECT ROSTER"
        title={`Personnel Mugshots & Dossiers (${filtered.length})`}
        subtitle="Every player’s archival Polaroid, origin reality, and step-by-step path into Avengers: Doomsday."
        accentColor="#1d4ed8"
        emblem="avengers"
      />

      <div className="tva-folder rounded-md p-4">
        <div className="flex flex-wrap gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-[#61503e] absolute left-3 top-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by character, alias, or actor..."
              className="w-full rounded border border-[#cbb895] bg-[#fffaf0] pl-9 pr-3 py-1.5 text-xs text-[#1d1610] focus:border-[#b45309] focus:outline-none"
            />
          </div>

          <select
            value={factionFilter}
            onChange={(e) => setFactionFilter(e.target.value)}
            className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1.5 text-xs font-mono-code text-[#1d1610]"
          >
            <option value="all">All Factions</option>
            {FACTIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.shortName}
              </option>
            ))}
          </select>

          <select
            value={realityFilter}
            onChange={(e) => setRealityFilter(e.target.value)}
            className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1.5 text-xs font-mono-code text-[#1d1610]"
          >
            <option value="all">All Realities</option>
            {REALITIES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code} — {r.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | DoomsdayStatus)}
            className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1.5 text-xs font-mono-code text-[#1d1610]"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed Cast</option>
            <option value="likely">Likely / Bridge</option>
            <option value="wildcard">Wildcard</option>
            <option value="legacy">Legacy / Anchor</option>
          </select>

          {(query !== '' ||
            factionFilter !== 'all' ||
            realityFilter !== 'all' ||
            statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFactionFilter('all');
                setRealityFilter('all');
                setStatusFilter('all');
              }}
              className="inline-flex items-center gap-1 rounded border border-[#b45309] bg-[#b45309]/10 px-2.5 py-1.5 text-xs font-mono-code font-semibold text-[#9a3412] hover:bg-[#b45309]/20"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const faction = factionsById.get(c.factionId);
          const originR = realitiesById.get(c.originRealityId);
          const currentR = realitiesById.get(c.currentRealityId);
          const lastTitle = titlesById.get(c.lastSeenTitleId);

          return (
            <div
              key={c.id}
              onClick={() => onSelect({ kind: 'character', id: c.id })}
              className="tva-folder tva-comic-corner rounded-md p-3.5 cursor-pointer hover:border-[#b45309] transition-colors flex gap-3.5 items-start border-t-[3px]"
              style={{ borderTopColor: faction?.color ?? '#c2410c' }}
            >
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
                compact
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span
                    className="tva-ink-stamp tva-stamp-angled"
                    style={{
                      borderColor: faction?.color ?? '#b45309',
                      color: faction?.color ?? '#b45309',
                    }}
                  >
                    {faction?.shortName}
                  </span>
                  <span className="text-[10px] font-mono-code uppercase font-semibold text-[#61503e]">
                    {c.doomsdayStatus}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1d1610] truncate">{c.name}</h3>
                  <p className="text-xs text-[#9a3412] font-medium truncate">
                    {c.alias} · <span className="text-[#61503e]">{c.actor}</span>
                  </p>
                </div>

                <div className="pt-1 border-t border-[#e1d4b9] space-y-1 text-[11px] font-mono-code">
                  <div className="flex items-center gap-1 text-[#61503e] flex-wrap">
                    <span>{originR?.code}</span>
                    {c.currentRealityId !== c.originRealityId && (
                      <>
                        <ArrowRight className="w-3 h-3 text-[#c2410c]" />
                        <span className="text-[#9a3412] font-bold">{currentR?.code}</span>
                      </>
                    )}
                    <span>· {lastTitle?.title}</span>
                  </div>
                  <Redactable titleIds={[c.lastSeenTitleId]} watchedSet={watchedSet} spoilerShield={spoilerShield}>
                    <p className="text-[11px] font-sans font-medium text-[#047857] truncate">
                      {c.lastKnownStatus}
                    </p>
                  </Redactable>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
