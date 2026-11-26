import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { CHARACTERS, REALITIES, TITLES, titlesById } from '../src/data/index.ts';

const TIER1_NON_WIKI_HOSTS = new Set([
  'www.marvel.com',
  'marvel.com',
  'www.disneyplus.com',
  'disneyplus.com',
  'variety.com',
  'www.hollywoodreporter.com',
  'hollywoodreporter.com',
  'deadline.com',
  'ew.com',
]);

// Official 27 actors announced on Marvel.com's March 26, 2025 Avengers: Doomsday chair livestream
const MARCH_2025_CHAIR_CAST_IDS = new Set([
  'doctor-doom',
  'sam-wilson',
  'joaquin-torres',
  'thor',
  'scott-lang',
  'shang-chi',
  'yelena-belova',
  'bucky-barnes',
  'red-guardian',
  'john-walker',
  'ghost',
  'sentry',
  'reed-richards',
  'sue-storm',
  'johnny-storm',
  'ben-grimm',
  'professor-x',
  'magneto',
  'cyclops',
  'beast',
  'nightcrawler',
  'mystique',
  'gambit',
  'shuri',
  'mbaku',
  'namor',
  'loki',
]);

function hasTier1NonWikiSource(sources?: { label: string; url: string }[]): boolean {
  if (!sources || sources.length === 0) return false;
  return sources.some((s) => {
    try {
      return TIER1_NON_WIKI_HOSTS.has(new URL(s.url).hostname.toLowerCase());
    } catch {
      return false;
    }
  });
}

test('2025-2026 Phase 5 & Phase 6 release dates and phases match Marvel.com / Disney+ / trade announcements', () => {
  const verifiedSlate: { id: string; releaseDate: string; era: string }[] = [
    { id: 'captain-america-brave-new-world', releaseDate: '2025-02-14', era: 'phase-5' },
    { id: 'daredevil-born-again', releaseDate: '2025-03-04', era: 'phase-5' },
    { id: 'thunderbolts', releaseDate: '2025-05-02', era: 'phase-5' },
    { id: 'ironheart', releaseDate: '2025-06-24', era: 'phase-5' },
    { id: 'fantastic-four-first-steps', releaseDate: '2025-07-25', era: 'phase-6' },
    { id: 'eyes-of-wakanda', releaseDate: '2025-08-01', era: 'phase-6' },
    { id: 'marvel-zombies', releaseDate: '2025-09-24', era: 'phase-6' },
    { id: 'wonder-man', releaseDate: '2026-01-27', era: 'phase-6' },
    { id: 'daredevil-born-again-s2', releaseDate: '2026-03-24', era: 'phase-6' },
    { id: 'punisher-one-last-kill', releaseDate: '2026-05-12', era: 'phase-6' },
    { id: 'spider-man-brand-new-day', releaseDate: '2026-07-31', era: 'phase-6' },
    { id: 'vision-quest', releaseDate: '2026-10-14', era: 'phase-6' },
    { id: 'avengers-doomsday', releaseDate: '2026-12-18', era: 'phase-6' },
  ];

  for (const expected of verifiedSlate) {
    const title = titlesById.get(expected.id);
    assert.ok(title, `Missing verified 2025-2026 title: ${expected.id}`);
    assert.equal(
      title.releaseDate,
      expected.releaseDate,
      `${expected.id} releaseDate mismatch`,
    );
    assert.equal(title.era, expected.era, `${expected.id} era mismatch`);
  }
});

test('all titles have unique chronoOrder values and years matching releaseDate', () => {
  const seenChrono = new Set<number>();
  for (const t of TITLES) {
    assert.equal(
      t.year,
      Number(t.releaseDate.slice(0, 4)),
      `${t.id}: year ${t.year} does not match releaseDate ${t.releaseDate}`,
    );
    assert.ok(!seenChrono.has(t.chronoOrder), `Duplicate chronoOrder ${t.chronoOrder} on ${t.id}`);
    seenChrono.add(t.chronoOrder);
  }
});

test('character firstAppearance <= lastSeen and non-Doomsday journey beats never postdate lastSeen', () => {
  for (const c of CHARACTERS) {
    const first = titlesById.get(c.firstAppearanceTitleId);
    const last = titlesById.get(c.lastSeenTitleId);
    assert.ok(first && last, `${c.id} missing first/last title`);
    assert.ok(
      first.releaseDate <= last.releaseDate,
      `${c.id}: firstAppearance ${first.id} (${first.releaseDate}) is after lastSeen ${last.id} (${last.releaseDate})`,
    );

    for (const beat of c.journey) {
      if (beat.titleId === 'avengers-doomsday') continue;
      const jt = titlesById.get(beat.titleId);
      assert.ok(jt, `${c.id} missing journey title ${beat.titleId}`);
      assert.ok(
        jt.releaseDate <= last.releaseDate,
        `${c.id}: journey title ${jt.id} (${jt.releaseDate}) postdates lastSeen ${last.id} (${last.releaseDate})`,
      );
    }
  }
});

