import { useMemo } from 'react';
import { ArrowDown, ArrowLeftRight, Sparkles } from 'lucide-react';
import { charactersById, realitiesById, titlesById } from '../data/index.ts';
import type { EntityRef } from '../data/index.ts';
import { buildUnifiedGraph, findShortestPath } from '../lib/graph.ts';
import { personTmdbQuery, titleTmdbQuery } from '../lib/tmdb.ts';
import { EntityVisual, ViewHeroBanner } from './TvaArt.tsx';
import { Redactable } from './Redactable.tsx';

const QUICK_PAIRS = [
  { label: 'X-Men (2000) → Doomsday', from: 'title:x-men-2000', to: 'title:avengers-doomsday' },
  { label: 'Blade (1998) → Gambit', from: 'title:blade-1998', to: 'character:gambit' },
  { label: 'Iron Man (2008) → Doctor Doom', from: 'title:iron-man', to: 'character:doctor-doom' },
  { label: 'The Marvels → Professor X', from: 'title:the-marvels', to: 'character:professor-x' },
  { label: 'First Avenger → Steve Rogers', from: 'title:captain-america-first-avenger', to: 'character:steve-rogers' },
];

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

      <div className="tva-folder rounded-md p-5 space-y-4">

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <div className="space-y-1">
            <label className="text-[11px] font-mono-code uppercase font-bold text-[#9a3412]">Origin Node</label>
            <select
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
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          <div className="space-y-1">
            <label className="text-[11px] font-mono-code uppercase font-bold text-[#047857]">Target Node</label>
            <select
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

        <div className="flex flex-wrap gap-2 pt-1">
          {QUICK_PAIRS.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => {
                onChangeOrigin(q.from);
                onChangeTarget(q.to);
              }}
              className="rounded border border-[#cbb895] bg-[#fffaf0] px-2.5 py-1 text-[11px] font-mono-code text-[#61503e] hover:border-[#b45309] hover:text-[#9a3412]"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {!steps ? (
        <div className="tva-folder rounded-md p-6 text-center text-sm text-[#61503e]">
          No direct narrative chain found between those two nodes with the current Theory Layer setting.
        </div>
      ) : (
        <div className="tva-folder rounded-md p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono-code font-bold text-[#9a3412] border-b border-[#cbb895] pb-2">
            <span>TRACED CHAIN ({steps.length - 1} HOP{steps.length - 1 === 1 ? '' : 'S'})</span>
            <span>Click any card to open full Dossier</span>
          </div>

          <div className="flex flex-col items-stretch max-w-2xl mx-auto py-2">
            {steps.map((step, i) => {
              const char = step.node.kind === 'character' ? charactersById.get(step.node.ref.id) : null;
              const title = step.node.kind === 'title' ? titlesById.get(step.node.ref.id) : null;
              const reality = step.node.kind === 'reality' ? realitiesById.get(step.node.ref.id) : null;

              return (
                <div key={step.node.key} className="flex flex-col items-center">
                  {step.edgeFromPrev && (
                    <div className="flex flex-col items-center py-2">
                      <div className="w-0.5 h-3 bg-[#c2410c]/50" />
                      <span
                        className={`rounded-full border px-3 py-0.5 text-[11px] font-mono-code font-semibold ${
                          step.edgeFromPrev.isTheory
                            ? 'border-[#7e22ce] bg-[#7e22ce]/10 text-[#6b21a8]'
                            : 'border-[#c2410c] bg-[#fffaf0] text-[#9a3412]'
                        }`}
                      >
                        {step.edgeFromPrev.isTheory && <Sparkles className="w-3 h-3 inline mr-1" />}
                        {step.edgeFromPrev.label}
                      </span>
                      <ArrowDown className="w-4 h-4 text-[#c2410c] mt-0.5" />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelect(step.node.ref)}
                    className="w-full text-left tva-sheet tva-comic-corner rounded-md p-3.5 hover:border-[#b45309] transition-colors flex gap-3.5 items-center"
                    style={{ borderLeft: `4px solid ${step.node.color}` }}
                  >
                    {(char || title || reality) && (
                      <EntityVisual
                        variant={char ? 'polaroid' : 'poster'}
                        code={char?.catalogCode ?? reality?.code ?? `${title?.year}`}
                        title={step.node.label}
                        subtitle={char?.alias ?? reality?.placeName ?? `${title?.year}`}
                        accentColor={step.node.color}
                        staticImagePath={reality?.imagePath}
                        preferWikiOverStatic={reality?.preferGenuineWiki}
                        wikiPage={
                          char?.wikiPage ??
                          reality?.wikiPage ??
                          title?.wikiPage
                        }
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
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="tva-ink-stamp tva-stamp-angled" style={{ borderColor: step.node.color, color: step.node.color }}>
                          {step.node.kind}
                        </span>
                        <span className="text-[10px] font-mono-code font-bold text-[#9a3412]">
                          HOP {String(i + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="text-base font-bold text-[#1d1610] truncate">{step.node.label}</div>
                      <Redactable
                        titleIds={step.node.titleIds}
                        watchedSet={watchedSet}
                        spoilerShield={spoilerShield}
                      >
                        <p className="text-xs text-[#61503e] truncate">{step.node.sublabel}</p>
                      </Redactable>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
