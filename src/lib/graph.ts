import {
  CHARACTERS,
  CURATED_CONNECTIONS,
  REALITIES,
  THREADS,
  TITLES,
  entityKey,
  factionsById,
  realitiesById,
  titlesById,
} from '../data/index.ts';
import type { EntityRef } from '../data/index.ts';

export type GraphNodeKind = 'character' | 'title' | 'reality' | 'thread';

export interface GraphNode {
  key: string;
  ref: EntityRef;
  kind: GraphNodeKind;
  label: string;
  sublabel: string;
  color: string;
  factionId?: string;
  realityId?: string;
  era?: string;
  importance?: string;
  doomsdayStatus?: string;
  isTheory?: boolean;
  titleIds: string[];
}

export interface GraphEdge {
  id: string;
  fromKey: string;
  toKey: string;
  label: string;
  kind: string;
  priority: number; // lower = preferred when shortest-path ties occur
  titleId?: string;
  isTheory?: boolean;
}

export interface UnifiedGraph {
  nodes: Map<string, GraphNode>;
  edges: GraphEdge[];
  adjacency: Map<string, { neighborKey: string; edge: GraphEdge }[]>;
}

export interface PathStep {
  node: GraphNode;
  edgeFromPrev: GraphEdge | null;
}

export function buildUnifiedGraph(showTheories: boolean): UnifiedGraph {
  const nodes = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();

  const addNode = (node: GraphNode) => {
    if (!showTheories && node.isTheory) return;
    nodes.set(node.key, node);
  };

  for (const r of REALITIES) {
    addNode({
      key: entityKey({ kind: 'reality', id: r.id }),
      ref: { kind: 'reality', id: r.id },
      kind: 'reality',
      label: r.code,
      sublabel: r.name,
      color: r.color,
      realityId: r.id,
      isTheory: r.isTheory,
      titleIds: [],
    });
  }

  for (const t of TITLES) {
    const r = realitiesById.get(t.realityId);
    addNode({
      key: entityKey({ kind: 'title', id: t.id }),
      ref: { kind: 'title', id: t.id },
      kind: 'title',
      label: t.title,
      sublabel: `${t.year} · ${t.eraLabel}`,
      color: r?.color ?? '#f59e0b',
      realityId: t.realityId,
      era: t.era,
      importance: t.importance,
      titleIds: [t.id],
    });
  }

  for (const c of CHARACTERS) {
    const f = factionsById.get(c.factionId);
    addNode({
      key: entityKey({ kind: 'character', id: c.id }),
      ref: { kind: 'character', id: c.id },
      kind: 'character',
      label: c.alias && c.alias !== c.name && c.name.length < 18 ? `${c.name}` : c.name,
      sublabel: `${c.alias} · ${c.actor}`,
      color: f?.color ?? '#f59e0b',
      factionId: c.factionId,
      realityId: c.currentRealityId,
      doomsdayStatus: c.doomsdayStatus,
      isTheory: c.isTheory,
      titleIds: Array.from(new Set([c.firstAppearanceTitleId, c.lastSeenTitleId, ...c.journey.map((j) => j.titleId)])),
    });
  }

  for (const th of THREADS) {
    addNode({
      key: entityKey({ kind: 'thread', id: th.id }),
      ref: { kind: 'thread', id: th.id },
      kind: 'thread',
      label: th.title,
      sublabel: `${th.category.toUpperCase()} · ${th.status}`,
      color: th.isTheory ? '#c084fc' : '#ea580c',
      isTheory: th.isTheory,
      titleIds: th.keyTitleIds,
    });
  }

  const addEdge = (edge: GraphEdge) => {
    if (!showTheories && edge.isTheory) return;
    if (!nodes.has(edge.fromKey) || !nodes.has(edge.toKey)) return;
    if (edge.fromKey === edge.toKey) return;
    const pairKey =
      edge.fromKey < edge.toKey
        ? `${edge.fromKey}::${edge.toKey}::${edge.kind}`
        : `${edge.toKey}::${edge.fromKey}::${edge.kind}`;
    const existing = edgeMap.get(pairKey);
    if (!existing || edge.priority < existing.priority) {
      edgeMap.set(pairKey, edge);
    }
  };

  // Curated narrative edges (highest priority for readable stories)
  for (const conn of CURATED_CONNECTIONS) {
    addEdge({
      id: conn.id,
      fromKey: entityKey(conn.from),
      toKey: entityKey(conn.to),
      label: conn.label,
      kind: conn.kind,
      priority: 1,
      titleId: conn.titleId,
      isTheory: conn.isTheory,
    });
  }

  // Title -> Key characters & post-credits payoffs
  for (const t of TITLES) {
    const tKey = entityKey({ kind: 'title', id: t.id });
    for (const cId of t.keyCharacterIds) {
      addEdge({
        id: `auto-tc-${t.id}-${cId}`,
        fromKey: tKey,
        toKey: entityKey({ kind: 'character', id: cId }),
        label: t.id === 'avengers-doomsday' ? 'Doomsday roster' : `Appears in ${t.title}`,
        kind: t.id === 'avengers-doomsday' ? 'setup' : 'appearance',
        priority: 2,
        titleId: t.id,
      });
    }
    if (t.postCredits) {
      for (const pc of t.postCredits) {
        if (pc.leadsToTitleId) {
          addEdge({
            id: `auto-pc-title-${t.id}-${pc.leadsToTitleId}`,
            fromKey: tKey,
            toKey: entityKey({ kind: 'title', id: pc.leadsToTitleId }),
            label: `${pc.label} leads into`,
            kind: 'setup',
            priority: 1,
            titleId: t.id,
          });
        }
        if (pc.threadId) {
          addEdge({
            id: `auto-pc-thread-${t.id}-${pc.threadId}`,
            fromKey: tKey,
            toKey: entityKey({ kind: 'thread', id: pc.threadId }),
            label: `${pc.label} sparks`,
            kind: 'setup',
            priority: 2,
            titleId: t.id,
          });
        }
      }
    }
    addEdge({
      id: `auto-tr-${t.id}-${t.realityId}`,
      fromKey: tKey,
      toKey: entityKey({ kind: 'reality', id: t.realityId }),
      label: 'Set in reality',
      kind: 'reality',
      priority: 5,
      titleId: t.id,
    });
  }

  // Character -> Journey & Realities
  for (const c of CHARACTERS) {
    const cKey = entityKey({ kind: 'character', id: c.id });
    addEdge({
      id: `auto-cr-origin-${c.id}-${c.originRealityId}`,
      fromKey: cKey,
      toKey: entityKey({ kind: 'reality', id: c.originRealityId }),
      label: 'Origin reality',
      kind: 'origin',
      priority: 4,
    });
    if (c.currentRealityId !== c.originRealityId) {
      addEdge({
        id: `auto-cr-curr-${c.id}-${c.currentRealityId}`,
        fromKey: cKey,
        toKey: entityKey({ kind: 'reality', id: c.currentRealityId }),
        label: 'Crossed into reality',
        kind: 'incursion',
        priority: 2,
      });
    }
    for (const j of c.journey) {
      addEdge({
        id: `auto-cj-${c.id}-${j.titleId}`,
        fromKey: cKey,
        toKey: entityKey({ kind: 'title', id: j.titleId }),
        label: titlesById.get(j.titleId)?.id === 'avengers-doomsday' ? 'Confirmed for Doomsday' : 'Key chapter',
        kind: 'appearance',
        priority: 2,
        titleId: j.titleId,
        isTheory: j.isTheory,
      });
    }
  }

  // Thread -> Characters, Titles, Realities
  for (const th of THREADS) {
    const thKey = entityKey({ kind: 'thread', id: th.id });
    for (const cId of th.characterIds) {
      addEdge({
        id: `auto-thc-${th.id}-${cId}`,
        fromKey: thKey,
        toKey: entityKey({ kind: 'character', id: cId }),
        label: 'Thread player',
        kind: th.isTheory ? 'theory' : 'setup',
        priority: 3,
        isTheory: th.isTheory,
      });
    }
    for (const tId of th.keyTitleIds) {
      addEdge({
        id: `auto-tht-${th.id}-${tId}`,
        fromKey: thKey,
        toKey: entityKey({ kind: 'title', id: tId }),
        label: 'Thread chapter',
        kind: th.isTheory ? 'theory' : 'setup',
        priority: 3,
        titleId: tId,
        isTheory: th.isTheory,
      });
    }
    for (const rId of th.realityIds) {
      addEdge({
        id: `auto-thr-${th.id}-${rId}`,
        fromKey: thKey,
        toKey: entityKey({ kind: 'reality', id: rId }),
        label: 'Impacts reality',
        kind: th.isTheory ? 'theory' : 'incursion',
        priority: 4,
        isTheory: th.isTheory,
      });
    }
  }

  const edges = Array.from(edgeMap.values());
  const adjacency = new Map<string, { neighborKey: string; edge: GraphEdge }[]>();

  for (const key of nodes.keys()) {
    adjacency.set(key, []);
  }
  for (const edge of edges) {
    adjacency.get(edge.fromKey)?.push({ neighborKey: edge.toKey, edge });
    adjacency.get(edge.toKey)?.push({ neighborKey: edge.fromKey, edge });
  }
  for (const list of adjacency.values()) {
    list.sort((a, b) => a.edge.priority - b.edge.priority || a.neighborKey.localeCompare(b.neighborKey));
  }

  return { nodes, edges, adjacency };
}

