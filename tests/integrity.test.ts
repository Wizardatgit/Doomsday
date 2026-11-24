import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BEGINNER_12_IDS,
  BEGINNER_PRIMER,
  CHARACTERS,
  CURATED_CONNECTIONS,
  FACTIONS,
  GLOSSARY_TERMS,
  ICONIC_PLACES,
  REALITIES,
  THREADS,
  TITLES,
  charactersById,
  entityExists,
  entityKey,
  factionsById,
  realitiesById,
  searchCatalog,
  threadsById,
  titlesById,
} from '../src/data/index.ts';
import { buildUnifiedGraph, findShortestPath, getNeighborhood } from '../src/lib/graph.ts';
import { isRedacted, parseImportedWatchlist, serializeWatchlistBackup } from '../src/lib/spoiler.ts';
import { buildWikiBatchUrl } from '../src/lib/wikiImages.ts';

function assertUniqueIds(items: { id: string }[], label: string) {
  const seen = new Set<string>();
  for (const item of items) {
    assert.ok(!seen.has(item.id), `Duplicate ${label} id: ${item.id}`);
    seen.add(item.id);
  }
}

test('zero duplicate IDs across all entity collections', () => {
  assertUniqueIds(REALITIES, 'reality');
  assertUniqueIds(FACTIONS, 'faction');
  assertUniqueIds(TITLES, 'title');
  assertUniqueIds(CHARACTERS, 'character');
  assertUniqueIds(THREADS, 'thread');
  assertUniqueIds(CURATED_CONNECTIONS, 'curated connection');
});

test('complete referential integrity across realities, factions, titles, characters, threads, and connections', () => {
  for (const r of REALITIES) {
    if (r.anchorBeingId) {
      assert.ok(charactersById.has(r.anchorBeingId), `Reality ${r.id} bad anchorBeingId ${r.anchorBeingId}`);
    }
  }

  for (const f of FACTIONS) {
    assert.ok(realitiesById.has(f.realityId), `Faction ${f.id} bad realityId ${f.realityId}`);
    if (f.leaderId) {
      assert.ok(charactersById.has(f.leaderId), `Faction ${f.id} bad leaderId ${f.leaderId}`);
    }
  }

  for (const t of TITLES) {
    assert.ok(realitiesById.has(t.realityId), `Title ${t.id} bad realityId ${t.realityId}`);
    for (const cId of t.keyCharacterIds) {
      assert.ok(charactersById.has(cId), `Title ${t.id} bad keyCharacterId ${cId}`);
    }
    for (const pc of t.postCredits ?? []) {
      if (pc.leadsToTitleId) {
        assert.ok(titlesById.has(pc.leadsToTitleId), `Title ${t.id} bad leadsToTitleId ${pc.leadsToTitleId}`);
      }
      if (pc.threadId) {
        assert.ok(threadsById.has(pc.threadId), `Title ${t.id} bad threadId ${pc.threadId}`);
      }
    }
  }

  for (const c of CHARACTERS) {
    assert.ok(factionsById.has(c.factionId), `Character ${c.id} bad factionId ${c.factionId}`);
    assert.ok(realitiesById.has(c.originRealityId), `Character ${c.id} bad originRealityId ${c.originRealityId}`);
    assert.ok(realitiesById.has(c.currentRealityId), `Character ${c.id} bad currentRealityId ${c.currentRealityId}`);
    assert.ok(titlesById.has(c.firstAppearanceTitleId), `Character ${c.id} bad firstAppearanceTitleId ${c.firstAppearanceTitleId}`);
    assert.ok(titlesById.has(c.lastSeenTitleId), `Character ${c.id} bad lastSeenTitleId ${c.lastSeenTitleId}`);
    for (const j of c.journey) {
      assert.ok(titlesById.has(j.titleId), `Character ${c.id} journey bad titleId ${j.titleId}`);
      if (j.realityShiftTo) {
        assert.ok(realitiesById.has(j.realityShiftTo), `Character ${c.id} journey bad realityShiftTo ${j.realityShiftTo}`);
      }
    }
  }

  for (const th of THREADS) {
    assert.ok(titlesById.has(th.originTitleId), `Thread ${th.id} bad originTitleId ${th.originTitleId}`);
    for (const tId of th.keyTitleIds) {
      assert.ok(titlesById.has(tId), `Thread ${th.id} bad keyTitleId ${tId}`);
    }
    for (const cId of th.characterIds) {
      assert.ok(charactersById.has(cId), `Thread ${th.id} bad characterId ${cId}`);
    }
    for (const rId of th.realityIds) {
      assert.ok(realitiesById.has(rId), `Thread ${th.id} bad realityId ${rId}`);
    }
    for (const b of th.beats) {
      assert.ok(titlesById.has(b.titleId), `Thread ${th.id} beat bad titleId ${b.titleId}`);
    }
  }

  for (const conn of CURATED_CONNECTIONS) {
    assert.ok(entityExists(conn.from), `Connection ${conn.id} bad from ${entityKey(conn.from)}`);
    assert.ok(entityExists(conn.to), `Connection ${conn.id} bad to ${entityKey(conn.to)}`);
    if (conn.titleId) {
      assert.ok(titlesById.has(conn.titleId), `Connection ${conn.id} bad titleId ${conn.titleId}`);
    }
  }
});

