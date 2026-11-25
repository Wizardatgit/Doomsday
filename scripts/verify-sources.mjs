import { CHARACTERS, TITLES } from '../src/data/index.ts';

const urlSet = new Set();
for (const entry of [...TITLES, ...CHARACTERS]) {
  for (const s of entry.sources ?? []) {
    try {
      const parsed = new URL(s.url);
      if (!parsed.hostname.endsWith('wikipedia.org')) {
        urlSet.add(s.url);
      }
    } catch {
      console.error(`FAIL [invalid URL] ${s.url}`);
      process.exitCode = 1;
    }
  }
}

let okCount = 0;
let warnCount = 0;
let failCount = 0;

for (const url of Array.from(urlSet).sort()) {
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; TVA-Doomsday-SourceVerify/1.0)',
        accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (res.status >= 200 && res.status < 400) {
      okCount++;
      console.log(`OK   ${res.status} ${url}`);
    } else if (res.status === 403) {
      warnCount++;
      console.log(`WARN ${res.status} (WAF/CloudFront bot block) ${url}`);
    } else {
      failCount++;
      console.error(`FAIL ${res.status} ${url}`);
    }
  } catch (err) {
    failCount++;
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`FAIL ERR (${msg}) ${url}`);
  }
}

console.log(`\nSummary: ${okCount} OK, ${warnCount} WARN, ${failCount} FAIL (${urlSet.size} non-Wikipedia Tier-1 URLs)`);
if (failCount > 0) {
  process.exitCode = 1;
}
