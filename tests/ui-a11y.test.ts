import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer, type ViteDevServer } from 'vite';

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
  'path', 'circle', 'rect', 'line', 'polygon', 'polyline', 'ellipse', 'stop', 'use',
]);

/** Scans rendered HTML and asserts no <button> or role="button" encloses another interactive button. */
function assertNoNestedButtons(html: string, viewName: string) {
  const stack: { tag: string; isInteractiveButton: boolean }[] = [];
  const tagRegex = /<\/?([a-zA-Z0-9-]+)([^>]*)>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(html)) !== null) {
    const raw = match[0];
    const tag = match[1]!.toLowerCase();
    const attrs = match[2] ?? '';
    const isClosing = raw.startsWith('</');
    const isSelfClosing = raw.endsWith('/>') || VOID_TAGS.has(tag);

    if (isClosing) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i]!.tag === tag) {
          stack.splice(i);
          break;
        }
      }
      continue;
    }

    const isInteractiveButton = tag === 'button' || /\brole\s*=\s*"button"/i.test(attrs);
    if (isInteractiveButton) {
      const ancestor = stack.find((item) => item.isInteractiveButton);
      assert.equal(
        ancestor,
        undefined,
        `${viewName}: found nested <${tag}> interactive button inside <${ancestor?.tag}>`,
      );
    }

    if (!isSelfClosing) {
      stack.push({ tag, isInteractiveButton });
    }
  }
}

let vite: ViteDevServer;

before(async () => {
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'silent',
  });
});

after(async () => {
  await vite?.close();
});

