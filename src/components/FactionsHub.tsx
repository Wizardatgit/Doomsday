import { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, Shield } from 'lucide-react';
import { CHARACTERS, FACTIONS, realitiesById, titlesById } from '../data/index.ts';
import type { EntityRef } from '../data/index.ts';
import { EntityVisual, FactionEmblemIcon } from './TvaArt.tsx';
import { Redactable } from './Redactable.tsx';

export function FactionsHub({
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
  const [expandedFactions, setExpandedFactions] = useState<Set<string>>(() => new Set());

  const toggleFaction = (id: string) => {
    setExpandedFactions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="tva-folder rounded-md p-4">
        <h1 className="text-2xl font-bold text-[#1d1610] flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#c2410c]" /> Faction Case Dossiers
        </h1>
        <p className="text-xs text-[#61503e] mt-1">
          Scan every faction’s roster below—click any member chip for their full Dossier or expand detailed status cards inline.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {FACTIONS.map((f) => {
          const members = CHARACTERS.filter((c) => c.factionId === f.id);
          const homeR = realitiesById.get(f.realityId);
          const isOpen = expandedFactions.has(f.id);

          return (
            <section
              key={f.id}
              className="tva-folder rounded-md p-5 space-y-3.5"
              style={{ borderTop: `4px solid ${f.color}` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded p-2 bg-[#fffaf0] border border-[#cbb895]">
                    <FactionEmblemIcon emblem={f.emblem} color={f.color} className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono-code font-bold" style={{ color: f.color }}>
                        {f.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelect({ kind: 'reality', id: f.realityId })}
                        className="text-[11px] font-mono-code text-[#61503e] hover:text-[#9a3412]"
                      >
                        · {homeR?.code}
                      </button>
                    </div>
                    <h2 className="text-lg font-bold text-[#1d1610]">{f.name}</h2>
                  </div>
                </div>
                <span className="tva-ink-stamp border-[#61503e] bg-[#fffaf0] text-[#1d1610]">
                  {members.length} files
                </span>
              </div>

              <p className={`text-xs text-[#61503e] leading-relaxed ${isOpen ? '' : 'line-clamp-2'}`}>
                {f.summary}
              </p>

              {!isOpen ? (
                <div className="flex flex-wrap gap-1.5">
                  {members.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onSelect({ kind: 'character', id: c.id })}
                      className="inline-flex items-center gap-1.5 rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1 text-xs font-medium text-[#1d1610] hover:border-[#b45309] transition-colors"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          c.doomsdayStatus === 'confirmed'
                            ? 'bg-[#047857]'
                            : c.doomsdayStatus === 'likely'
                              ? 'bg-[#b45309]'
                              : 'bg-[#78716c]'
                        }`}
                      />
                      <span>{c.name}</span>
                      <span className="text-[10px] font-mono-code text-[#61503e]">({c.alias})</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {members.map((c) => {
                    const lastT = titlesById.get(c.lastSeenTitleId);
                    const originR = realitiesById.get(c.originRealityId);
                    const currR = realitiesById.get(c.currentRealityId);

                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onSelect({ kind: 'character', id: c.id })}
                        className="w-full text-left tva-sheet rounded p-3 hover:border-[#b45309] transition-colors flex gap-3 items-start"
                      >
                        <EntityVisual
                          variant="polaroid"
                          code={c.catalogCode}
                          title={c.name}
                          subtitle={c.alias}
                          accentColor={f.color}
                          emblem={f.emblem}
                          wikiPage={c.wikiPage}
                          tmdbQuery={c.tmdbPersonId ? { kind: 'person', id: c.tmdbPersonId } : undefined}
                          tmdbApiKey={tmdbApiKey}
                          compact
                        />

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-bold text-[#1d1610]">{c.name}</span>
                              <span className="text-xs text-[#9a3412] font-medium">({c.alias})</span>
                            </div>
                            <span
                              className={`tva-ink-stamp ${
                                c.doomsdayStatus === 'confirmed'
                                  ? 'border-[#047857] bg-[#047857]/10 text-[#065f46]'
                                  : c.doomsdayStatus === 'likely'
                                    ? 'border-[#b45309] bg-[#b45309]/10 text-[#92400e]'
                                    : 'border-[#61503e] bg-[#efe5d1] text-[#61503e]'
                              }`}
                            >
                              {c.doomsdayStatus}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono-code text-[#61503e]">
                            <span>{c.actor}</span>
                            <span>· {originR?.code}</span>
                            {c.currentRealityId !== c.originRealityId && (
                              <>
                                <ArrowRight className="w-3 h-3 text-[#c2410c]" />
                                <span className="text-[#9a3412] font-bold">{currR?.code}</span>
                              </>
                            )}
                            <span>· Last: {lastT?.title}</span>
                          </div>

                          <Redactable
                            titleIds={[c.lastSeenTitleId]}
                            watchedSet={watchedSet}
                            spoilerShield={spoilerShield}
                          >
                            <p className="text-xs text-[#1d1610]/85">{c.lastKnownStatus}</p>
                          </Redactable>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-[#e1d4b9] pt-2">
                <button
                  type="button"
                  onClick={() => toggleFaction(f.id)}
                  className="inline-flex items-center gap-1 text-[11px] font-mono-code font-semibold text-[#9a3412] hover:underline"
                >
                  {isOpen ? (
                    <>
                      Hide detailed statuses <ChevronUp className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      Show detailed statuses ({members.length}) <ChevronDown className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