test('includes pre-Phase 1 marvelwatchlist.com legacy films and 2025-2026 Phase 5-6 slate', () => {
  const requiredIds = [
    'blade-1998',
    'blade-2-2002',
    'blade-trinity-2004',
    'x-men-2000',
    'x2-2003',
    'x-men-last-stand-2006',
    'x-men-first-class-2011',
    'x-men-dofp-2014',
    'logan-2017',
    'spider-man-2002',
    'amazing-spider-man-2012',
    'daredevil-2003',
    'elektra-2005',
    'fantastic-four-2005',
    'f4-silver-surfer-2007',
    'venom-2018',
    'spider-verse-2018',
    'x-men-97',
    'agent-carter-series',
    'daredevil-saga',
    'captain-america-brave-new-world',
    'thunderbolts',
    'fantastic-four-first-steps',
    'spider-man-brand-new-day',
    'vision-quest',
    'avengers-doomsday',
  ];

  for (const id of requiredIds) {
    assert.ok(titlesById.has(id), `Expected required title missing: ${id}`);
  }
});

test('graph builder respects theory toggle and pathfinder traces valid chains', () => {
  const officialGraph = buildUnifiedGraph(false);
  assert.ok(!officialGraph.nodes.has('thread:thread-theory-stark-face'));
  assert.ok(officialGraph.nodes.has('title:blade-1998'));
  assert.ok(officialGraph.nodes.has('title:avengers-doomsday'));

  const theoryGraph = buildUnifiedGraph(true);
  assert.ok(theoryGraph.nodes.has('thread:thread-theory-stark-face'));

  const bladeToDoomsday = findShortestPath(officialGraph, 'title:blade-1998', 'title:avengers-doomsday');
  assert.ok(bladeToDoomsday !== null && bladeToDoomsday.length >= 3, 'Expected multi-hop path from Blade (1998) to Doomsday');
  assert.equal(bladeToDoomsday[0].node.key, 'title:blade-1998');
  assert.equal(bladeToDoomsday[bladeToDoomsday.length - 1].node.key, 'title:avengers-doomsday');

  const xmenToDoom = findShortestPath(officialGraph, 'title:x-men-2000', 'character:doctor-doom');
  assert.ok(xmenToDoom && xmenToDoom.length >= 2, 'Expected path from X-Men (2000) to Doctor Doom');

  const sameNode = findShortestPath(officialGraph, 'character:loki', 'character:loki');
  assert.equal(sameNode?.length, 1);

  const missingNode = findShortestPath(officialGraph, 'character:loki', 'character:does-not-exist');
  assert.equal(missingNode, null);

  const hood = getNeighborhood(officialGraph, 'character:doctor-doom', 1);
  assert.ok(hood.nodeKeys.has('character:franklin-richards'));
});

