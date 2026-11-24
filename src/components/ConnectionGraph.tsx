import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Crosshair,
  ExternalLink,
  Network,
  Plus,
  RotateCcw,
  Search,
  Shrink,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { EntityRef } from '../data/index.ts';
import { buildUnifiedGraph, type GraphNode } from '../lib/graph.ts';
import {
  CORE_HUB_KEYS,
  collapseBranchMap,
  collectVisibleTree,
  computeExploreTreeLayout,
  getVisibleTreeEdges,
  pickNextNeighbors,
  shortenGraphLabel,
} from '../lib/graphTree.ts';

const CORE_HUB_SET = new Set<string>(CORE_HUB_KEYS);

const KIND_GROUPS: { kind: GraphNode['kind']; heading: string; badge: string }[] = [
  { kind: 'reality', heading: 'Realities & Timelines', badge: 'R' },
  { kind: 'title', heading: 'Films & Series', badge: 'F' },
  { kind: 'character', heading: 'Key Characters', badge: 'C' },
  { kind: 'thread', heading: 'Plot Threads', badge: 'T' },
];

export function ConnectionGraph({
  showTheories,
  focusKey,
  onClearFocusKey,
  onSelect,
}: {
  showTheories: boolean;
  focusKey: string | null;
  onClearFocusKey: () => void;
  onSelect: (ref: EntityRef) => void;
}) {
  const graph = useMemo(() => buildUnifiedGraph(showTheories), [showTheories]);

  const [roots, setRoots] = useState<string[]>(() =>
    focusKey ? [focusKey] : [...CORE_HUB_KEYS],
  );
  const [expandedChildren, setExpandedChildren] = useState<Map<string, string[]>>(() => {
    const map = new Map<string, string[]>();
    if (focusKey) {
      const { nextKeys } = pickNextNeighbors(graph, focusKey, new Set([focusKey]), 6);
      map.set(focusKey, nextKeys);
    }
    return map;
  });
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(focusKey);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpQuery, setJumpQuery] = useState('');

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  const resetCamera = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    if (focusKey && graph.nodes.has(focusKey)) {
      const { nextKeys } = pickNextNeighbors(graph, focusKey, new Set([focusKey]), 6);
      setRoots([focusKey]);
      setExpandedChildren(new Map([[focusKey, nextKeys]]));
      setSelectedNodeKey(focusKey);
      resetCamera();
    }
  }, [focusKey, graph]);

  const { visibleKeys } = useMemo(
    () => collectVisibleTree(roots, expandedChildren, graph),
    [roots, expandedChildren, graph],
  );

  const visibleNodes = useMemo(
    () =>
      Array.from(visibleKeys)
        .map((k) => graph.nodes.get(k))
        .filter((n): n is GraphNode => Boolean(n)),
    [visibleKeys, graph],
  );

  const visibleEdges = useMemo(
    () => getVisibleTreeEdges(graph, visibleKeys),
    [graph, visibleKeys],
  );

  const positioned = useMemo(
    () => computeExploreTreeLayout(roots, expandedChildren, graph),
    [roots, expandedChildren, graph],
  );

  const posMap = useMemo(
    () => new Map(positioned.map((p) => [p.node.key, p])),
    [positioned],
  );

  const hiddenCountByNode = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of visibleNodes) {
      counts.set(n.key, pickNextNeighbors(graph, n.key, visibleKeys, 1).totalRemaining);
    }
    return counts;
  }, [visibleNodes, visibleKeys, graph]);

  const activeHighlightKey = hoveredKey ?? selectedNodeKey;
  const connectedToActive = useMemo(() => {
    const set = new Set<string>();
    if (!activeHighlightKey) return set;
    set.add(activeHighlightKey);
    for (const e of visibleEdges) {
      if (e.fromKey === activeHighlightKey) set.add(e.toKey);
      if (e.toKey === activeHighlightKey) set.add(e.fromKey);
    }
    return set;
  }, [activeHighlightKey, visibleEdges]);

  const selectedNode = selectedNodeKey ? graph.nodes.get(selectedNodeKey) ?? null : null;
  const selectedIsExpanded = selectedNodeKey ? expandedChildren.has(selectedNodeKey) : false;
  const selectedHiddenCount = selectedNodeKey ? hiddenCountByNode.get(selectedNodeKey) ?? 0 : 0;

  const isDefaultCoreView =
    roots.length === CORE_HUB_KEYS.length &&
    CORE_HUB_KEYS.every((k, i) => roots[i] === k) &&
    expandedChildren.size === 0;

  const handleNodeClick = (nodeKey: string) => {
    setSelectedNodeKey(nodeKey);
    if (!expandedChildren.has(nodeKey)) {
      const { nextKeys } = pickNextNeighbors(graph, nodeKey, visibleKeys, 6);
      setExpandedChildren((prev) => {
        const next = new Map(prev);
        next.set(nodeKey, nextKeys);
        return next;
      });
    }
  };

  const handleExpandMore = (nodeKey: string) => {
    const { nextKeys } = pickNextNeighbors(graph, nodeKey, visibleKeys, 6);
    if (nextKeys.length === 0) return;
    setExpandedChildren((prev) => {
      const next = new Map(prev);
      const existing = next.get(nodeKey) ?? [];
      next.set(nodeKey, [...existing, ...nextKeys]);
      return next;
    });
  };

  const handleCollapseBranch = (nodeKey: string) => {
    setExpandedChildren((prev) => collapseBranchMap(roots, prev, nodeKey, graph));
  };

  const handleSoloFocus = (nodeKey: string) => {
    const { nextKeys } = pickNextNeighbors(graph, nodeKey, new Set([nodeKey]), 6);
    setRoots([nodeKey]);
    setExpandedChildren(new Map([[nodeKey, nextKeys]]));
    setSelectedNodeKey(nodeKey);
    setJumpOpen(false);
    setJumpQuery('');
    onClearFocusKey();
    resetCamera();
  };

  const handleResetToCoreHubs = () => {
    setRoots([...CORE_HUB_KEYS]);
    setExpandedChildren(new Map());
    setSelectedNodeKey(null);
    setHoveredKey(null);
    setJumpOpen(false);
    setJumpQuery('');
    onClearFocusKey();
    resetCamera();
  };

  const groupedJumpNodes = useMemo(() => {
    const q = jumpQuery.trim().toLowerCase();
    const all = Array.from(graph.nodes.values());
    return KIND_GROUPS.map((g) => ({
      ...g,
      items: all
        .filter((n) => n.kind === g.kind)
        .filter(
          (n) =>
            !q || n.label.toLowerCase().includes(q) || n.sublabel.toLowerCase().includes(q),
        )
        .sort((a, b) => a.label.localeCompare(b.label)),
    })).filter((g) => g.items.length > 0);
  }, [graph.nodes, jumpQuery]);

  return (
    <div className="space-y-4">
      <div className="tva-folder rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1d1610] flex items-center gap-2">
            <Network className="w-5 h-5 text-[#c2410c]" /> TemPad CRT Multiverse Scope
          </h1>
          <p className="text-xs text-[#61503e]">
            Showing {visibleNodes.length} active nodes &amp; {visibleEdges.length} links. Click any
            node with a <strong className="text-[#9a3412]">+N</strong> badge to branch outward.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Active Count Pill */}
          <span className="rounded border border-[#cbb895] bg-[#f4ebd9] px-2.5 py-1.5 text-xs font-mono-code text-[#3f3122]">
            {visibleNodes.length}/{graph.nodes.size} nodes active
          </span>

          {/* Searchable Grouped "Jump / Start From..." Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setJumpOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-mono-code border transition-colors ${
                jumpOpen
                  ? 'border-[#1d1610] bg-[#1d1610] text-[#f59e0b] font-bold'
                  : 'border-[#cbb895] bg-[#fffaf0] text-[#1d1610] hover:border-[#9a3412]'
              }`}
            >
              <Search className="w-3.5 h-3.5" /> Jump / Start From...
            </button>

            {jumpOpen && (
              <div
                className="absolute right-0 mt-1.5 w-80 max-w-[90vw] rounded-md border border-[#3c2d22] bg-[#1b1511] text-[#faf3e3] shadow-2xl z-40 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2 border-b border-[#3a2d22] flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <input
                    type="text"
                    value={jumpQuery}
                    onChange={(e) => setJumpQuery(e.target.value)}
                    placeholder="Filter reality, film, character, thread..."
                    autoFocus
                    className="w-full bg-transparent text-xs text-[#faf3e3] placeholder-[#8c7a62] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setJumpOpen(false);
                      setJumpQuery('');
                    }}
                    className="p-0.5 text-[#a89984] hover:text-amber-400"
                    aria-label="Close selector"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto p-1.5 space-y-2">
                  {groupedJumpNodes.length === 0 ? (
                    <p className="px-2 py-3 text-xs font-mono-code text-[#a89984] text-center">
                      No matching dossier nodes.
                    </p>
                  ) : (
                    groupedJumpNodes.map((group) => (
                      <div key={group.kind}>
                        <div className="px-2 py-1 text-[10px] font-mono-code uppercase tracking-widest text-amber-400/90 font-bold">
                          [{group.badge}] {group.heading} ({group.items.length})
                        </div>
                        <div className="space-y-0.5">
                          {group.items.map((n) => (
                            <button
                              key={n.key}
                              type="button"
                              onClick={() => handleSoloFocus(n.key)}
                              className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-[#2c2119] flex items-center justify-between gap-2 transition-colors"
                            >
                              <span className="truncate font-medium text-[#faf3e3]">{n.label}</span>
                              <span className="text-[10px] font-mono-code text-[#a89984] truncate max-w-[110px]">
                                {n.sublabel}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleResetToCoreHubs}
            disabled={isDefaultCoreView && !selectedNodeKey}
            className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-mono-code border transition-colors ${
              isDefaultCoreView && !selectedNodeKey
                ? 'border-[#d6c7aa] bg-[#f4ebd9] text-[#8f7c66] cursor-default'
                : 'border-[#1d1610] bg-[#1d1610] text-[#f59e0b] font-bold hover:bg-[#2c2219]'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to 6 Core Hubs
          </button>
        </div>
      </div>

      {/* Recessed Bakelite CRT Monitor Frame */}
      <div className="tva-crt-bezel rounded-xl p-3 sm:p-4 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono-code uppercase tracking-widest text-[#d4a44a] px-1">
          <span>MODEL TMP-77 // EXPLORE-AS-YOU-GO BRANCH SCOPE</span>
          <span>{selectedNode ? `LOCKED: ${shortenGraphLabel(selectedNode.label, 22)}` : 'SIGNAL: 6-HUB STANDBY'}</span>
        </div>

        <div className="relative tva-crt-screen rounded-lg overflow-hidden h-[540px] sm:h-[620px] select-none">
          <div className="tva-scanlines absolute inset-0 z-10 opacity-40" />

          <div
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => {
              setIsDragging(true);
              dragRef.current = {
                active: true,
                startX: e.clientX,
                startY: e.clientY,
                origX: pan.x,
                origY: pan.y,
              };
            }}
            onPointerMove={(e) => {
              if (!dragRef.current.active) return;
              setPan({
                x: dragRef.current.origX + (e.clientX - dragRef.current.startX),
                y: dragRef.current.origY + (e.clientY - dragRef.current.startY),
              });
            }}
            onPointerUp={() => {
              dragRef.current.active = false;
              setIsDragging(false);
            }}
            onPointerLeave={() => {
              dragRef.current.active = false;
              setIsDragging(false);
            }}
            onWheel={(e) => {
              e.preventDefault();
              setZoom((z) => Math.min(2.6, Math.max(0.45, z + (e.deltaY < 0 ? 0.12 : -0.12))));
            }}
          >
            <svg
              viewBox="0 0 1400 880"
              className="w-full h-full bg-[#0c0907]"
              onClick={() => {
                setSelectedNodeKey(null);
                setJumpOpen(false);
              }}
            >
              <defs>
                <pattern id="tva-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#241c15" strokeWidth="1" />
                </pattern>
                <filter id="crt-glow-amber" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="crt-glow-emerald" x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect width="1400" height="880" fill="url(#tva-grid)" />

              <g
                className={isDragging ? undefined : 'crt-camera'}
                style={{
                  transform: `translate(${700 + pan.x}px, ${440 + pan.y}px) scale(${zoom}) translate(-700px, -440px)`,
                }}
              >
                {visibleEdges.map((edge) => {
                  const a = posMap.get(edge.fromKey);
                  const b = posMap.get(edge.toKey);
                  if (!a || !b) return null;
                  const isDirectLink =
                    activeHighlightKey !== null &&
                    (edge.fromKey === activeHighlightKey || edge.toKey === activeHighlightKey);
                  const isFocused = !activeHighlightKey || isDirectLink;

                  const stroke = edge.isTheory
                    ? '#c084fc'
                    : edge.kind === 'incursion' || edge.kind === 'conflict'
                      ? '#f97316'
                      : edge.kind === 'variant'
                        ? '#38bdf8'
                        : '#f59e0b';

                  const midX = (a.x + b.x) / 2;
                  const midY = (a.y + b.y) / 2;
                  const labelW = Math.min(180, Math.max(64, edge.label.length * 6.4 + 14));

                  return (
                    <g
                      key={edge.id}
                      className="crt-edge-group"
                      opacity={isFocused ? (isDirectLink ? 0.96 : 0.72) : 0.14}
                    >
                      <line
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        stroke={stroke}
                        strokeWidth={isDirectLink ? 2.2 : 1.2}
                        strokeDasharray={edge.isTheory ? '5 4' : undefined}
                      />
                      {isDirectLink && (
                        <line
                          x1={a.x}
                          y1={a.y}
                          x2={b.x}
                          y2={b.y}
                          stroke="#fde68a"
                          strokeWidth={2.2}
                          strokeDasharray="6 10"
                          className="crt-signal-flow"
                          opacity={0.85}
                        />
                      )}
                      {isDirectLink && (
                        <g className="pointer-events-none">
                          <rect
                            x={midX - labelW / 2}
                            y={midY - 14}
                            width={labelW}
                            height="15"
                            rx="3"
                            fill="#0c0907"
                            fillOpacity="0.92"
                            stroke={stroke}
                            strokeOpacity="0.55"
                            strokeWidth="0.7"
                          />
                          <text
                            x={midX}
                            y={midY - 3.5}
                            textAnchor="middle"
                            fill="#fef3c7"
                            fontSize="9.5"
                            fontFamily="IBM Plex Mono, monospace"
                          >
                            {edge.label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {positioned.map(({ node, x, y }) => {
                  const isSelected = node.key === selectedNodeKey;
                  const isHovered = node.key === hoveredKey;
                  const isActive = isSelected || isHovered;
                  const isDimmed = activeHighlightKey !== null && !connectedToActive.has(node.key);
                  const isHubBeacon = CORE_HUB_SET.has(node.key) || roots.includes(node.key);
                  const isExpanded = expandedChildren.has(node.key);
                  const hiddenCount = hiddenCountByNode.get(node.key) ?? 0;

                  const radius =
                    node.key === 'title:avengers-doomsday' || node.key === 'character:doctor-doom'
                      ? 20
                      : node.kind === 'reality'
                        ? 16
                        : node.kind === 'thread'
                          ? 14
                          : 12;

                  const nodeColor = node.isTheory
                    ? '#c084fc'
                    : node.key === 'character:doctor-doom'
                      ? '#10b981'
                      : isExpanded
                        ? '#38bdf8'
                        : '#f59e0b';

                  const shortLabel = shortenGraphLabel(node.label);

                  return (
                    <g
                      key={node.key}
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                      opacity={isDimmed ? 0.2 : 1}
                      className={`crt-node cursor-pointer ${isActive ? 'crt-node-active' : ''}`}
                      onMouseEnter={() => setHoveredKey(node.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNodeClick(node.key);
                      }}
                    >
                      <g className="crt-node-inner">
                        {isHubBeacon && !isDimmed && (
                          <circle
                            r={radius}
                            fill="none"
                            stroke={nodeColor}
                            strokeWidth="1.6"
                            className="crt-beacon pointer-events-none"
                          />
                        )}
                        {isActive && (
                          <circle
                            r={radius + 6}
                            fill="none"
                            stroke={isSelected ? '#10b981' : '#fbbf24'}
                            strokeWidth="1.8"
                            strokeDasharray="4 3"
                            className="crt-reticle pointer-events-none"
                          />
                        )}
                        <circle
                          r={radius}
                          fill="#16120e"
                          stroke={isSelected ? '#10b981' : nodeColor}
                          strokeWidth={isActive ? 2.8 : 2}
                          filter={
                            isSelected
                              ? 'url(#crt-glow-emerald)'
                              : isActive || isHubBeacon
                                ? 'url(#crt-glow-amber)'
                                : undefined
                          }
                        />
                        <text
                          y={3}
                          textAnchor="middle"
                          fill={node.isTheory ? '#c084fc' : isSelected ? '#6ee7b7' : '#fbbf24'}
                          fontSize="9"
                          fontWeight="700"
                          fontFamily="IBM Plex Mono, monospace"
                          className="pointer-events-none"
                        >
                          {node.kind === 'character'
                            ? 'C'
                            : node.kind === 'title'
                              ? 'F'
                              : node.kind === 'reality'
                                ? 'R'
                                : 'T'}
                        </text>

                        {hiddenCount > 0 && !isDimmed && (
                          <g
                            transform={`translate(${radius + 4}, ${-radius + 2})`}
                            className="pointer-events-none"
                          >
                            <rect
                              x={-11}
                              y={-8}
                              width={hiddenCount >= 10 ? 26 : 21}
                              height="15"
                              rx="7.5"
                              fill="#f59e0b"
                              stroke="#120f0c"
                              strokeWidth="1.2"
                            />
                            <text
                              x={hiddenCount >= 10 ? 2 : -0.5}
                              y={2.8}
                              textAnchor="middle"
                              fill="#120f0c"
                              fontSize="8.5"
                              fontWeight="800"
                              fontFamily="IBM Plex Mono, monospace"
                            >
                              +{hiddenCount}
                            </text>
                          </g>
                        )}

                        <rect
                          x={-70}
                          y={radius + 5}
                          width="140"
                          height="17"
                          rx="3"
                          fill="#120f0c"
                          fillOpacity="0.92"
                          stroke={
                            isSelected
                              ? '#10b981'
                              : isHovered
                                ? '#f59e0b'
                                : isExpanded
                                  ? '#38bdf8'
                                  : '#3a2d22'
                          }
                          strokeWidth={isActive ? 1.2 : 0.8}
                        />
                        <text
                          y={radius + 17}
                          textAnchor="middle"
                          fill="#f3e8d2"
                          fontSize="10.5"
                          fontWeight={isActive ? '700' : '500'}
                          fontFamily="Inter, sans-serif"
                          className="pointer-events-none"
                        >
                          {shortLabel}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          <div className="absolute top-3 right-3 z-20 flex items-center gap-1 rounded border border-[#3a2d22] bg-[#14100d]/95 p-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.6, z + 0.25))}
              className="p-1.5 rounded hover:bg-[#2a2119] text-[#f3e8d2]"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.45, z - 0.25))}
              className="p-1.5 rounded hover:bg-[#2a2119] text-[#f3e8d2]"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={resetCamera}
              className="p-1.5 rounded hover:bg-[#2a2119] text-[#a89984] hover:text-[#f3e8d2]"
              title="Reset camera"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute top-3 left-3 z-20 flex flex-wrap gap-2 rounded border border-[#3a2d22] bg-[#14100d]/90 px-2.5 py-1.5 text-[10px] font-mono-code text-[#d6c5a3]">
            <span><strong className="text-amber-400">C</strong> Character</span>
            <span><strong className="text-amber-400">F</strong> Film/Show</span>
            <span><strong className="text-amber-400">R</strong> Reality</span>
            <span><strong className="text-amber-400">T</strong> Thread</span>
            <span><strong className="text-sky-400">●</strong> Expanded</span>
          </div>

        </div>

        {/* Bakelite Bezel Lock-On Telemetry Strip — never obscures CRT nodes */}
        <div className="rounded border border-[#3a2d22] bg-[#14100d]/95 px-3 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {selectedNode ? (
            <>
              <div className="min-w-0">
                <div className="text-[10px] font-mono-code uppercase text-amber-400">
                  {selectedNode.kind} locked · {selectedIsExpanded ? 'branch open' : 'unexpanded'}
                </div>
                <div className="text-sm font-bold text-[#f3e8d2] truncate">{selectedNode.label}</div>
                <div className="text-[11px] text-[#a89984] truncate">{selectedNode.sublabel}</div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {selectedHiddenCount > 0 && (
                  <button
                    type="button"
                    onClick={() => handleExpandMore(selectedNode.key)}
                    className="inline-flex items-center gap-1 rounded border border-amber-500 bg-amber-500/20 px-2.5 py-1.5 text-xs font-mono-code font-bold text-amber-300 hover:bg-amber-500 hover:text-black transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> More ({selectedHiddenCount})
                  </button>
                )}
                {selectedIsExpanded && (
                  <button
                    type="button"
                    onClick={() => handleCollapseBranch(selectedNode.key)}
                    className="inline-flex items-center gap-1 rounded border border-[#3a2d22] bg-[#211b16] px-2.5 py-1.5 text-xs font-mono-code text-[#f3e8d2] hover:border-amber-500 transition-colors"
                  >
                    <Shrink className="w-3.5 h-3.5" /> Collapse Branch
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSoloFocus(selectedNode.key)}
                  className="inline-flex items-center gap-1 rounded border border-[#3a2d22] bg-[#211b16] px-2.5 py-1.5 text-xs font-mono-code text-[#f3e8d2] hover:border-amber-500 transition-colors"
                >
                  <Crosshair className="w-3.5 h-3.5" /> Solo Focus
                </button>
                <button
                  type="button"
                  onClick={() => onSelect(selectedNode.ref)}
                  className="inline-flex items-center gap-1 rounded bg-emerald-500 px-2.5 py-1.5 text-xs font-mono-code font-bold text-black hover:bg-emerald-400 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Dossier
                </button>
              </div>
            </>
          ) : (
            <div className="text-xs font-mono-code text-[#a89984]">
              STANDBY // Click any CRT node with a <strong className="text-amber-400">+N</strong> badge to branch connections outward and inspect telemetry.
            </div>
          )}
        </div>
      </div>

      {/* Quick Index Strip for active nodes */}
      <div className="tva-folder rounded-md p-4 space-y-2">
        <div className="text-[11px] font-mono-code uppercase tracking-widest font-bold text-[#61503e]">
          Active Branch Nodes ({visibleNodes.length} on scope)
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
          {visibleNodes.map((n) => {
            const hidden = hiddenCountByNode.get(n.key) ?? 0;
            return (
              <button
                key={n.key}
                type="button"
                onClick={() => handleNodeClick(n.key)}
                className={`rounded border px-2 py-1 text-[11px] transition-colors inline-flex items-center gap-1 ${
                  selectedNodeKey === n.key
                    ? 'border-[#1d1610] bg-[#1d1610] text-[#f59e0b] font-semibold'
                    : 'border-[#cbb895] bg-[#fffaf0] text-[#61503e] hover:border-[#b45309] hover:text-[#1d1610]'
                }`}
              >
                <span>{n.label}</span>
                {hidden > 0 && (
                  <span className="text-[10px] font-mono-code text-[#b45309] font-bold">
                    +{hidden}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