test('pre-phase-1 contains only non-MCU legacy worlds (Earth-616 Agent Carter belongs in MCU phase-2)', () => {
  const prePhase1Earth616 = TITLES.filter(
    (t) => t.era === 'pre-phase-1' && t.realityId === 'earth-616',
  );
  assert.deepEqual(
    prePhase1Earth616.map((t) => t.id),
    [],
    'pre-phase-1 should not mix Earth-616 MCU entries with pre-MCU legacy franchises',
  );

  const agentCarter = titlesById.get('agent-carter-series');
  assert.ok(agentCarter);
  assert.equal(agentCarter.era, 'phase-2');
  assert.equal(agentCarter.realityId, 'earth-616');
});

test('1998-2025 cross-era landmark release dates match Marvel.com / Disney+ / Variety / Box Office records', () => {
  const landmarks: { id: string; releaseDate: string; era: string }[] = [
    { id: 'blade-1998', releaseDate: '1998-08-21', era: 'pre-phase-1' },
    { id: 'x-men-2000', releaseDate: '2000-07-14', era: 'pre-phase-1' },
    { id: 'spider-man-2002', releaseDate: '2002-05-03', era: 'pre-phase-1' },
    { id: 'x-men-dofp-2014', releaseDate: '2014-05-23', era: 'pre-phase-1' },
    { id: 'logan-2017', releaseDate: '2017-03-03', era: 'pre-phase-1' },
    { id: 'spider-verse-2018', releaseDate: '2018-12-14', era: 'pre-phase-1' },
    { id: 'x-men-97', releaseDate: '2024-03-20', era: 'pre-phase-1' },
    { id: 'iron-man', releaseDate: '2008-05-02', era: 'phase-1' },
    { id: 'the-avengers', releaseDate: '2012-05-04', era: 'phase-1' },
    { id: 'captain-america-winter-soldier', releaseDate: '2014-04-04', era: 'phase-2' },
    { id: 'daredevil-saga', releaseDate: '2015-04-10', era: 'defenders' },
    { id: 'captain-america-civil-war', releaseDate: '2016-05-06', era: 'phase-3' },
    { id: 'avengers-infinity-war', releaseDate: '2018-04-27', era: 'phase-3' },
    { id: 'avengers-endgame', releaseDate: '2019-04-26', era: 'phase-3' },
    { id: 'wandavision', releaseDate: '2021-01-15', era: 'phase-4' },
    { id: 'loki-s1', releaseDate: '2021-06-09', era: 'phase-4' },
    { id: 'spider-man-no-way-home', releaseDate: '2021-12-17', era: 'phase-4' },
    { id: 'doctor-strange-mom', releaseDate: '2022-05-06', era: 'phase-4' },
    { id: 'black-panther-wakanda-forever', releaseDate: '2022-11-11', era: 'phase-4' },
    { id: 'loki-s2', releaseDate: '2023-10-05', era: 'phase-5' },
    { id: 'the-marvels', releaseDate: '2023-11-10', era: 'phase-5' },
    { id: 'echo', releaseDate: '2024-01-09', era: 'phase-5' },
    { id: 'deadpool-wolverine', releaseDate: '2024-07-26', era: 'phase-5' },
    { id: 'agatha-all-along', releaseDate: '2024-09-18', era: 'phase-5' },
    { id: 'friendly-neighborhood-spider-man', releaseDate: '2025-01-29', era: 'phase-5' },
  ];

  for (const expected of landmarks) {
    const title = titlesById.get(expected.id);
    assert.ok(title, `Missing landmark title: ${expected.id}`);
    assert.equal(title.releaseDate, expected.releaseDate, `${expected.id} releaseDate mismatch`);
    assert.equal(title.era, expected.era, `${expected.id} era mismatch`);
  }
});

