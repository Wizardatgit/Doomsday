const STORAGE_PREFIX = 'tva-wiki-img:v2:';
const WIKI_ENDPOINT = 'https://en.wikipedia.org/w/api.php';

export interface WikiImageMeta {
  url: string;
  width: number;
  height: number;
}

const memoryCache = new Map<string, WikiImageMeta | null>();
const inflightMap = new Map<string, Promise<WikiImageMeta | null>>();

interface PendingRequest {
  page: string;
  resolve: (meta: WikiImageMeta | null) => void;
}

let pendingQueue: PendingRequest[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function buildWikiBatchUrl(pages: string[], thumbSize = 800): string {
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

function readCached(page: string): WikiImageMeta | null | undefined {
  if (memoryCache.has(page)) return memoryCache.get(page);
  try {
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem(STORAGE_PREFIX + page);
      if (raw !== null) {
        if (raw === 'NONE') {
          memoryCache.set(page, null);
          return null;
        }
        const parsed = JSON.parse(raw) as Partial<WikiImageMeta>;
        if (parsed && typeof parsed.url === 'string') {
          const val: WikiImageMeta = {
            url: parsed.url,
            width: typeof parsed.width === 'number' ? parsed.width : 0,
            height: typeof parsed.height === 'number' ? parsed.height : 0,
          };
          memoryCache.set(page, val);
          return val;
        }
      }
    }
  } catch {
    // Ignore malformed or restricted sessionStorage entries
  }
  return undefined;
}

function writeCached(page: string, meta: WikiImageMeta | null) {
  memoryCache.set(page, meta);
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(STORAGE_PREFIX + page, meta ? JSON.stringify(meta) : 'NONE');
    }
  } catch {
    // Ignore storage quota errors
  }
}

async function flushBatch(batch: PendingRequest[]) {
  const uniquePages = Array.from(new Set(batch.map((item) => item.page)));
  const resolvedByPage = new Map<string, WikiImageMeta | null>();

  try {
    const res = await fetch(buildWikiBatchUrl(uniquePages));
    if (res.ok) {
      const data = (await res.json()) as {
        query?: {
          normalized?: { from: string; to: string }[];
          redirects?: { from: string; to: string }[];
          pages?: Record<
            string,
            {
              title?: string;
              thumbnail?: { source?: string; width?: number; height?: number };
            }
          >;
        };
      };

      const norm = new Map<string, string>();
      for (const n of data.query?.normalized ?? []) norm.set(n.from, n.to);

      const redir = new Map<string, string>();
      for (const r of data.query?.redirects ?? []) redir.set(r.from, r.to);

      const thumbByTitle = new Map<string, WikiImageMeta | null>();
      for (const p of Object.values(data.query?.pages ?? {})) {
        if (p.title) {
          const meta = p.thumbnail?.source
            ? {
                url: p.thumbnail.source,
                width: p.thumbnail.width ?? 0,
                height: p.thumbnail.height ?? 0,
              }
            : null;
          thumbByTitle.set(p.title, meta);
        }
      }

      for (const orig of uniquePages) {
        let cur = norm.get(orig) ?? orig.replace(/_/g, ' ');
        if (redir.has(cur)) cur = redir.get(cur)!;
        const meta = thumbByTitle.get(cur) ?? null;
        resolvedByPage.set(orig, meta);
        writeCached(orig, meta);
      }
    }
  } catch {
    // Fall back gracefully when offline or rate-limited
  }

  for (const item of batch) {
    // Only return resolved entries; skip caching null when batch request failed transiently
    item.resolve(resolvedByPage.get(item.page) ?? null);
  }
}

export function _resetWikiCacheForTests() {
  memoryCache.clear();
  inflightMap.clear();
  pendingQueue = [];
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
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

export function fetchWikiImageMeta(page: string): Promise<WikiImageMeta | null> {
  const clean = page.trim();
  if (!clean) return Promise.resolve(null);

  const cached = readCached(clean);
  if (cached !== undefined) {
    return Promise.resolve(cached);
  }

  const inflight = inflightMap.get(clean);
  if (inflight) return inflight;

  const promise = new Promise<WikiImageMeta | null>((resolve) => {
    pendingQueue.push({
      page: clean,
      resolve: (meta) => {
        inflightMap.delete(clean);
        resolve(meta);
      },
    });
    scheduleFlush();
  });

  inflightMap.set(clean, promise);
  return promise;
}

export async function fetchWikiThumbnail(page: string, minWidth = 0): Promise<string | null> {
  const meta = await fetchWikiImageMeta(page);
  if (!meta) return null;
  return meta.width >= minWidth ? meta.url : null;
}
