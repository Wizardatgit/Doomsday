import type {
  AppView,
  Character,
  CuratedConnection,
  EntityKind,
  EntityRef,
  Faction,
  Place,
  PlotThread,
  Reality,
  Title,
} from './types.ts';
import { ICONIC_PLACES, REALITIES } from './realities.ts';
import { BEGINNER_12_IDS, BEGINNER_PRIMER, GLOSSARY_TERMS } from './beginner.ts';
import { FACTIONS } from './factions.ts';
import { LEGACY_TITLES } from './titles-legacy.ts';
import { INFINITY_TITLES } from './titles-infinity.ts';
import { MULTIVERSE_TITLES } from './titles-multiverse.ts';
import { CHARACTERS } from './characters.ts';
import { THREADS } from './threads.ts';
import { CURATED_CONNECTIONS } from './connections.ts';

export const TITLES: Title[] = [
  ...LEGACY_TITLES,
  ...INFINITY_TITLES,
  ...MULTIVERSE_TITLES,
];

export {
  REALITIES,
  ICONIC_PLACES,
  FACTIONS,
  LEGACY_TITLES,
  INFINITY_TITLES,
  MULTIVERSE_TITLES,
  CHARACTERS,
  THREADS,
  CURATED_CONNECTIONS,
  BEGINNER_12_IDS,
  BEGINNER_PRIMER,
  GLOSSARY_TERMS,
};

export const realitiesById = new Map<string, Reality>(REALITIES.map((r) => [r.id, r]));
export const placesById = new Map<string, Place>(ICONIC_PLACES.map((p) => [p.id, p]));
export const factionsById = new Map<string, Faction>(FACTIONS.map((f) => [f.id, f]));
export const titlesById = new Map<string, Title>(TITLES.map((t) => [t.id, t]));
export const charactersById = new Map<string, Character>(CHARACTERS.map((c) => [c.id, c]));
export const threadsById = new Map<string, PlotThread>(THREADS.map((t) => [t.id, t]));

const characterNameCounts = new Map<string, number>();
for (const c of CHARACTERS) {
  characterNameCounts.set(c.name, (characterNameCounts.get(c.name) ?? 0) + 1);
}

/** Returns a compact character chip label, appending the reality code when multiple variants share a name. */
export function getCharacterChipLabel(characterId: string): string {
  const c = charactersById.get(characterId);
  if (!c) return characterId;
  if ((characterNameCounts.get(c.name) ?? 0) <= 1) return c.name;
  const code = realitiesById.get(c.originRealityId)?.code;
  return code ? `${c.name} · ${code}` : `${c.name} (${c.actor})`;
}

export function entityKey(ref: EntityRef): string {
  return `${ref.kind}:${ref.id}`;
}

export function parseEntityKey(key: string): EntityRef | null {
  const idx = key.indexOf(':');
  if (idx <= 0) return null;
  const kind = key.slice(0, idx) as EntityKind;
  const id = key.slice(idx + 1);
  if (
    kind !== 'character' &&
    kind !== 'title' &&
    kind !== 'reality' &&
    kind !== 'thread' &&
    kind !== 'place'
  ) {
    return null;
  }
  return { kind, id };
}

export function getEntityLabel(ref: EntityRef): string {
  switch (ref.kind) {
    case 'character': {
      const c = charactersById.get(ref.id);
      return c ? (c.alias && c.alias !== c.name ? `${c.name} (${c.alias})` : c.name) : ref.id;
    }
    case 'title':
      return titlesById.get(ref.id)?.title ?? ref.id;
    case 'reality':
      return realitiesById.get(ref.id)?.name ?? ref.id;
    case 'place':
      return placesById.get(ref.id)?.name ?? ref.id;
    case 'thread':
      return threadsById.get(ref.id)?.title ?? ref.id;
  }
}

export function entityExists(ref: EntityRef): boolean {
  switch (ref.kind) {
    case 'character':
      return charactersById.has(ref.id);
    case 'title':
      return titlesById.has(ref.id);
    case 'reality':
      return realitiesById.has(ref.id);
    case 'place':
      return placesById.has(ref.id);
    case 'thread':
      return threadsById.has(ref.id);
  }
}

export interface SearchHit {
  ref: EntityRef;
  label: string;
  sublabel: string;
  isTheory?: boolean;
}

export function searchCatalog(query: string, showTheories: boolean, limit = 16): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];

  for (const c of CHARACTERS) {
    if (!showTheories && c.isTheory) continue;
    const hay = `${c.name} ${c.alias} ${c.actor} ${c.tags.join(' ')} ${c.catalogCode}`.toLowerCase();
    if (hay.includes(q)) {
      hits.push({
        ref: { kind: 'character', id: c.id },
        label: c.alias && c.alias !== c.name ? `${c.name} · ${c.alias}` : c.name,
        sublabel: `Character · ${c.actor} · ${realitiesById.get(c.currentRealityId)?.code ?? c.currentRealityId}`,
        isTheory: c.isTheory,
      });
    }
  }

  for (const t of TITLES) {
    const hay = `${t.title} ${t.eraLabel} ${t.year} ${t.kind}`.toLowerCase();
    if (hay.includes(q)) {
      hits.push({
        ref: { kind: 'title', id: t.id },
        label: `${t.title} (${t.year})`,
        sublabel: `${t.eraLabel} · ${realitiesById.get(t.realityId)?.code ?? t.realityId}`,
      });
    }
  }

  for (const th of THREADS) {
    if (!showTheories && th.isTheory) continue;
    const hay = `${th.title} ${th.category} ${th.summary}`.toLowerCase();
    if (hay.includes(q)) {
      hits.push({
        ref: { kind: 'thread', id: th.id },
        label: th.title,
        sublabel: `Thread · ${th.category.toUpperCase()}`,
        isTheory: th.isTheory,
      });
    }
  }

  for (const r of REALITIES) {
    if (!showTheories && r.isTheory) continue;
    const hay = `${r.name} ${r.code} ${r.designation}`.toLowerCase();
    if (hay.includes(q)) {
      hits.push({
        ref: { kind: 'reality', id: r.id },
        label: r.name,
        sublabel: `Reality · ${r.code}`,
        isTheory: r.isTheory,
      });
    }
  }

  for (const p of ICONIC_PLACES) {
    const parentR = realitiesById.get(p.realityId);
    const hay = `${p.name} ${p.summary} ${parentR?.code ?? ''} ${parentR?.name ?? ''}`.toLowerCase();
    if (hay.includes(q)) {
      hits.push({
        ref: { kind: 'place', id: p.id },
        label: p.name,
        sublabel: `Place · ${parentR?.code ?? p.realityId}`,
      });
    }
  }

  return hits.slice(0, limit);
}

export type {
  AppView,
  Character,
  CuratedConnection,
  EntityKind,
  EntityRef,
  Faction,
  Place,
  PlotThread,
  Reality,
  Title,
};
