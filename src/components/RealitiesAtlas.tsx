import { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import {
  CHARACTERS,
  ICONIC_PLACES,
  REALITIES,
  TITLES,
  charactersById,
  getCharacterChipLabel,
  realitiesById,
  titlesById,
} from '../data/index.ts';
import type { EntityRef, Reality } from '../data/index.ts';
import { EntityVisual, SectionDivider, ViewHeroBanner } from './TvaArt.tsx';
import { Redactable } from './Redactable.tsx';

type AtlasTab = 'all' | 'places' | 'realities' | 'jumps';
type RealityStatus = Reality['status'];

export function RealitiesAtlas({
  watchedSet,
  spoilerShield,
  onSelect,
}: {
  watchedSet: Set<string>;
  spoilerShield: boolean;
  onSelect: (ref: EntityRef) => void;
}) {
  const crossUniverseHops = CHARACTERS.filter((c) => c.originRealityId !== c.currentRealityId);
  const [expandedPlaces, setExpandedPlaces] = useState<Set<string>>(() => new Set());
  const [tab, setTab] = useState<AtlasTab>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | RealityStatus>('all');

  const filteredRealities = useMemo(
    () =>
      statusFilter === 'all'
        ? REALITIES
        : REALITIES.filter((r) => r.status === statusFilter),
    [statusFilter],
  );

  const togglePlace = (id: string) => {
    setExpandedPlaces((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <ViewHeroBanner
        wikiPage="X-Mansion"
        staticImagePath="./places/xmansion-10005.jpg"
        preferWikiOverStatic
        catalogStamp="TVA MULTIVERSE CARTOGRAPHY // REALITY PLATES"
        title="Realities & Places Atlas"
        subtitle={`Surveillance photographs of ${ICONIC_PLACES.length} key landmarks and ${REALITIES.length} multiverse planes feeding into Doomsday.`}
        accentColor="#7c3aed"
        emblem="xmen"
      />

      {/* Segmented Filter Bar (WAI-ARIA toggle-button group) */}
      <div className="tva-folder rounded-md p-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 bg-[#efe3c8] p-1 rounded border border-[#cbb895]" role="group" aria-label="Atlas sections">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'places', label: `Key Places (${ICONIC_PLACES.length})` },
              { id: 'realities', label: `Realities (${REALITIES.length})` },
              { id: 'jumps', label: `Jumps (${crossUniverseHops.length})` },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`px-2.5 py-1 rounded text-xs font-mono-code font-semibold transition-colors ${
                tab === item.id
                  ? 'bg-[#1d1610] text-[#f59e0b] shadow-xs'
                  : 'text-[#61503e] hover:text-[#1d1610]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(tab === 'all' || tab === 'realities') && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | RealityStatus)}
              aria-label="Filter reality status"
              className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1.5 text-xs font-mono-code text-[#1d1610]"
            >
              <option value="all">All Statuses ({REALITIES.length})</option>
              <option value="incursion-risk">Incursion Risk</option>
              <option value="endangered">Endangered</option>
              <option value="intact">Intact</option>
              <option value="pruned">Pruned</option>
              <option value="outside-time">Outside Time</option>
            </select>
          )}
          {(tab !== 'all' || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setTab('all');
                setStatusFilter('all');
              }}
              className="inline-flex items-center gap-1 rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1.5 text-xs font-mono-code text-[#9a3412] hover:border-[#9a3412]"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Iconic Places Surveillance Gallery */}
      {(tab === 'all' || tab === 'places') && (
      <section className="space-y-3">
        <SectionDivider
          badge="SURVEILLANCE // 01"
          title={`Key Places Mentioned Across the Lore (${ICONIC_PLACES.length})`}
          accentColor="#c2410c"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
          {ICONIC_PLACES.map((place) => {
            const reality = realitiesById.get(place.realityId);
            const isOpen = expandedPlaces.has(place.id);
            return (
              <div
                key={place.id}
                onClick={() => onSelect({ kind: 'place', id: place.id })}
                className="tva-folder rounded-md p-3.5 space-y-2.5 cursor-pointer hover:border-[#b45309] transition-colors"
              >
                <EntityVisual
                  variant="plate"
                  code={reality?.code ?? 'SECTOR'}
                  title={place.name}
                  subtitle={place.name}
                  accentColor={reality?.color ?? '#c2410c'}
                  staticImagePath={place.imagePath}
                  wikiPage={place.wikiPage}
                  preferWikiOverStatic={place.preferGenuineWiki}
                />
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-[#1d1610]">{place.name}</h3>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect({ kind: 'reality', id: place.realityId });
                    }}
                    className="text-[11px] font-mono-code font-bold hover:underline shrink-0"
                    style={{ color: reality?.color }}
                  >
                    {reality?.code}
                  </button>
                </div>
                <Redactable titleIds={place.keyTitleIds} watchedSet={watchedSet} spoilerShield={spoilerShield}>
                  <p className={`text-xs text-[#61503e] leading-relaxed ${isOpen ? '' : 'line-clamp-2'}`}>
                    {place.summary}
                  </p>
                </Redactable>

                {isOpen && (
                  <div className="border-t border-[#e1d4b9] pt-2.5 space-y-1.5">
                    <div className="flex flex-wrap gap-1">
                      {place.keyCharacterIds.map((cId) => {
                        const ch = charactersById.get(cId);
                        if (!ch) return null;
                        return (
                          <button
                            key={cId}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect({ kind: 'character', id: cId });
                            }}
                            className="rounded border border-[#cbb895] bg-[#fffaf0] px-2 py-0.5 text-[11px] font-medium text-[#1d1610] hover:border-[#b45309]"
                          >
                            {getCharacterChipLabel(cId)}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono-code text-[#9a3412]">
                      {place.keyTitleIds.map((tId) => (
                        <button
                          key={tId}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect({ kind: 'title', id: tId });
                          }}
                          className="hover:underline"
                        >
                          [{titlesById.get(tId)?.title}]
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-[#e1d4b9] pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlace(place.id);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-mono-code font-semibold text-[#9a3412] hover:underline"
                  >
                    {isOpen ? (
                      <>
                        Hide linked cast &amp; titles <ChevronUp className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        {place.keyCharacterIds.length} players · {place.keyTitleIds.length} titles{' '}
                        <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect({ kind: 'place', id: place.id });
                    }}
                    className="text-[11px] font-mono-code font-semibold text-[#61503e] hover:text-[#1d1610] hover:underline"
                  >
                    Open Dossier →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      )}

      {/* Active Cross-Universe Jumps */}
      {(tab === 'all' || tab === 'jumps') && (
      <section className="tva-folder rounded-md p-4 space-y-3">
        <SectionDivider
          badge="DISPLACEMENT // 02"
          title={`Documented Cross-Universe Jumps (${crossUniverseHops.length})`}
          accentColor="#9a3412"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {crossUniverseHops.map((c) => {
            const fromR = realitiesById.get(c.originRealityId);
            const toR = realitiesById.get(c.currentRealityId);
            return (
              <div
                key={c.id}
                onClick={() => onSelect({ kind: 'character', id: c.id })}
                className="tva-sheet rounded p-3 text-left cursor-pointer hover:border-[#b45309] transition-colors space-y-1"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect({ kind: 'character', id: c.id });
                  }}
                  className="text-sm font-bold text-[#1d1610] hover:text-[#9a3412] hover:underline text-left block"
                >
                  {c.name}
                </button>
                <div className="flex items-center gap-1.5 text-xs font-mono-code font-bold">
                  <span style={{ color: fromR?.color }}>{fromR?.code}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#c2410c]" />
                  <span style={{ color: toR?.color }}>{toR?.code}</span>
                </div>
                <Redactable titleIds={[c.lastSeenTitleId]} watchedSet={watchedSet} spoilerShield={spoilerShield}>
                  <p className="text-[11px] text-[#61503e] line-clamp-1">{c.lastKnownStatus}</p>
                </Redactable>
              </div>
            );
          })}
        </div>
      </section>
      )}

      {/* 16 Realities Dossiers */}
      {(tab === 'all' || tab === 'realities') && (
      <section className="space-y-3">
        <SectionDivider
          badge="PLANES // 03"
          title={`Tracked Multiverse Realities (${filteredRealities.length}${statusFilter !== 'all' ? ` of ${REALITIES.length}` : ''})`}
          accentColor="#0369a1"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRealities.map((r) => {
            const anchor = r.anchorBeingId ? charactersById.get(r.anchorBeingId) : null;
            const titleCount = TITLES.filter((t) => t.realityId === r.id).length;
            const residentCount = CHARACTERS.filter(
              (c) => c.originRealityId === r.id || c.currentRealityId === r.id,
            ).length;

            return (
              <div
                key={r.id}
                onClick={() => onSelect({ kind: 'reality', id: r.id })}
                className="tva-folder rounded-md p-4 cursor-pointer hover:border-[#b45309] transition-colors space-y-3"
                style={{ borderLeft: `4px solid ${r.color}` }}
              >
                <EntityVisual
                  variant="plate"
                  code={r.code}
                  title={r.name}
                  subtitle={r.placeName}
                  accentColor={r.color}
                  staticImagePath={r.imagePath}
                  wikiPage={r.wikiPage}
                  preferWikiOverStatic={r.preferGenuineWiki}
                />

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-[#1d1610]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect({ kind: 'reality', id: r.id });
                        }}
                        className="text-left hover:text-[#9a3412] hover:underline"
                      >
                        {r.name}
                      </button>
                    </h3>
                    <p className="text-[11px] font-mono-code text-[#61503e]">{r.designation}</p>
                  </div>
                  <span
                    className={`tva-ink-stamp ${
                      r.status === 'incursion-risk'
                        ? 'border-[#b91c1c] bg-[#b91c1c]/10 text-[#991b1b]'
                        : r.status === 'endangered'
                          ? 'border-[#c2410c] bg-[#c2410c]/10 text-[#9a3412]'
                          : r.status === 'pruned'
                            ? 'border-[#57534e] bg-[#57534e]/10 text-[#44403c]'
                            : 'border-[#047857] bg-[#047857]/10 text-[#065f46]'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                <p className="text-xs text-[#1d1610]/85 leading-relaxed line-clamp-2">{r.summary}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e1d4b9] pt-2.5 text-[11px] font-mono-code">
                  <span className="text-[#61503e]">
                    {residentCount} {residentCount === 1 ? 'player' : 'players'} · {titleCount}{' '}
                    {titleCount === 1 ? 'title' : 'titles'}
                  </span>
                  {anchor && (
                    <span className="text-[#9a3412] font-bold">
                      Anchor: {getCharacterChipLabel(anchor.id)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      )}
    </div>
  );
}