test('SettingsModal and DossierDrawer expose WAI-ARIA dialog semantics and accessible names', async () => {
  const { SettingsModal } = await vite.ssrLoadModule('/src/components/SettingsModal.tsx');
  const { DossierDrawer } = await vite.ssrLoadModule('/src/components/DossierDrawer.tsx');

  const settingsHtml = renderToStaticMarkup(
    React.createElement(SettingsModal, {
      onClose: () => {},
      tmdbApiKey: '',
      onSaveTmdbKey: () => {},
      watchedCount: 3,
      onExportBackup: () => '{}',
      onImportBackup: () => ({ ok: true, watchedIds: [] }),
      onResetProgress: () => {},
    }),
  );
  assert.match(settingsHtml, /role="dialog"/);
  assert.match(settingsHtml, /aria-modal="true"/);
  assert.match(settingsHtml, /aria-labelledby="settings-modal-title"/);
  assert.match(settingsHtml, /id="settings-modal-title"/);
  assert.match(settingsHtml, /<label[^>]*for="tmdb-api-key-input"/);
  assert.match(settingsHtml, /<input[^>]*id="tmdb-api-key-input"/);
  assert.match(settingsHtml, /role="status"/);
  assertNoNestedButtons(settingsHtml, 'SettingsModal');

  for (const selected of [
    { kind: 'character', id: 'doctor-doom' },
    { kind: 'title', id: 'avengers-doomsday' },
    { kind: 'reality', id: 'earth-828' },
    { kind: 'place', id: 'place-wakanda' },
  ] as const) {
    const drawerHtml = renderToStaticMarkup(
      React.createElement(DossierDrawer, {
        selected,
        onClose: () => {},
        onSelect: () => {},
        onFocusGraph: () => {},
        onTracePath: () => {},
        watchedSet: new Set<string>(),
        onToggleWatched: () => {},
        spoilerShield: true,
        showTheories: false,
        tmdbApiKey: '',
      }),
    );
    assert.match(drawerHtml, /role="dialog"/, `DossierDrawer(${selected.kind}) missing role="dialog"`);
    assert.match(drawerHtml, /aria-modal="true"/, `DossierDrawer(${selected.kind}) missing aria-modal="true"`);
    assert.match(drawerHtml, /aria-label="/, `DossierDrawer(${selected.kind}) missing aria-label`);
    assert.match(drawerHtml, /role="tablist"/, `DossierDrawer(${selected.kind}) missing role="tablist"`);
    assert.match(drawerHtml, /role="tab"/, `DossierDrawer(${selected.kind}) missing role="tab"`);
    assertNoNestedButtons(drawerHtml, `DossierDrawer(${selected.kind})`);
  }
});

test('primary views contain zero nested interactive button descendants (even with Spoiler Shield ON)', async () => {
  const watchedSet = new Set<string>(['iron-man', 'avengers-endgame']);
  const noop = () => {};

  const { CommandHub } = await vite.ssrLoadModule('/src/components/CommandHub.tsx');
  const { CharacterDirectory } = await vite.ssrLoadModule('/src/components/CharacterDirectory.tsx');
  const { RealitiesAtlas } = await vite.ssrLoadModule('/src/components/RealitiesAtlas.tsx');
  const { SacredTimeline } = await vite.ssrLoadModule('/src/components/SacredTimeline.tsx');
  const { FactionsHub } = await vite.ssrLoadModule('/src/components/FactionsHub.tsx');
  const { ThreadsTracker } = await vite.ssrLoadModule('/src/components/ThreadsTracker.tsx');
  const { ConnectionGraph } = await vite.ssrLoadModule('/src/components/ConnectionGraph.tsx');
  const { PathFinder } = await vite.ssrLoadModule('/src/components/PathFinder.tsx');

  for (const shield of [false, true]) {
    const views: [string, React.ReactElement][] = [
      [
        'CommandHub',
        React.createElement(CommandHub, {
          watchedSet,
          spoilerShield: shield,
          showTheories: false,
          tmdbApiKey: '',
          welcomeExpanded: true,
          onToggleWelcome: noop,
          onOpenBeginnerPath: noop,
          onSelect: noop,
          onNavigate: noop,
          onOpenFaction: noop,
          onLaunchPresetPath: noop,
        }),
      ],
      [
        'CharacterDirectory',
        React.createElement(CharacterDirectory, {
          watchedSet,
          spoilerShield: shield,
          tmdbApiKey: '',
          onSelect: noop,
        }),
      ],
      [
        'RealitiesAtlas',
        React.createElement(RealitiesAtlas, {
          watchedSet,
          spoilerShield: shield,
          onSelect: noop,
        }),
      ],
      [
        'SacredTimeline',
        React.createElement(SacredTimeline, {
          watchedSet,
          spoilerShield: shield,
          tmdbApiKey: '',
          timelinePreset: 'all',
          onChangePreset: noop,
          onToggleWatched: noop,
          onMarkEraWatched: noop,
          onSelect: noop,
        }),
      ],
      [
        'FactionsHub',
        React.createElement(FactionsHub, {
          watchedSet,
          spoilerShield: shield,
          tmdbApiKey: '',
          initialExpandedFactionId: 'fantastic-four',
          onClearInitialFaction: noop,
          onSelect: noop,
        }),
      ],
      [
        'ThreadsTracker',
        React.createElement(ThreadsTracker, {
          watchedSet,
          spoilerShield: shield,
          showTheories: false,
          onSelect: noop,
        }),
      ],
      [
        'ConnectionGraph',
        React.createElement(ConnectionGraph, {
          showTheories: false,
          onSelect: noop,
        }),
      ],
      [
        'PathFinder',
        React.createElement(PathFinder, {
          originKey: 'title:x-men-2000',
          targetKey: 'title:avengers-doomsday',
          onChangeOrigin: noop,
          onChangeTarget: noop,
          showTheories: false,
          watchedSet,
          spoilerShield: shield,
          tmdbApiKey: '',
          onSelect: noop,
        }),
      ],
    ];

    for (const [name, element] of views) {
      const html = renderToStaticMarkup(element);
      assert.ok(html.length > 200, `Expected non-empty markup for ${name}`);
      assertNoNestedButtons(html, `${name}(shield=${shield})`);

      if (!shield) {
        if (name === 'CommandHub' || name === 'SacredTimeline') {
          assert.match(html, /<button[^>]*>Open Folder →<\/button>/, `${name} must expose keyboard dossier buttons`);
        }
        if (name === 'ThreadsTracker') {
          assert.match(html, /<button[^>]*>Open Dossier →<\/button>/, 'ThreadsTracker must expose keyboard dossier buttons');
        }
        if (name === 'PathFinder') {
          assert.match(html, /<label[^>]*for="path-origin-select"/);
          assert.match(html, /<select[^>]*id="path-origin-select"/);
          assert.match(html, /<label[^>]*for="path-target-select"/);
          assert.match(html, /<select[^>]*id="path-target-select"/);
        }
        if (name === 'FactionsHub') {
          assert.match(html, /aria-expanded="true"/);
          assert.match(html, /\b1 operative\b/, 'Doctor Doom faction should use singular "1 operative"');
        }
        if (name === 'ConnectionGraph') {
          assert.match(html, /role="button"[^>]*tabindex="0"/i, 'CRT SVG nodes must be keyboard focusable');
        }
      }
    }
  }
});

test('EntityVisual renders emblem fallback without image and respects hideZoomTrigger', async () => {
  const { EntityVisual } = await vite.ssrLoadModule('/src/components/TvaArt.tsx');

  const fallbackHtml = renderToStaticMarkup(
    React.createElement(EntityVisual, {
      variant: 'poster',
      code: 'E-616',
      title: 'Iron Man',
      subtitle: '2008',
      accentColor: '#c2410c',
    }),
  );
  assert.doesNotMatch(fallbackHtml, /<img\b/);
  assert.match(fallbackHtml, /<svg\b/);
  assert.match(fallbackHtml, /E-616/);
  assert.match(fallbackHtml, /2008/);

  const withZoomHtml = renderToStaticMarkup(
    React.createElement(EntityVisual, {
      variant: 'plate',
      code: 'E-828',
      title: 'Baxter Building',
      subtitle: 'Earth-828',
      accentColor: '#38bdf8',
      staticImagePath: './places/baxter-828.jpg',
    }),
  );
  assert.match(withZoomHtml, /<img\b/);
  assert.match(withZoomHtml, /role="button"/);

  const hiddenZoomHtml = renderToStaticMarkup(
    React.createElement(EntityVisual, {
      variant: 'plate',
      code: 'E-828',
      title: 'Baxter Building',
      subtitle: 'Earth-828',
      accentColor: '#38bdf8',
      staticImagePath: './places/baxter-828.jpg',
      hideZoomTrigger: true,
    }),
  );
  assert.match(hiddenZoomHtml, /<img\b/);
  assert.doesNotMatch(hiddenZoomHtml, /role="button"/);
});

test('App shell exposes landmark nav, aria-current, aria-pressed toggles, Watch Progress card, and zero nested buttons', async () => {
  const { App } = await vite.ssrLoadModule('/src/App.tsx');
  const html = renderToStaticMarkup(React.createElement(App));
  assert.match(html, /<nav[^>]*aria-label="Primary sections"/);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /aria-pressed="/);
  assert.match(html, /Watch Progress/);
  assert.match(html, /Must-Watch/);
  assert.match(html, /All Titles/);
  assert.match(html, /Up Next/);
  assert.match(html, /Open Timeline →/);
  assertNoNestedButtons(html, 'App');
});

test('RealitiesAtlas segmented filter uses WAI-ARIA toggle-button group (no orphaned role="tab")', async () => {
  const { RealitiesAtlas } = await vite.ssrLoadModule('/src/components/RealitiesAtlas.tsx');
  const html = renderToStaticMarkup(
    React.createElement(RealitiesAtlas, {
      watchedSet: new Set<string>(),
      spoilerShield: false,
      onSelect: () => {},
    }),
  );
  assert.doesNotMatch(html, /role="tab"/, 'Segmented filter without tabpanels must not use role="tab"');
  assert.match(html, /role="group"[^>]*aria-label="Atlas sections"/);
  assert.match(html, /aria-pressed="true"/);
});

test('SacredTimeline exposes List/Posters layout switcher, labelled selects, and zero nested buttons', async () => {
  const { SacredTimeline } = await vite.ssrLoadModule('/src/components/SacredTimeline.tsx');
  const html = renderToStaticMarkup(
    React.createElement(SacredTimeline, {
      watchedSet: new Set<string>(),
      spoilerShield: false,
      tmdbApiKey: '',
      timelinePreset: 'all',
      onChangePreset: () => {},
      onToggleWatched: () => {},
      onMarkEraWatched: () => {},
      onSelect: () => {},
    }),
  );
  assert.match(html, /role="group"[^>]*aria-label="Timeline layout"/);
  assert.match(html, /List<\/button>/);
  assert.match(html, /Posters<\/button>/);
  assert.match(html, /aria-label="Filter by era"/);
  assertNoNestedButtons(html, 'SacredTimeline');
});

test('local SVG place and comic assets are valid, self-contained, and free of scripts or event handlers', () => {
  const svgDirs = [
    path.join(process.cwd(), 'public', 'places'),
    path.join(process.cwd(), 'public', 'comic'),
  ];
  const svgFiles = svgDirs.flatMap((dir) =>
    fs
      .readdirSync(dir)
      .filter((name) => name.endsWith('.svg'))
      .map((name) => path.join(dir, name)),
  );
  assert.ok(svgFiles.length >= 8, `Expected >= 8 local SVG assets, found ${svgFiles.length}`);

  for (const file of svgFiles) {
    const content = fs.readFileSync(file, 'utf8').trim();
    assert.ok(content.startsWith('<svg'), `${file} must start with <svg`);
    assert.match(content, /\bviewBox="[^"]+"/, `${file} missing viewBox`);
    assert.ok(content.endsWith('</svg>'), `${file} must end with </svg>`);
    assert.doesNotMatch(content, /<script\b/i, `${file} must not contain <script`);
    assert.doesNotMatch(content, /\son[a-z]+\s*=/i, `${file} must not contain inline event handlers`);
  }
});

test('App renders all 4 comic backdrop assets, keeps sidebar and hero day countdowns aligned, and honors reduced-motion rules', async () => {
  const { App } = await vite.ssrLoadModule('/src/App.tsx');
  const cleanHtml = renderToStaticMarkup(React.createElement(App)).replace(/<!--\s*-->/g, '');

  const comicFiles = [
    'comic-portal.jpg',
    'comic-citadel.jpg',
    'comic-clockwork.jpg',
    'comic-starburst.jpg',
  ];
  for (const name of comicFiles) {
    assert.ok(cleanHtml.includes(`src="./comic/${name}"`), `App HTML missing comic backdrop ${name}`);
    assert.ok(
      fs.existsSync(path.join(process.cwd(), 'public', 'comic', name)),
      `Missing public/comic/${name}`,
    );
  }

  for (const slideFile of [
    'slide-01-loom.jpg',
    'slide-02-breach.jpg',
    'slide-03-828.jpg',
    'slide-04-teams.jpg',
    'slide-05-doom.jpg',
  ]) {
    assert.ok(
      fs.existsSync(path.join(process.cwd(), 'public', 'story', slideFile)),
      `Missing public/story/${slideFile}`,
    );
  }

  assert.match(cleanHtml, /TVA Orientation Reel interactive story projector/);

  const sidebarMatch = cleanHtml.match(/\bT-(\d+)D\b/);
  const heroMatch = cleanHtml.match(/\bT-(\d+) DAYS\b/);
  assert.ok(sidebarMatch, 'Sidebar T-<days>D countdown not found in rendered App HTML');
  assert.ok(heroMatch, 'Desk Overview T-<days> DAYS countdown not found in rendered App HTML');
  assert.equal(sidebarMatch[1], heroMatch[1], 'Sidebar and Desk Overview day countdowns must match');

  const css = fs.readFileSync(path.join(process.cwd(), 'src', 'index.css'), 'utf8');
  const reducedBlock = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?\n)\}/);
  assert.ok(reducedBlock, 'src/index.css missing @media (prefers-reduced-motion: reduce) block');
  const blockBody = reducedBlock[1];
  for (const selector of [
    '.tva-loom-pulse',
    '.tva-view-enter',
    '.tva-backdrop-fade',
    '.tva-drawer-slide',
    '.tva-modal-pop',
    '.tva-stamp-pop',
    '.tva-branch-drift',
    '.tva-slide-frame',
    '.tva-desk-stage',
    '.tva-polaroid-lift',
    '.tva-card-sheen',
  ]) {
    assert.ok(blockBody.includes(selector), `Reduced-motion block missing ${selector}`);
  }
  assert.match(blockBody, /animation:\s*none;/);
  assert.match(blockBody, /transition:\s*none;/);
  assert.match(
    css,
    /\.tva-desk-stage\s*\{\s*background-color:\s*transparent;/,
    '.tva-desk-stage base background-color must remain transparent so body dual-grid stays visible',
  );
});

