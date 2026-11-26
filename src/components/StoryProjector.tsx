import { useEffect, useState, type KeyboardEvent } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Film, Pause, Play } from 'lucide-react';
import {
  charactersById,
  factionsById,
  getCharacterChipLabel,
} from '../data/index.ts';
import type { EntityRef } from '../data/index.ts';
import { SectionDivider } from './TvaArt.tsx';
import { Redactable } from './Redactable.tsx';

interface StorySlide {
  id: string;
  chapter: string;
  shortLabel: string;
  stamp: string;
  accentColor: string;
  imagePath: string;
  headline: string;
  setup: string;
  twist: string;
  titleIds: string[];
  characterIds: string[];
  threadId: string;
}

export const STORY_SLIDES: StorySlide[] = [
  {
    id: 'slide-01',
    chapter: '01',
    shortLabel: 'World Tree',
    stamp: 'TVA-00 // END OF TIME',
    accentColor: '#047857',
    imagePath: './story/slide-01-loom.jpg',
    headline: 'Loki Becomes the Living Temporal Loom',
    setup:
      'After destroying the mechanical Loom at the Citadel, Loki takes his throne at the center of Yggdrasil and holds countless branching timelines alive by hand.',
    twist:
      'Every dying branch and unauthorized incursion now puts direct strain on Loki’s Multiverse Tree, making him a prime target when realities start crashing together.',
    titleIds: ['loki-s2'],
    characterIds: ['loki', 'doctor-strange'],
    threadId: 'thread-loki-world-tree',
  },
  {
    id: 'slide-02',
    chapter: '02',
    shortLabel: 'X-Men Rift',
    stamp: 'E-10005 // SPACETIME BREACH',
    accentColor: '#9a3412',
    imagePath: './story/slide-02-breach.jpg',
    headline: 'Monica Tears Open the Wall to the X-Men World',
    setup:
      'Sealing an unstable quantum jump point from the far side leaves Monica Rambeau stranded outside Earth-616 inside an alternate reality.',
    twist:
      'She wakes up in an X-Mansion med-bay attended by Beast and Binary, opening the direct fault line pulling Earth-10005’s X-Men into Earth-616’s crisis.',
    titleIds: ['the-marvels', 'deadpool-wolverine'],
    characterIds: ['monica-rambeau', 'cyclops', 'beast'],
    threadId: 'thread-monica-xmen',
  },
  {
    id: 'slide-03',
    chapter: '03',
    shortLabel: 'Earth-828',
    stamp: 'E-828 // RETRO-1960S',
    accentColor: '#1d4ed8',
    imagePath: './story/slide-03-828.jpg',
    headline: 'The Fantastic Four & Franklin Cross Into 616',
    setup:
      'On retro-futuristic Earth-828, Reed Richards and Sue Storm protect an extraordinary child whose cosmic power reshapes reality itself.',
    twist:
      'When an extradimensional crisis forces their interdimensional rocket into Earth-616 airspace above the Watchtower, young Franklin Richards draws Doctor Doom’s full attention.',
    titleIds: ['fantastic-four-first-steps'],
    characterIds: ['reed-richards', 'sue-storm', 'franklin-richards'],
    threadId: 'thread-f4-breach',
  },
  {
    id: 'slide-04',
    chapter: '04',
    shortLabel: 'Two Teams',
    stamp: 'E-616 // FRACTURED DEFENSE',
    accentColor: '#b45309',
    imagePath: './story/slide-04-teams.jpg',
    headline: 'Two Rival Avengers Lineups Share One Earth',
    setup:
      'Following the Watchtower crisis and international fallout, Earth-616 no longer has a single unified superhero chain of command.',
    twist:
      'Sam Wilson assembles an Avengers task force while Yelena Belova and Bucky Barnes operate out of the former Watchtower as the New Avengers, divided right before impact.',
    titleIds: ['captain-america-brave-new-world', 'thunderbolts'],
    characterIds: ['sam-wilson', 'yelena-belova', 'bucky-barnes'],
    threadId: 'thread-two-avengers',
  },
  {
    id: 'slide-05',
    chapter: '05',
    shortLabel: 'Doom Arrives',
    stamp: 'CONVERGENCE // DEC 18, 2026',
    accentColor: '#065f46',
    imagePath: './story/slide-05-doom.jpg',
    headline: 'Doctor Doom Enters the Multiverse Convergence',
    setup:
      'With worlds brushing past each other from stolen branches, temporal fractures, and dimensional leaps, a masked sovereign steps out of the shadows.',
    twist:
      'Bearing a hauntingly familiar face in a multiverse pushed to collapse, Victor von Doom moves on Franklin Richards and the collapsing realities as Doomsday begins.',
    titleIds: ['fantastic-four-first-steps', 'avengers-doomsday'],
    characterIds: ['doctor-doom', 'steve-rogers', 'shuri'],
    threadId: 'thread-doom-franklin',
  },
];

