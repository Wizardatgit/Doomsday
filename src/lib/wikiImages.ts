const STORAGE_PREFIX = 'tva-wiki-img:v1:';
const WIKI_ENDPOINT = 'https://en.wikipedia.org/w/api.php';

const memoryCache = new Map<string, string | null>();
const inflightMap = new Map<string, Promise<string | null>>();

interface PendingRequest {
  page: string;
  resolve: (url: string | null) => void;
}

let pendingQueue: PendingRequest[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function buildWikiBatchUrl(pages: string[], thumbSize = 640): string {
  const params = new URLSearchParams({
    action: 'query',
    titles: pages.join('|'),
    prop: 'pageimages',
    pilicense: 'any',
    piprop: 'thumbnail',
    pithumbsize: String(thumbSize),
    redirects: '1',
    format: 'json',
    origin: '*',
  });
  return `${WIKI_ENDPOINT}?${params.toString()}`;
}

function readCached(page: string): string | null | undefined {
  if (memoryCache.has(page)) return memoryCache.get(page);
  try {
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem(STORAGE_PREFIX + page);
      if (raw !== null) {
        const val = raw === 'NONE' ? null : raw;
        memoryCache.set(page, val);
        return val;
      }
    }
  } catch {
    // Ignore restricted sessionStorage contexts
  }
  return undefined;
}

function writeCached(page: string, url: string | null) {
  memoryCache.set(page, url);
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(STORAGE_PREFIX + page, url ?? 'NONE');
    }
  } catch {
    // Ignore storage quota errors
  }
}

async function flushBatch(batch: PendingRequest[]) {
  const uniquePages = Array.from(new Set(batch.map((item) => item.page)));
  const resolvedByPage = new Map<string, string | null>();

  try {
    const res = await fetch(buildWikiBatchUrl(uniquePages));
    if (res.ok) {
      const data = (await res.json()) as {
        query?: {
          normalized?: { from: string; to: string }[];
          redirects?: { from: string; to: string }[];
          pages?: Record<string, { title?: string; thumbnail?: { source?: string } }>;
        };
      };

      const norm = new Map<string, string>();
      for (const n of data.query?.normalized ?? []) norm.set(n.from, n.to);

      const redir = new Map<string, string>();
      for (const r of data.query?.redirects ?? []) redir.set(r.from, r.to);

      const thumbByTitle = new Map<string, string | null>();
      for (const p of Object.values(data.query?.pages ?? {})) {
        if (p.title) {
          thumbByTitle.set(p.title, p.thumbnail?.source ?? null);
        }
      }

      for (const orig of uniquePages) {
        let cur = norm.get(orig) ?? orig.replace(/_/g, ' ');
        if (redir.has(cur)) cur = redir.get(cur)!;
        const url = thumbByTitle.get(cur) ?? null;
        resolvedByPage.set(orig, url);
        writeCached(orig, url);
      }
    }
  } catch {
    // Fall back gracefully when offline or rate-limited
  }

  for (const item of batch) {
    const val = resolvedByPage.get(item.page) ?? null;
    if (!resolvedByPage.has(item.page)) {
      memoryCache.set(item.page, null);
    }
    item.resolve(val);
  }
}

function scheduleFlush() {
  if (flushTimer !== null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    const queue = pendingQueue;
    pendingQueue = [];
    for (let i = 0; i < queue.length; i += 40) {
      void flushBatch(queue.slice(i, i + 40));
    }
  }, 40);
}

export function fetchWikiThumbnail(page: string): Promise<string | null> {
  const clean = page.trim();
  if (!clean) return Promise.resolve(null);

  const cached = readCached(clean);
  if (cached !== undefined) {
    return Promise.resolve(cached);
  }

  const inflight = inflightMap.get(clean);
  if (inflight) return inflight;

  const promise = new Promise<string | null>((resolve) => {
    pendingQueue.push({
      page: clean,
      resolve: (url) => {
        inflightMap.delete(clean);
        resolve(url);
      },
    });
    scheduleFlush();
  });

  inflightMap.set(clean, promise);
  return promise;
}
