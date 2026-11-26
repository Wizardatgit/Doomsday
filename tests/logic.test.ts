import test from 'node:test';
import assert from 'node:assert/strict';

import {
  _resetTmdbCacheForTests,
  buildTmdbSearchUrl,
  fetchTmdbImage,
  personTmdbQuery,
  titleTmdbQuery,
} from '../src/lib/tmdb.ts';
import {
  _resetWikiCacheForTests,
  fetchWikiImageMeta,
  fetchWikiThumbnail,
} from '../src/lib/wikiImages.ts';
import { buildUnifiedGraph, findShortestPath, getNeighborhood } from '../src/lib/graph.ts';
import type { GraphEdge, GraphNode, UnifiedGraph } from '../src/lib/graph.ts';
import { collectVisibleTree, CRT_ZOOM_MAX, CRT_ZOOM_MIN, nextWheelZoom } from '../src/lib/graphTree.ts';
import { isRedacted, parseImportedWatchlist, serializeWatchlistBackup } from '../src/lib/spoiler.ts';
import { parseInitialUrlSearch, resolveEscapeDismissal } from '../src/state/useAppState.ts';
import { titlesById } from '../src/data/index.ts';

function makeMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => {
      store.clear();
    },
  };
}

test('TMDB query builders reject placeholders, normalize title punctuation, and use primary_release_year', () => {
  for (const placeholder of ['', '   ', 'TBA', 'Various', 'Unknown', 'Uncredited', 'Young Cast', 'Child Actor']) {
    assert.equal(personTmdbQuery(placeholder), undefined, `Expected undefined for "${placeholder}"`);
  }
  assert.deepEqual(personTmdbQuery('Robert Downey Jr.'), { kind: 'person', name: 'Robert Downey Jr.' });

  const thunderbolts = titleTmdbQuery({ kind: 'movie', title: 'Thunderbolts*', year: 2025, runtime: '2h 06m' });
  assert.deepEqual(thunderbolts, { kind: 'title', mediaType: 'movie', title: 'Thunderbolts', year: 2025 });

  const whatIf = titleTmdbQuery({ kind: 'animated', title: 'What If…?', year: 2021, runtime: '26 eps' });
  assert.deepEqual(whatIf, { kind: 'title', mediaType: 'tv', title: 'What If...?', year: 2021 });

  const movieUrl = buildTmdbSearchUrl(thunderbolts, 'abc');
  assert.ok(movieUrl.includes('primary_release_year=2025'));
  assert.equal(movieUrl.includes('&year='), false);
});