/** Advances the Story Projector index cleanly with modular wrap-around in either direction. */
export function stepSlideIndex(current: number, delta: number, total = STORY_SLIDES.length): number {
  return ((current + delta) % total + total) % total;
}

/** Playable 5-slide TVA Orientation Projector summarizing the road to Doomsday. */
export function StoryProjector({
  watchedSet,
  spoilerShield,
  onSelect,
}: {
  watchedSet: Set<string>;
  spoilerShield: boolean;
  onSelect: (ref: EntityRef) => void;
}) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [pausedByInteraction, setPausedByInteraction] = useState(false);

  const stepSlide = (delta: number) => {
    setSlideIdx((prev) => stepSlideIndex(prev, delta));
  };

  useEffect(() => {
    if (!autoPlay || pausedByInteraction) return;
    const timer = window.setTimeout(() => {
      setSlideIdx((prev) => stepSlideIndex(prev, 1));
    }, 6500);
    return () => window.clearTimeout(timer);
  }, [autoPlay, pausedByInteraction, slideIdx]);

  const slide = STORY_SLIDES[slideIdx];

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepSlide(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepSlide(1);
    }
  };

  return (
    <section
      id="tva-story-projector"
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setPausedByInteraction(true)}
      onMouseLeave={() => setPausedByInteraction(false)}
      onFocus={() => setPausedByInteraction(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPausedByInteraction(false);
        }
      }}
      tabIndex={0}
      aria-label="TVA Orientation Reel interactive story projector"
      className="space-y-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] rounded-md"
    >
      <SectionDivider
        badge="PROJECTOR // REEL"
        title="The Road to Doomsday in 60 Seconds"
        accentColor="#b45309"
        rightSlot={
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono-code font-bold text-[#61503e] mr-1">
              SLIDE {slide.chapter} / 0{STORY_SLIDES.length}
            </span>
            <button
              type="button"
              onClick={() => setAutoPlay((v) => !v)}
              aria-pressed={autoPlay}
              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-mono-code font-bold border transition-colors ${
                autoPlay
                  ? 'bg-[#b45309] text-white border-[#9a3412]'
                  : 'bg-[#fffaf0] text-[#61503e] border-[#cbb895] hover:border-[#b45309] hover:text-[#1d1610]'
              }`}
            >
              {autoPlay ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {autoPlay ? 'Pause' : 'Auto'}
            </button>
            <button
              type="button"
              onClick={() => stepSlide(-1)}
              aria-label="Previous story slide"
              className="rounded border border-[#cbb895] bg-[#fffaf0] p-1.5 text-[#1d1610] hover:border-[#b45309]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => stepSlide(1)}
              aria-label="Next story slide"
              className="rounded border border-[#cbb895] bg-[#fffaf0] p-1.5 text-[#1d1610] hover:border-[#b45309]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <div className="tva-folder tva-comic-corner rounded-md overflow-hidden border-l-4" style={{ borderLeftColor: slide.accentColor }}>
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Widescreen Slide Frame */}
          <div className="lg:col-span-7 relative bg-[#120d0a] aspect-[16/9] lg:aspect-auto lg:min-h-[268px] overflow-hidden border-b lg:border-b-0 lg:border-r border-[#3a2c22]">
            <img
              key={slide.id}
              src={slide.imagePath}
              alt={slide.headline}
              className="w-full h-full object-cover tva-slide-frame"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#120d0a]/85 via-transparent to-[#120d0a]/30 pointer-events-none" />
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span
                className="rounded-sm px-2 py-0.5 text-[10px] font-mono-code font-bold uppercase tracking-widest text-[#faf3e3] bg-[#16100c]/90 border border-[#cbb895]/40"
                style={{ borderLeft: `3px solid ${slide.accentColor}` }}
              >
                {slide.stamp}
              </span>
            </div>
            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[10px] font-mono-code text-[#e6d5b5]">
              <span className="inline-flex items-center gap-1.5">
                <Film className="w-3 h-3 text-amber-400" />
                BEAT {slide.chapter} OF 0{STORY_SLIDES.length} · KEY ARROWS ← / →
              </span>
              <span className="uppercase tracking-wider text-amber-300">{slide.shortLabel}</span>
            </div>
          </div>

          {/* Story Narrative & Clickable Dossiers */}
          <div className="lg:col-span-5 p-4 sm:p-5 flex flex-col justify-between gap-4 bg-[#faf4e6]">
            <div key={slide.id} className="space-y-3 tva-view-enter">
              <div className="flex items-center justify-between gap-2">
                <span className="tva-ink-stamp border-[#9a3412] bg-[#9a3412]/10 text-[#9a3412]">
                  ACT {slide.chapter} // {slide.shortLabel}
                </span>
                <span className="text-[10px] font-mono-code text-[#61503e] uppercase">
                  SPOILER SHIELD READY
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-[#1d1610] leading-snug">
                {slide.headline}
              </h3>

              <p className="text-xs sm:text-sm text-[#4a3b2c] leading-relaxed">
                {slide.setup}
              </p>

              <Redactable
                titleIds={slide.titleIds}
                watchedSet={watchedSet}
                spoilerShield={spoilerShield}
                label="Key Twist"
              >
                <p className="text-xs text-[#61503e] leading-relaxed bg-[#fffaf0] border border-[#d4c3a3] rounded p-2.5">
                  {slide.twist}
                </p>
              </Redactable>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {slide.characterIds.map((cId) => {
                  const ch = charactersById.get(cId);
                  if (!ch) return null;
                  const factionColor = factionsById.get(ch.factionId)?.color ?? slide.accentColor;
                  return (
                    <button
                      key={cId}
                      type="button"
                      onClick={() => onSelect({ kind: 'character', id: cId })}
                      className="text-[11px] font-medium px-2 py-1 rounded bg-[#fffaf0] border border-[#cbb895] text-[#1d1610] hover:border-[#b45309] inline-flex items-center gap-1.5"
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
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-dashed border-[#d4c3a3]">
              <button
                type="button"
                onClick={() => onSelect({ kind: 'thread', id: slide.threadId })}
                className="text-xs font-mono-code font-bold text-[#9a3412] hover:underline inline-flex items-center gap-1"
              >
                Open Full Case File <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => stepSlide(1)}
                className="inline-flex items-center gap-1 rounded bg-[#1d1610] px-2.5 py-1 text-[11px] font-mono-code font-bold text-[#f59e0b] hover:bg-[#32261c]"
              >
                Next Slide →
              </button>
            </div>
          </div>
        </div>

        {/* Bottom 5-Beat Filmstrip Scrubber */}
        <div
          role="group"
          aria-label="Story projector chapters"
          className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 bg-[#1b1511] border-t border-[#3a2c22]"
        >
          {STORY_SLIDES.map((s, idx) => {
            const active = idx === slideIdx;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                onClick={() => setSlideIdx(idx)}
                className={`text-left rounded px-2.5 py-1.5 border transition-colors flex items-center gap-2 ${
                  active
                    ? 'bg-[#f59e0b] text-[#18120c] border-[#f59e0b] font-bold'
                    : 'bg-[#261d17] text-[#e6d5b5] border-[#3d2e22] hover:border-[#c58f36]'
                }`}
              >
                <span className={`text-[10px] font-mono-code shrink-0 ${active ? 'text-[#18120c]' : 'text-[#f59e0b]'}`}>
                  {s.chapter}
                </span>
                <span className="text-[11px] truncate">{s.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
