import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

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
  getCharacterChipLabel,
  getEntityLabel,
  parseEntityKey,
  placesById,
  realitiesById,
  searchCatalog,
  threadsById,
  titlesById,
} from '../src/data/index.ts';
import { buildUnifiedGraph, findShortestPath, getNeighborhood } from '../src/lib/graph.ts';
import {
  CORE_HUB_KEYS,
  CRT_ZOOM_MAX,
  CRT_ZOOM_MIN,
  GRAPH_BOUNDS,
  collapseBranchMap,
  computeExploreTreeLayout,
  computeFitCamera,
  nextWheelZoom,
  pickNextNeighbors,
  shortenGraphLabel,
} from '../src/lib/graphTree.ts';
import { isRedacted, parseImportedWatchlist, serializeWatchlistBackup } from '../src/lib/spoiler.ts';
import { buildTmdbSearchUrl, titleTmdbQuery } from '../src/lib/tmdb.ts';
import { buildWikiBatchUrl, fetchWikiThumbnail } from '../src/lib/wikiImages.ts';

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

test('explore-as-you-go tree hubs, label shortening, separation bounds, and collapse work', () => {
  const graph = buildUnifiedGraph(false);
  assert.equal(CORE_HUB_KEYS.length, 6);
  for (const key of CORE_HUB_KEYS) {
    assert.ok(graph.nodes.has(key), `Core hub missing from graph: ${key}`);
  }

  assert.equal(shortenGraphLabel('Sam Wilson (Captain America)'), 'Sam Wilson');
  const truncated = shortenGraphLabel('X-Men / Revised Fox Universe (Earth-10005)', 19);
  assert.ok(truncated.length <= 19);
  assert.ok(!truncated.includes('('));

  const exclude = new Set<string>(CORE_HUB_KEYS);
  const { nextKeys } = pickNextNeighbors(graph, 'reality:earth-828', exclude, 6);
  assert.ok(nextKeys.length >= 1 && nextKeys.length <= 6);

  const expanded = new Map<string, string[]>([['reality:earth-828', nextKeys]]);
  const positions = computeExploreTreeLayout(CORE_HUB_KEYS, expanded, graph);
  assert.equal(positions.length, CORE_HUB_KEYS.length + nextKeys.length);

  for (const p of positions) {
    assert.ok(p.x >= GRAPH_BOUNDS.minX && p.x <= GRAPH_BOUNDS.maxX, `x out of bounds: ${p.x}`);
    assert.ok(p.y >= GRAPH_BOUNDS.minY && p.y <= GRAPH_BOUNDS.maxY, `y out of bounds: ${p.y}`);
  }

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i]!;
      const b = positions[j]!;
      const clearX = Math.abs(a.x - b.x) >= GRAPH_BOUNDS.sepX - 1;
      const clearY = Math.abs(a.y - b.y) >= GRAPH_BOUNDS.sepY - 1;
      assert.ok(
        clearX || clearY,
        `Overlap between ${a.node.key} (${a.x.toFixed(1)},${a.y.toFixed(1)}) and ${b.node.key} (${b.x.toFixed(1)},${b.y.toFixed(1)})`,
      );
    }
  }

  const collapsed = collapseBranchMap(CORE_HUB_KEYS, expanded, 'reality:earth-828', graph);
  assert.equal(collapsed.size, 0);

  // Multi-branch expansion stress check: 3 core hubs expanded simultaneously with zero label overlap
  let multiVisible = new Set<string>(CORE_HUB_KEYS);
  const multiExpanded = new Map<string, string[]>();
  for (const hubKey of ['reality:earth-616', 'reality:earth-828', 'title:avengers-doomsday']) {
    const { nextKeys: hubKids } = pickNextNeighbors(graph, hubKey, multiVisible, 6);
    multiExpanded.set(hubKey, hubKids);
    for (const k of hubKids) multiVisible.add(k);
  }
  const multiPositions = computeExploreTreeLayout(CORE_HUB_KEYS, multiExpanded, graph);
  assert.ok(multiPositions.length >= 20, `Expected >= 20 multi-branch nodes, got ${multiPositions.length}`);
  for (let i = 0; i < multiPositions.length; i++) {
    for (let j = i + 1; j < multiPositions.length; j++) {
      const a = multiPositions[i]!;
      const b = multiPositions[j]!;
      const clearX = Math.abs(a.x - b.x) >= GRAPH_BOUNDS.sepX - 1;
      const clearY = Math.abs(a.y - b.y) >= GRAPH_BOUNDS.sepY - 1;
      assert.ok(
        clearX || clearY,
        `Multi-branch overlap between ${a.node.key} (${a.x.toFixed(1)},${a.y.toFixed(1)}) and ${b.node.key} (${b.x.toFixed(1)},${b.y.toFixed(1)})`,
      );
    }
  }
});

