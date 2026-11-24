import type { GraphEdge, GraphNode, UnifiedGraph } from './graph.ts';

export const CORE_HUB_KEYS = [
  'title:avengers-doomsday',
  'character:doctor-doom',
  'reality:earth-616',
  'reality:earth-828',
  'reality:earth-10005',
  'reality:tva',
] as const;

export const GRAPH_BOUNDS = {
  minX: 90,
  maxX: 1310,
  minY: 75,
  maxY: 790,
  sepX: 152,
  sepY: 64,
} as const;

export interface TreePosition {
  node: GraphNode;
  x: number;
  y: number;
}

/** Strips trailing parenthetical annotations and truncates for compact CRT pills. */
export function shortenGraphLabel(label: string, maxLen = 19): string {
  const stripped = label.replace(/(\s*\([^)]*\))+$/g, '').trim() || label;
  if (stripped.length <= maxLen) return stripped;
  return `${stripped.slice(0, maxLen - 1)}…`;
}

/** Returns ranked direct neighbor keys from `graph` not yet in `excludeKeys`. */
export function pickNextNeighbors(
  graph: UnifiedGraph,
  parentKey: string,
  excludeKeys: Set<string>,
  limit = 6,
): { nextKeys: string[]; totalRemaining: number } {
  const adj = graph.adjacency.get(parentKey) ?? [];
  const candidates: string[] = [];
  const seen = new Set<string>();

  for (const item of adj) {
    if (item.neighborKey === parentKey) continue;
    if (excludeKeys.has(item.neighborKey) || seen.has(item.neighborKey)) continue;
    seen.add(item.neighborKey);
    candidates.push(item.neighborKey);
  }

  return {
    nextKeys: candidates.slice(0, limit),
    totalRemaining: candidates.length,
  };
}