test('no cited entry relies solely on Wikipedia, Phase 5-6 slate has specific Tier-1 URLs, and confirmed Doomsday cast meets provenance bar', () => {
  const genericRoots = new Set([
    'https://www.marvel.com',
    'https://www.marvel.com/',
    'https://www.marvel.com/movies',
    'https://www.marvel.com/tv-shows',
  ]);

  for (const t of TITLES) {
    if (t.sources && t.sources.length > 0) {
      assert.ok(
        hasTier1NonWikiSource(t.sources),
        `Title ${t.id} sources must include at least one Tier-1 non-Wikipedia URL`,
      );
      for (const s of t.sources) {
        assert.equal(genericRoots.has(s.url), false, `Title ${t.id} uses generic root URL ${s.url}`);
        assert.equal(
          new URL(s.url).pathname.startsWith('/characters/'),
          false,
          `Title ${t.id} should cite its movie/TV page rather than a /characters/ page (${s.url})`,
        );
      }
    }
  }

  for (const id of [
    'captain-america-brave-new-world',
    'daredevil-born-again',
    'thunderbolts',
    'ironheart',
    'fantastic-four-first-steps',
    'eyes-of-wakanda',
    'marvel-zombies',
    'wonder-man',
    'daredevil-born-again-s2',
    'punisher-one-last-kill',
    'spider-man-brand-new-day',
    'vision-quest',
    'avengers-doomsday',
  ]) {
    const t = titlesById.get(id);
    assert.ok(t, `Missing 2025-2026 title ${id}`);
    assert.ok(
      hasTier1NonWikiSource(t.sources),
      `2025-2026 title ${id} must carry a specific Tier-1 non-Wikipedia URL`,
    );
  }

  for (const c of CHARACTERS) {
    if (c.sources && c.sources.length > 0) {
      assert.ok(
        hasTier1NonWikiSource(c.sources),
        `Character ${c.id} sources must include at least one Tier-1 non-Wikipedia URL`,
      );
    }

    if (c.doomsdayStatus === 'confirmed') {
      assert.ok(
        MARCH_2025_CHAIR_CAST_IDS.has(c.id) || hasTier1NonWikiSource(c.sources),
        `Confirmed Doomsday character ${c.id} lacks March 2025 chair-reveal membership or Tier-1 citation`,
      );
    }
  }

  for (const id of ['peggy-carter', 'cassie-lang', 'kate-bishop', 'namora']) {
    const c = CHARACTERS.find((item) => item.id === id);
    assert.ok(c, `Missing character ${id}`);
    assert.notEqual(
      c.doomsdayStatus,
      'confirmed',
      `${id} was not in the 27-chair reveal and lacks a direct verified Tier-1 source`,
    );
  }
});

test('title keyCharacterIds sync with character first/last bounds, title wikiPages match sources, and reality colors meet WCAG AA on cream', () => {
  for (const c of CHARACTERS) {
    const first = titlesById.get(c.firstAppearanceTitleId)!;
    const last = titlesById.get(c.lastSeenTitleId)!;
    for (const t of TITLES) {
      if (!t.keyCharacterIds.includes(c.id)) continue;
      assert.ok(
        t.releaseDate >= first.releaseDate,
        `${c.id}: firstAppearance ${first.id} (${first.releaseDate}) is newer than linked title ${t.id} (${t.releaseDate})`,
      );
      if (t.id !== 'avengers-doomsday') {
        assert.ok(
          t.releaseDate <= last.releaseDate,
          `${c.id}: lastSeen ${last.id} (${last.releaseDate}) is older than linked title ${t.id} (${t.releaseDate})`,
        );
      }
    }
  }

  for (const t of TITLES) {
    const wikiSrc = t.sources?.find((s) => s.url.includes('en.wikipedia.org/wiki/'));
    if (wikiSrc && t.wikiPage) {
      const slug = decodeURIComponent(wikiSrc.url.split('/wiki/')[1]!);
      assert.equal(t.wikiPage, slug, `Title ${t.id} wikiPage ${t.wikiPage} disagrees with source URL ${slug}`);
    }
  }

  const srgb = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const lum = (hex: string) => {
    const h = hex.replace('#', '');
    return (
      0.2126 * srgb(parseInt(h.slice(0, 2), 16)) +
      0.7152 * srgb(parseInt(h.slice(2, 4), 16)) +
      0.0722 * srgb(parseInt(h.slice(4, 6), 16))
    );
  };
  const contrast = (a: string, b: string) => {
    const la = lum(a);
    const lb = lum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };

  for (const r of REALITIES) {
    const ratio = contrast(r.color, '#faf4e6');
    assert.ok(
      ratio >= 4.5,
      `Reality ${r.id} (${r.color}) contrast ${ratio.toFixed(2)}:1 on #faf4e6 is below WCAG AA 4.5:1`,
    );
  }
});

test('data and UI source copy contains zero em dashes (—)', () => {
  const dirs = [path.join(process.cwd(), 'src', 'data'), path.join(process.cwd(), 'src', 'components')];
  const files = dirs.flatMap((dir) =>
    fs
      .readdirSync(dir)
      .filter((name) => name.endsWith('.ts') || name.endsWith('.tsx'))
      .map((name) => path.join(dir, name)),
  );
  files.push(path.join(process.cwd(), 'src', 'App.tsx'));
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    assert.ok(!content.includes('—'), `${path.basename(file)} still contains an em dash (—)`);
  }
});