export function getNeighborhood(
  graph: UnifiedGraph,
  centerKey: string,
  hops: 1 | 2,
): { nodeKeys: Set<string>; edges: GraphEdge[] } {
  const visited = new Set<string>();
  if (!graph.nodes.has(centerKey)) {
    return { nodeKeys: visited, edges: [] };
  }
  visited.add(centerKey);
  let frontier = [centerKey];
  for (let depth = 0; depth < hops; depth++) {
    const next: string[] = [];
    for (const key of frontier) {
      for (const link of graph.adjacency.get(key) ?? []) {
        if (!visited.has(link.neighborKey)) {
          visited.add(link.neighborKey);
          next.push(link.neighborKey);
        }
      }
    }
    frontier = next;
  }

  const edges = graph.edges.filter((e) => visited.has(e.fromKey) && visited.has(e.toKey));
  return { nodeKeys: visited, edges };
}

export function findShortestPath(
  graph: UnifiedGraph,
  fromKey: string,
  toKey: string,
): PathStep[] | null {
  if (!graph.nodes.has(fromKey) || !graph.nodes.has(toKey)) {
    return null;
  }
  if (fromKey === toKey) {
    return [{ node: graph.nodes.get(fromKey)!, edgeFromPrev: null }];
  }

  const dist = new Map<string, number>();
  const cost = new Map<string, number>();
  const prev = new Map<string, { parentKey: string; edge: GraphEdge }>();
  const queue: string[] = [fromKey];

  dist.set(fromKey, 0);
  cost.set(fromKey, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentDist = dist.get(current)!;
    const currentCost = cost.get(current)!;

    const targetDist = dist.get(toKey);
    if (targetDist !== undefined && currentDist >= targetDist) {
      continue;
    }

    for (const { neighborKey, edge } of graph.adjacency.get(current) ?? []) {
      const nextDist = currentDist + 1;
      const nextCost = currentCost + edge.priority;
      const knownDist = dist.get(neighborKey);
      const knownCost = cost.get(neighborKey);

      if (knownDist === undefined) {
        dist.set(neighborKey, nextDist);
        cost.set(neighborKey, nextCost);
        prev.set(neighborKey, { parentKey: current, edge });
        queue.push(neighborKey);
      } else if (nextDist === knownDist && (knownCost === undefined || nextCost < knownCost)) {
        cost.set(neighborKey, nextCost);
        prev.set(neighborKey, { parentKey: current, edge });
      }
    }
  }

  if (!prev.has(toKey)) return null;

  const steps: PathStep[] = [];
  let cursor: string | undefined = toKey;
  while (cursor) {
    const node = graph.nodes.get(cursor)!;
    const link = prev.get(cursor);
    steps.push({ node, edgeFromPrev: link?.edge ?? null });
    cursor = link?.parentKey;
  }
  steps.reverse();
  return steps;
}