test('TMDB fetcher caches 200 OK results and does not poison cache on 503 or network failure', async () => {
  const origFetch = globalThis.fetch;
  const origStorage = (globalThis as { sessionStorage?: unknown }).sessionStorage;
  _resetTmdbCacheForTests();
  (globalThis as { sessionStorage?: unknown }).sessionStorage = makeMemoryStorage();

  let calls = 0;
  let mode: 'throw' | '503' | 'ok' = 'throw';
  globalThis.fetch = (async () => {
    calls++;
    if (mode === 'throw') throw new Error('network down');
    if (mode === '503') return new Response('busy', { status: 503 });
    return new Response(JSON.stringify({ results: [{ poster_path: '/doom.jpg' }] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    const q = { kind: 'title', mediaType: 'movie', title: 'Avengers: Doomsday', year: 2026 } as const;
    assert.equal(await fetchTmdbImage(q, 'key'), null);
    mode = '503';
    assert.equal(await fetchTmdbImage(q, 'key'), null);
    assert.equal(calls, 2);

    mode = 'ok';
    const url = await fetchTmdbImage(q, 'key');
    assert.equal(url, 'https://image.tmdb.org/t/p/w500/doom.jpg');
    assert.equal(calls, 3);

    // Subsequent call hits cache without another fetch
    assert.equal(await fetchTmdbImage(q, 'key'), 'https://image.tmdb.org/t/p/w500/doom.jpg');
    assert.equal(calls, 3);
  } finally {
    globalThis.fetch = origFetch;
    (globalThis as { sessionStorage?: unknown }).sessionStorage = origStorage;
    _resetTmdbCacheForTests();
  }
});

test('Wikimedia fetcher batches >40 pages, deduplicates concurrent calls, resolves redirects, filters minWidth, and recovers from errors', async () => {
  const origFetch = globalThis.fetch;
  const origStorage = (globalThis as { sessionStorage?: unknown }).sessionStorage;
  _resetWikiCacheForTests();
  const storage = makeMemoryStorage();
  storage.setItem('tva-wiki-img:v2:Broken_Storage', '{not-json');
  (globalThis as { sessionStorage?: unknown }).sessionStorage = storage;

  const requestedBatches: string[][] = [];
  let failNext = true;

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    const titles = (url.searchParams.get('titles') ?? '').split('|').filter(Boolean);
    requestedBatches.push(titles);

    if (failNext) {
      return new Response('rate limited', { status: 429 });
    }

    const pages: Record<string, { title: string; thumbnail?: { source: string; width: number; height: number } }> = {};
    for (let i = 0; i < titles.length; i++) {
      const slug = titles[i]!;
      const resolvedTitle = slug === 'Small_Thumb' ? 'Small Thumb' : slug === 'Alias_Page' ? 'Target Page' : slug.replace(/_/g, ' ');
      const width = slug === 'Small_Thumb' ? 300 : 800;
      pages[String(i + 1)] = {
        title: resolvedTitle,
        thumbnail: { source: `https://upload.wikimedia.org/${encodeURIComponent(resolvedTitle)}.jpg`, width, height: 600 },
      };
    }

    return new Response(
      JSON.stringify({
        query: {
          normalized: [{ from: 'Alias_Page', to: 'Alias Page' }],
          redirects: [{ from: 'Alias Page', to: 'Target Page' }],
          pages,
        },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;

  try {
    // Transient 429 should NOT poison cache
    const failed = await fetchWikiThumbnail('Broken_Storage');
    assert.equal(failed, null);
    failNext = false;

    const recovered = await fetchWikiThumbnail('Broken_Storage');
    assert.equal(recovered, 'https://upload.wikimedia.org/Broken%20Storage.jpg');

    // Concurrent identical requests deduplicate to one entry, plus redirect + minWidth check
    const [a1, a2, small] = await Promise.all([
      fetchWikiImageMeta('Alias_Page'),
      fetchWikiImageMeta('Alias_Page'),
      fetchWikiThumbnail('Small_Thumb', 600),
    ]);
    assert.equal(a1?.url, 'https://upload.wikimedia.org/Target%20Page.jpg');
    assert.equal(a2?.url, a1?.url);
    assert.equal(small, null);

    // >40 unique slugs split into batches of at most 40
    requestedBatches.length = 0;
    const bulkSlugs = Array.from({ length: 45 }, (_, i) => `Bulk_Page_${i}`);
    const bulkResults = await Promise.all(bulkSlugs.map((s) => fetchWikiThumbnail(s)));
    assert.equal(bulkResults.every((u) => typeof u === 'string' && u.length > 0), true);
    assert.equal(requestedBatches.length, 2);
    assert.equal(requestedBatches[0]!.length, 40);
    assert.equal(requestedBatches[1]!.length, 5);
  } finally {
    globalThis.fetch = origFetch;
    (globalThis as { sessionStorage?: unknown }).sessionStorage = origStorage;
    _resetWikiCacheForTests();
  }
});

test('graphTree handles DOM_DELTA_PIXEL/LINE/PAGE wheel zoom and cycle-safe tree collection', () => {
  assert.equal(nextWheelZoom(1, 0, 0), 1);
  const pixelOut = nextWheelZoom(1, 100, 0);
  const lineOut = nextWheelZoom(1, 3, 1);
  const pageOut = nextWheelZoom(1, 1, 2);
  assert.ok(pixelOut < 1);
  assert.ok(lineOut < 1);
  assert.ok(pageOut <= nextWheelZoom(1, 1, 0) - 0.15, 'DOM_DELTA_PAGE must scale page scroll, not treat 1 page as 1px');
  assert.equal(nextWheelZoom(CRT_ZOOM_MAX, -10, 2), CRT_ZOOM_MAX);
  assert.equal(nextWheelZoom(CRT_ZOOM_MIN, 10, 2), CRT_ZOOM_MIN);

  const official = buildUnifiedGraph(false);
  const root = 'reality:earth-616';
  const child = 'title:avengers-doomsday';
  const cyclic = new Map<string, string[]>([
    [root, [child]],
    [child, [root]],
  ]);
  const tree = collectVisibleTree([root], cyclic, official);
  assert.deepEqual(Array.from(tree.visibleKeys), [root, child]);
  assert.equal(tree.orderedParentPairs.length, 1);
});

test('graph BFS tie-breaking prefers lower-priority curated edges and 2-hop neighborhood filters theory layer', () => {
  const makeNode = (key: string): GraphNode => ({
    key,
    ref: { kind: 'character', id: key },
    kind: 'character',
    label: key,
    sublabel: key,
    color: '#fff',
    titleIds: [],
  });
  const nodes = new Map<string, GraphNode>([
    ['a', makeNode('a')],
    ['b1', makeNode('b1')],
    ['b2', makeNode('b2')],
    ['c', makeNode('c')],
  ]);
  const edges: GraphEdge[] = [
    { id: 'ab1', fromKey: 'a', toKey: 'b1', label: 'auto', kind: 'appearance', priority: 5 },
    { id: 'b1c', fromKey: 'b1', toKey: 'c', label: 'auto', kind: 'appearance', priority: 5 },
    { id: 'ab2', fromKey: 'a', toKey: 'b2', label: 'curated', kind: 'alliance', priority: 1 },
    { id: 'b2c', fromKey: 'b2', toKey: 'c', label: 'curated', kind: 'alliance', priority: 1 },
  ];
  const adjacency = new Map<string, { neighborKey: string; edge: GraphEdge }[]>([
    ['a', [{ neighborKey: 'b1', edge: edges[0]! }, { neighborKey: 'b2', edge: edges[2]! }]],
    ['b1', [{ neighborKey: 'a', edge: edges[0]! }, { neighborKey: 'c', edge: edges[1]! }]],
    ['b2', [{ neighborKey: 'a', edge: edges[2]! }, { neighborKey: 'c', edge: edges[3]! }]],
    ['c', [{ neighborKey: 'b1', edge: edges[1]! }, { neighborKey: 'b2', edge: edges[3]! }]],
  ]);
  const synthetic: UnifiedGraph = { nodes, edges, adjacency };
  const path = findShortestPath(synthetic, 'a', 'c');
  assert.deepEqual(path?.map((s) => s.node.key), ['a', 'b2', 'c']);

  const official = buildUnifiedGraph(false);
  const hood = getNeighborhood(official, 'character:doctor-doom', 2);
  for (const key of hood.nodeKeys) {
    assert.equal(official.nodes.get(key)?.isTheory ?? false, false);
  }
  for (const edge of hood.edges) {
    assert.equal(edge.isTheory ?? false, false);
  }
});

test('spoiler redaction, backup parsing boundary inputs, URL validation, and Escape layering', () => {
  const validIds = new Set(titlesById.keys());
  assert.equal(isRedacted(['iron-man', 'avengers-endgame'], new Set(['iron-man']), true), true);
  assert.equal(isRedacted(['iron-man'], new Set(['iron-man']), true), false);

  const bareArray = parseImportedWatchlist('["iron-man","iron-man","bad-id"]', validIds);
  assert.deepEqual(bareArray, { ok: true, watchedIds: ['iron-man'] });

  assert.equal(parseImportedWatchlist('null', validIds).ok, false);
  assert.equal(parseImportedWatchlist('42', validIds).ok, false);
  assert.equal(parseImportedWatchlist('"iron-man"', validIds).ok, false);

  const serialized = serializeWatchlistBackup(['iron-man', 'iron-man']);
  assert.deepEqual(JSON.parse(serialized).watchedIds, ['iron-man']);

  assert.deepEqual(parseInitialUrlSearch('?view=timeline&entity=title:iron-man'), {
    view: 'timeline',
    selected: { kind: 'title', id: 'iron-man' },
  });
  assert.deepEqual(parseInitialUrlSearch('?view=bad-view&entity=character:does-not-exist'), {
    view: 'hub',
    selected: null,
  });

  assert.equal(
    resolveEscapeDismissal({ settingsOpen: true, searchOpen: true, hasSelectedEntity: true, mobileMenuOpen: true }),
    'settings',
  );
  assert.equal(
    resolveEscapeDismissal({ settingsOpen: false, searchOpen: true, hasSelectedEntity: true, mobileMenuOpen: true }),
    'search',
  );
  assert.equal(
    resolveEscapeDismissal({ settingsOpen: false, searchOpen: false, hasSelectedEntity: true, mobileMenuOpen: true }),
    'dossier',
  );
  assert.equal(
    resolveEscapeDismissal({ settingsOpen: false, searchOpen: false, hasSelectedEntity: false, mobileMenuOpen: true }),
    'mobileMenu',
  );
  assert.equal(
    resolveEscapeDismissal({ settingsOpen: false, searchOpen: false, hasSelectedEntity: false, mobileMenuOpen: false }),
    null,
  );
});

test('graph disambiguates duplicate character names and labels Doomsday edges by confirmation status', () => {
  const graph = buildUnifiedGraph(false);
  const charLabels = Array.from(graph.nodes.values())
    .filter((n) => n.kind === 'character')
    .map((n) => n.label);
  assert.equal(new Set(charLabels).size, charLabels.length, 'Character graph/dropdown labels must be unique');

  const peggyEdge = graph.edges.find(
    (e) =>
      e.fromKey === 'character:peggy-carter' &&
      e.toKey === 'title:avengers-doomsday',
  );
  const steveEdge = graph.edges.find(
    (e) =>
      e.fromKey === 'character:steve-rogers' &&
      e.toKey === 'title:avengers-doomsday',
  );
  assert.equal(peggyEdge?.label, 'Likely for Doomsday');
  assert.equal(steveEdge?.label, 'Confirmed for Doomsday');
});