test('all titles carry wikiPage slugs, local custom place & comic art exists, TMDB uses search endpoints, and 2025-2026 entries carry citations', () => {
  for (const t of TITLES) {
    assert.ok(t.wikiPage && t.wikiPage.trim().length > 0, `Title ${t.id} missing wikiPage`);
  }

  const realityImagePaths = new Set<string>();
  for (const r of REALITIES) {
    assert.ok(r.imagePath && r.imagePath.startsWith('./places/'), `Reality ${r.id} missing local imagePath`);
    assert.equal(realityImagePaths.has(r.imagePath), false, `Duplicate reality imagePath on ${r.id}: ${r.imagePath}`);
    realityImagePaths.add(r.imagePath);
    if (r.preferGenuineWiki) {
      assert.ok(r.wikiPage && r.wikiPage.trim().length > 0, `Reality ${r.id} preferGenuineWiki missing wikiPage`);
    }
    const diskPath = path.join(process.cwd(), 'public', r.imagePath.replace(/^\.\//, ''));
    assert.ok(fs.existsSync(diskPath), `Missing generated place asset for reality ${r.id}: ${diskPath}`);
  }

  for (const p of ICONIC_PLACES) {
    assert.ok(p.imagePath && p.imagePath.startsWith('./places/'), `Place ${p.id} missing local imagePath`);
    if (p.preferGenuineWiki) {
      assert.ok(p.wikiPage && p.wikiPage.trim().length > 0, `Place ${p.id} preferGenuineWiki missing wikiPage`);
    }
    const diskPath = path.join(process.cwd(), 'public', p.imagePath.replace(/^\.\//, ''));
    assert.ok(fs.existsSync(diskPath), `Missing generated place asset for place ${p.id}: ${diskPath}`);
  }

  for (const comicFile of ['comic-portal.jpg', 'comic-citadel.jpg', 'comic-clockwork.jpg', 'comic-starburst.jpg']) {
    const diskPath = path.join(process.cwd(), 'public', 'comic', comicFile);
    assert.ok(fs.existsSync(diskPath), `Missing comic vignette asset: ${diskPath}`);
  }

  for (const slideFile of [
    'slide-01-loom.jpg',
    'slide-02-breach.jpg',
    'slide-03-828.jpg',
    'slide-04-teams.jpg',
    'slide-05-doom.jpg',
  ]) {
    const diskPath = path.join(process.cwd(), 'public', 'story', slideFile);
    assert.ok(fs.existsSync(diskPath), `Missing story projector asset: ${diskPath}`);
  }

  const movieSearch = buildTmdbSearchUrl(
    { kind: 'title', mediaType: 'movie', title: 'Avengers: Doomsday', year: 2026 },
    'test-key',
  );
  assert.ok(movieSearch.includes('/3/search/movie?'));
  assert.ok(movieSearch.includes('primary_release_year=2026'));

  const tvSearch = buildTmdbSearchUrl(
    { kind: 'title', mediaType: 'tv', title: 'VisionQuest', year: 2026 },
    'test-key',
  );
  assert.ok(tvSearch.includes('/3/search/tv?'));
  assert.ok(tvSearch.includes('first_air_date_year=2026'));

  const personSearch = buildTmdbSearchUrl(
    { kind: 'person', name: 'Robert Downey Jr.' },
    'test-key',
  );
  assert.ok(personSearch.includes('/3/search/person?'));

  for (const titleId of ['avengers-doomsday', 'spider-man-brand-new-day', 'vision-quest', 'punisher-one-last-kill']) {
    const t = titlesById.get(titleId);
    assert.ok(t?.sources && t.sources.length > 0, `2026 title ${titleId} missing sources`);
    for (const s of t.sources) {
      assert.ok(s.url.startsWith('https://'), `Source URL must use https: ${s.url}`);
    }
  }

  for (const charId of ['doctor-doom', 'steve-rogers', 'jean-grey-616', 'white-vision']) {
    const c = charactersById.get(charId);
    assert.ok(c?.sources && c.sources.length > 0, `2026 character ${charId} missing sources`);
  }
});

test('place dossiers resolve uniquely via placesById & searchCatalog, and titleTmdbQuery handles animated TV & parentheticals', () => {
  const wakandaRef = parseEntityKey('place:place-wakanda');
  assert.deepEqual(wakandaRef, { kind: 'place', id: 'place-wakanda' });
  assert.equal(entityExists(wakandaRef!), true);
  assert.equal(placesById.get('place-wakanda')?.realityId, 'earth-616');
  assert.ok(getEntityLabel(wakandaRef!).includes('Wakanda'));

  const hits = searchCatalog('Wakanda', false);
  assert.ok(
    hits.some((h) => h.ref.kind === 'place' && h.ref.id === 'place-wakanda'),
    'Expected Wakanda place in searchCatalog',
  );

  const xmen97 = titlesById.get('x-men-97')!;
  const q97 = titleTmdbQuery(xmen97);
  assert.equal(q97.kind, 'title');
  if (q97.kind === 'title') {
    assert.equal(q97.mediaType, 'tv');
    assert.equal(q97.title, "X-Men '97");
  }

  const spiderVerse = titlesById.get('spider-verse-2018')!;
  const qSv = titleTmdbQuery(spiderVerse);
  if (qSv.kind === 'title') {
    assert.equal(qSv.mediaType, 'movie');
  }

  const ddSaga = titlesById.get('daredevil-saga')!;
  const qDd = titleTmdbQuery(ddSaga);
  if (qDd.kind === 'title') {
    assert.equal(qDd.mediaType, 'tv');
    assert.equal(qDd.title, 'Daredevil');
  }

  const wikiBatchUrl = buildWikiBatchUrl(['Stark_Tower']);
  assert.ok(wikiBatchUrl.includes('pilicense=any'));
  assert.ok(wikiBatchUrl.includes('piprop=thumbnail'));
  assert.equal(typeof fetchWikiThumbnail, 'function');
});

test('CRT camera helpers clamp wheel zoom and fit off-center clusters', () => {
  assert.equal(nextWheelZoom(1, 0), 1);
  assert.ok(nextWheelZoom(1, -120) > 1);
  assert.ok(nextWheelZoom(1, 120) < 1);
  assert.equal(nextWheelZoom(CRT_ZOOM_MAX, -500), CRT_ZOOM_MAX);
  assert.equal(nextWheelZoom(CRT_ZOOM_MIN, 500), CRT_ZOOM_MIN);

  assert.deepEqual(computeFitCamera([]), { zoom: 1, pan: { x: 0, y: 0 } });

  const pts = [
    { x: 200, y: 150 },
    { x: 400, y: 250 },
  ];
  const fit = computeFitCamera(pts);
  assert.ok(fit.zoom >= CRT_ZOOM_MIN && fit.zoom <= 1.35);
  const midX = 300;
  const midY = 206;
  const projectedX = 700 + fit.pan.x + (midX - 700) * fit.zoom;
  const projectedY = 440 + fit.pan.y + (midY - 440) * fit.zoom;
  assert.ok(Math.abs(projectedX - 700) <= 1.5, `Expected centered X, got ${projectedX}`);
  assert.ok(Math.abs(projectedY - 440) <= 1.5, `Expected centered Y, got ${projectedY}`);
});

test('prevents cross-universe & non-appearance character mismatches and disambiguates variant chips', () => {
  const miles = charactersById.get('miles-morales');
  assert.ok(miles, 'Expected Miles Morales dossier');
  assert.equal(miles.originRealityId, 'earth-1610b');

  for (const id of ['spider-verse-2018', 'across-spider-verse-2023']) {
    const title = titlesById.get(id)!;
    assert.deepEqual(title.keyCharacterIds, ['miles-morales']);
    assert.equal(title.keyCharacterIds.includes('peter-parker-616'), false);
  }

  const forbiddenOrigins = new Set(['earth-616', 'earth-10005', 'the-void', 'earth-828']);
  for (const altId of [
    'spider-verse-2018',
    'across-spider-verse-2023',
    'x-men-97',
    'what-if-series',
    'friendly-neighborhood-spider-man',
    'marvel-zombies',
  ]) {
    const t = titlesById.get(altId)!;
    for (const cId of t.keyCharacterIds) {
      const ch = charactersById.get(cId)!;
      assert.equal(
        forbiddenOrigins.has(ch.originRealityId),
        false,
        `Alternate-universe title ${altId} must not link ${ch.originRealityId} character ${cId}`,
      );
    }
  }

  const forbiddenPairs: [string, string[]][] = [
    ['guardians-of-the-galaxy', ['thor']],
    ['jessica-jones-saga', ['daredevil']],
    ['luke-cage-saga', ['daredevil']],
    ['iron-fist-saga', ['daredevil']],
    ['secret-invasion', ['monica-rambeau']],
    ['eyes-of-wakanda', ['shuri', 'mbaku']],
    ['x-men-origins-2009', ['gambit']],
    ['doctor-strange-mom', ['professor-x']],
  ];
  for (const [titleId, disallowed] of forbiddenPairs) {
    const t = titlesById.get(titleId)!;
    for (const cId of disallowed) {
      assert.equal(t.keyCharacterIds.includes(cId), false, `${titleId} must not link ${cId}`);
    }
  }

  assert.equal(getCharacterChipLabel('peter-parker-616'), 'Peter Parker · E-616');
  assert.equal(getCharacterChipLabel('peter-parker-96283'), 'Peter Parker · E-96283');
  assert.equal(getCharacterChipLabel('peter-parker-120703'), 'Peter Parker · E-120703');
  assert.equal(getCharacterChipLabel('miles-morales'), 'Miles Morales');
});