/** Computes visible keys and parent->child tree ordering from roots and expanded branches. */
export function collectVisibleTree(
  roots: readonly string[],
  expandedChildren: ReadonlyMap<string, readonly string[]>,
  graph: UnifiedGraph,
): {
  visibleKeys: Set<string>;
  orderedParentPairs: { parentKey: string; childKey: string }[];
} {
  const visibleKeys = new Set<string>();
  const orderedParentPairs: { parentKey: string; childKey: string }[] = [];
  const queue: string[] = [];

  for (const r of roots) {
    if (graph.nodes.has(r) && !visibleKeys.has(r)) {
      visibleKeys.add(r);
      queue.push(r);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const parent = queue[head++]!;
    const children = expandedChildren.get(parent);
    if (!children) continue;
    for (const child of children) {
      if (!graph.nodes.has(child) || visibleKeys.has(child)) continue;
      visibleKeys.add(child);
      orderedParentPairs.push({ parentKey: parent, childKey: child });
      queue.push(child);
    }
  }

  return { visibleKeys, orderedParentPairs };
}

/** Removes a parent branch and recursively prunes any orphaned descendants not anchored elsewhere. */
export function collapseBranchMap(
  roots: readonly string[],
  expandedChildren: ReadonlyMap<string, readonly string[]>,
  parentKey: string,
  graph: UnifiedGraph,
): Map<string, string[]> {
  const next = new Map<string, string[]>();
  for (const [k, v] of expandedChildren.entries()) {
    if (k !== parentKey) next.set(k, [...v]);
  }
  // Drop expansion entries for nodes that are no longer reachable from roots
  const { visibleKeys } = collectVisibleTree(roots, next, graph);
  for (const k of Array.from(next.keys())) {
    if (!visibleKeys.has(k)) next.delete(k);
  }
  return next;
}

/** Deterministic outward tree placement plus 20-iteration box separation within canvas bounds. */
export function computeExploreTreeLayout(
  roots: readonly string[],
  expandedChildren: ReadonlyMap<string, readonly string[]>,
  graph: UnifiedGraph,
): TreePosition[] {
  const cx = 700;
  const cy = 435;
  const { visibleKeys } = collectVisibleTree(roots, expandedChildren, graph);
  const posByKey = new Map<string, { x: number; y: number; isRoot: boolean }>();

  const validRoots = roots.filter((r) => visibleKeys.has(r));
  validRoots.forEach((rootKey, i) => {
    if (validRoots.length === 1) {
      posByKey.set(rootKey, { x: cx, y: cy, isRoot: true });
      return;
    }
    const angle = (i / validRoots.length) * Math.PI * 2 - Math.PI / 2;
    const rx = validRoots.length <= 4 ? 220 : 265;
    const ry = validRoots.length <= 4 ? 150 : 175;
    posByKey.set(rootKey, {
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry,
      isRoot: true,
    });
  });

  // BFS fan-out placement from each root outward away from canvas center
  const bfsQueue = [...validRoots];
  let idx = 0;
  while (idx < bfsQueue.length) {
    const parentKey = bfsQueue[idx++]!;
    const parentPos = posByKey.get(parentKey);
    if (!parentPos) continue;
    const rawChildren = (expandedChildren.get(parentKey) ?? []).filter(
      (c) => visibleKeys.has(c) && !posByKey.has(c),
    );
    if (rawChildren.length === 0) continue;

    const dxCenter = parentPos.x - cx;
    const dyCenter = parentPos.y - cy;
    const distFromCenter = Math.hypot(dxCenter, dyCenter);
    const outAngle = distFromCenter < 55 ? -Math.PI / 2 : Math.atan2(dyCenter, dxCenter);
    const fullCircle = distFromCenter < 55;

    rawChildren.forEach((childKey, cIdx) => {
      const ring = Math.floor(cIdx / 6);
      const inRingIdx = cIdx % 6;
      const inRingCount = Math.min(6, rawChildren.length - ring * 6);
      const radius = (fullCircle ? 210 : 185) + ring * 105;

      let angle: number;
      if (fullCircle) {
        angle = outAngle + (inRingIdx / Math.max(1, inRingCount)) * Math.PI * 2 + ring * 0.35;
      } else {
        const arc = inRingCount <= 2 ? Math.PI * 0.45 : Math.PI * 0.78;
        const frac = inRingCount === 1 ? 0 : inRingIdx / (inRingCount - 1) - 0.5;
        angle = outAngle + frac * arc + ring * 0.12;
      }

      posByKey.set(childKey, {
        x: parentPos.x + Math.cos(angle) * radius * 1.15,
        y: parentPos.y + Math.sin(angle) * radius * 0.9,
        isRoot: false,
      });
      bfsQueue.push(childKey);
    });
  }

  const clampNode = (p: { x: number; y: number }) => {
    p.x = Math.min(GRAPH_BOUNDS.maxX, Math.max(GRAPH_BOUNDS.minX, p.x));
    p.y = Math.min(GRAPH_BOUNDS.maxY, Math.max(GRAPH_BOUNDS.minY, p.y));
  };

  const ordered = Array.from(posByKey.entries()).map(([key, pos]) => {
    clampNode(pos);
    return { key, pos };
  });

  // 20-iteration deterministic minimum-box separation pass (152px X, 64px Y)
  for (let iter = 0; iter < 20; iter++) {
    for (let i = 0; i < ordered.length; i++) {
      for (let j = i + 1; j < ordered.length; j++) {
        const a = ordered[i]!.pos;
        const b = ordered[j]!.pos;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const overlapX = GRAPH_BOUNDS.sepX - Math.abs(dx);
        const overlapY = GRAPH_BOUNDS.sepY - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          if (overlapX / GRAPH_BOUNDS.sepX < overlapY / GRAPH_BOUNDS.sepY) {
            const dir = dx === 0 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dx);
            const push = overlapX * 0.52;
            a.x -= dir * push;
            b.x += dir * push;
          } else {
            const dir = dy === 0 ? (j % 2 === 0 ? 1 : -1) : Math.sign(dy);
            const push = overlapY * 0.52;
            a.y -= dir * push;
            b.y += dir * push;
          }
          clampNode(a);
          clampNode(b);
        }
      }
    }
  }

  return ordered
    .map(({ key, pos }) => {
      const node = graph.nodes.get(key);
      return node ? { node, x: pos.x, y: pos.y } : null;
    })
    .filter((item): item is TreePosition => item !== null);
}

/** Filters graph edges to connections where both endpoints are active on screen. */
export function getVisibleTreeEdges(
  graph: UnifiedGraph,
  visibleKeys: Set<string>,
): GraphEdge[] {
  return graph.edges.filter((e) => visibleKeys.has(e.fromKey) && visibleKeys.has(e.toKey));
}
