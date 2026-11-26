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
  assert.ok(svgFiles.length >= 10, `Expected >= 10 local SVG assets, found ${svgFiles.length}`);

  for (const file of svgFiles) {
    const content = fs.readFileSync(file, 'utf8').trim();
    assert.ok(content.startsWith('<svg'), `${file} must start with <svg`);
    assert.match(content, /\bviewBox="[^"]+"/, `${file} missing viewBox`);
    assert.ok(content.endsWith('</svg>'), `${file} must end with </svg>`);
    assert.doesNotMatch(content, /<script\b/i, `${file} must not contain <script`);
    assert.doesNotMatch(content, /\son[a-z]+\s*=/i, `${file} must not contain inline event handlers`);
  }
});