test('searchCatalog respects theory visibility', () => {
  const withoutTheory = searchCatalog('Battleworld', false);
  assert.equal(withoutTheory.some((h) => h.ref.id === 'thread-theory-battleworld'), false);

  const withTheory = searchCatalog('Battleworld', true);
  assert.equal(withTheory.some((h) => h.ref.id === 'thread-theory-battleworld'), true);
});

test('all characters, realities, and iconic places have wikiPage slugs and valid references', () => {
  assert.ok(ICONIC_PLACES.length >= 10, 'Expected at least 10 iconic places');
  assertUniqueIds(ICONIC_PLACES, 'place');

  for (const r of REALITIES) {
    assert.ok(r.wikiPage && r.wikiPage.trim().length > 0, `Reality ${r.id} missing wikiPage`);
    assert.ok(r.placeName && r.placeName.trim().length > 0, `Reality ${r.id} missing placeName`);
  }

  for (const p of ICONIC_PLACES) {
    assert.ok(p.wikiPage && p.wikiPage.trim().length > 0, `Place ${p.id} missing wikiPage`);
    assert.ok(realitiesById.has(p.realityId), `Place ${p.id} bad realityId ${p.realityId}`);
    for (const tId of p.keyTitleIds) {
      assert.ok(titlesById.has(tId), `Place ${p.id} bad keyTitleId ${tId}`);
    }
    for (const cId of p.keyCharacterIds) {
      assert.ok(charactersById.has(cId), `Place ${p.id} bad keyCharacterId ${cId}`);
    }
  }

  for (const c of CHARACTERS) {
    assert.ok(c.wikiPage && c.wikiPage.trim().length > 0, `Character ${c.id} missing wikiPage`);
  }

  const url = buildWikiBatchUrl(['Doctor_Doom', 'Time_Variance_Authority']);
  assert.ok(url.includes('origin=*'), 'Wiki URL must include CORS origin=*');
  assert.ok(url.includes('pilicense=any'), 'Wiki URL must include pilicense=any');
  assert.ok(url.includes('Doctor_Doom'), 'Wiki URL must include requested slug');
});

test('spoiler shield redaction and watchlist import validation', () => {
  const watched = new Set(['iron-man', 'avengers-endgame']);
  assert.equal(isRedacted(['thunderbolts'], watched, false), false);
  assert.equal(isRedacted(['thunderbolts'], watched, true), true);
  assert.equal(isRedacted(['iron-man', 'avengers-endgame'], watched, true), false);
  assert.equal(isRedacted(['iron-man', 'thunderbolts'], watched, true), true);
  assert.equal(isRedacted([], watched, true), false);

  const validTitleIds = new Set(titlesById.keys());
  const exported = serializeWatchlistBackup(['iron-man', 'thunderbolts']);
  const imported = parseImportedWatchlist(exported, validTitleIds);
  assert.equal(imported.ok, true);
  if (imported.ok) {
    assert.deepEqual(imported.watchedIds, ['iron-man', 'thunderbolts']);
  }

  const withUnknown = parseImportedWatchlist(
    JSON.stringify({ watchedIds: ['iron-man', 'not-a-real-movie', 123] }),
    validTitleIds,
  );
  assert.equal(withUnknown.ok, true);
  if (withUnknown.ok) {
    assert.deepEqual(withUnknown.watchedIds, ['iron-man']);
  }

  const badJson = parseImportedWatchlist('{invalid json', validTitleIds);
  assert.equal(badJson.ok, false);
});

test('newcomer 12-title catch-up list, primer, and glossary are valid', () => {
  assert.equal(BEGINNER_12_IDS.length, 12);
  assert.equal(new Set(BEGINNER_12_IDS).size, 12);
  for (const id of BEGINNER_12_IDS) {
    assert.ok(titlesById.has(id), `Beginner title missing: ${id}`);
  }
  assert.equal(BEGINNER_PRIMER.length, 3);
  assert.equal(GLOSSARY_TERMS.length, 6);
  for (const p of BEGINNER_PRIMER) {
    assert.ok(p.title.trim().length > 0 && p.body.trim().length > 0);
  }
  for (const g of GLOSSARY_TERMS) {
    assert.ok(g.term.trim().length > 0 && g.meaning.trim().length > 0);
  }
});