test('StoryProjector slides reference valid data IDs, wrap cleanly, and render zero nested buttons', async () => {
  const { StoryProjector, STORY_SLIDES, stepSlideIndex } = await vite.ssrLoadModule(
    '/src/components/StoryProjector.tsx',
  );
  const { charactersById, titlesById, threadsById } = await vite.ssrLoadModule('/src/data/index.ts');

  assert.equal(STORY_SLIDES.length, 5);
  assert.equal(stepSlideIndex(4, 1, 5), 0);
  assert.equal(stepSlideIndex(0, -1, 5), 4);

  for (const slide of STORY_SLIDES) {
    assert.ok(threadsById.has(slide.threadId), `Story slide ${slide.id} references missing thread ${slide.threadId}`);
    for (const tid of slide.titleIds) {
      assert.ok(titlesById.has(tid), `Story slide ${slide.id} references missing title ${tid}`);
    }
    for (const cid of slide.characterIds) {
      assert.ok(charactersById.has(cid), `Story slide ${slide.id} references missing character ${cid}`);
    }
    const diskPath = path.join(process.cwd(), 'public', slide.imagePath.replace(/^\.\//, ''));
    assert.ok(fs.existsSync(diskPath), `Story slide ${slide.id} missing image at ${diskPath}`);
  }

  for (const shield of [false, true]) {
    const html = renderToStaticMarkup(
      React.createElement(StoryProjector, {
        watchedSet: new Set<string>(),
        spoilerShield: shield,
        onSelect: () => {},
      }),
    );
    assert.match(html, /The Road to Doomsday in 60 Seconds/);
    assertNoNestedButtons(html, `StoryProjector(shield=${shield})`);
  }
});

test('PathFinder presets resolve cleanly, pickRandomTracePair stays distinct, and Evidence Board has zero nested buttons', async () => {
  const { PathFinder, QUICK_PAIRS, pickRandomTracePair } = await vite.ssrLoadModule(
    '/src/components/PathFinder.tsx',
  );
  const { buildUnifiedGraph, findShortestPath } = await vite.ssrLoadModule('/src/lib/graph.ts');
  const graph = buildUnifiedGraph(false);

  assert.ok(QUICK_PAIRS.length >= 8);
  for (const q of QUICK_PAIRS) {
    const pathResult = findShortestPath(graph, q.from, q.to);
    assert.ok(pathResult && pathResult.length >= 2, `Preset "${q.label}" did not resolve in graph`);
  }

  const randomPair = pickRandomTracePair(graph, QUICK_PAIRS[0].from, QUICK_PAIRS[0].to);
  assert.notEqual(randomPair.from, randomPair.to);
  assert.ok(
    randomPair.from !== QUICK_PAIRS[0].from || randomPair.to !== QUICK_PAIRS[0].to,
    'pickRandomTracePair must return a distinct route',
  );
  assert.ok(findShortestPath(graph, randomPair.from, randomPair.to));

  for (const shield of [false, true]) {
    const html = renderToStaticMarkup(
      React.createElement(PathFinder, {
        originKey: QUICK_PAIRS[0].from,
        targetKey: QUICK_PAIRS[0].to,
        onChangeOrigin: () => {},
        onChangeTarget: () => {},
        showTheories: false,
        watchedSet: new Set<string>(),
        spoilerShield: shield,
        tmdbApiKey: '',
        onSelect: () => {},
      }),
    );
    assert.match(html, /VECTOR TRACK/);
    assert.match(html, /Route Brief/);
    assert.match(html, /Random Trace/);
    assertNoNestedButtons(html, `PathFinder(shield=${shield})`);
  }
});
