import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Crosshair,
  ExternalLink,
  Maximize2,
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
  CRT_ZOOM_MAX,
  CRT_ZOOM_MIN,
  collapseBranchMap,
  collectVisibleTree,
  computeExploreTreeLayout,
  computeFitCamera,
  getVisibleTreeEdges,
  nextWheelZoom,
  pickNextNeighbors,
  shortenGraphLabel,
} from '../lib/graphTree.ts';

const CORE_HUB_SET = new Set<string>(CORE_HUB_KEYS);

const RADAR_RINGS = [
  { r: 135, dashed: false, opacity: 0.2 },
  { r: 255, dashed: true, opacity: 0.16 },
  { r: 385, dashed: false, opacity: 0.14 },
  { r: 520, dashed: true, opacity: 0.11 },
] as const;

const RADAR_TICKS = Array.from({ length: 24 }, (_, i) => {
  const rad = ((i * 15 - 90) * Math.PI) / 180;
  const rInner = i % 2 === 0 ? 377 : 381;
  const rOuter = 390;
  return {
    x1: 700 + Math.cos(rad) * rInner,
    y1: 440 + Math.sin(rad) * rInner,
    x2: 700 + Math.cos(rad) * rOuter,
    y2: 440 + Math.sin(rad) * rOuter,
    major: i % 2 === 0,
  };
});

const CRT_SPARKS = [
  { x: 118, y: 128, r: 1.9, color: '#f59e0b', delay: '0s' },
  { x: 246, y: 94, r: 1.4, color: '#38bdf8', delay: '0.8s' },
  { x: 392, y: 164, r: 1.6, color: '#f59e0b', delay: '1.5s' },
  { x: 540, y: 88, r: 1.3, color: '#10b981', delay: '2.1s' },
  { x: 874, y: 98, r: 1.8, color: '#10b981', delay: '0.4s' },
  { x: 1036, y: 156, r: 1.5, color: '#f59e0b', delay: '1.9s' },
  { x: 1192, y: 112, r: 2.1, color: '#10b981', delay: '2.7s' },
  { x: 1296, y: 234, r: 1.4, color: '#f59e0b', delay: '1.1s' },
  { x: 108, y: 404, r: 1.5, color: '#38bdf8', delay: '2.4s' },
  { x: 184, y: 696, r: 2.2, color: '#38bdf8', delay: '0.6s' },
  { x: 320, y: 786, r: 1.4, color: '#f59e0b', delay: '1.7s' },
  { x: 518, y: 794, r: 1.7, color: '#f59e0b', delay: '3.1s' },
  { x: 912, y: 792, r: 1.6, color: '#10b981', delay: '0.9s' },
  { x: 1120, y: 768, r: 2.0, color: '#f59e0b', delay: '2.2s' },
  { x: 1264, y: 642, r: 1.5, color: '#10b981', delay: '1.3s' },
  { x: 1310, y: 446, r: 1.7, color: '#f59e0b', delay: '2.9s' },
] as const;

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
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [layoutRevision, setLayoutRevision] = useState(0);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpQuery, setJumpQuery] = useState('');

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const suppressClickRef = useRef(false);
  const dragRef = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  const resetCamera = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Native non-passive wheel listener so scrolling inside the CRT never scrolls the outer page
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setZoom((z) => nextWheelZoom(z, e.deltaY, e.deltaMode));
    };
    el.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => el.removeEventListener('wheel', onNativeWheel);
  }, []);

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

  useEffect(() => {
    if (layoutRevision === 0) return;
    const next = computeFitCamera(positioned);
    setZoom(next.zoom);
    setPan(next.pan);
  }, [layoutRevision]);

  const posMap = useMemo(
    () => new Map(positioned.map((p) => [p.node.key, p])),
    [positioned],
  );

  const activeEdge = useMemo(() => {
    if (hoveredEdgeId) {
      return visibleEdges.find((e) => e.id === hoveredEdgeId) ?? null;
    }
    if (selectedNodeKey && hoveredKey && hoveredKey !== selectedNodeKey) {
      return (
        visibleEdges.find(
          (e) =>
            (e.fromKey === selectedNodeKey && e.toKey === hoveredKey) ||
            (e.toKey === selectedNodeKey && e.fromKey === hoveredKey),
        ) ?? null
      );
    }
    return null;
  }, [hoveredEdgeId, selectedNodeKey, hoveredKey, visibleEdges]);

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
      if (nextKeys.length > 0) setLayoutRevision((n) => n + 1);
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
    setLayoutRevision((n) => n + 1);
  };

  const handleCollapseBranch = (nodeKey: string) => {
    setExpandedChildren((prev) => collapseBranchMap(roots, prev, nodeKey, graph));
    setLayoutRevision((n) => n + 1);
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
    <div className="space-y-2.5">
      <div className="tva-folder rounded-md px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-[#1d1610] flex items-center gap-2">
            <Network className="w-4 h-4 text-[#c2410c] shrink-0" /> TemPad CRT Multiverse Scope
          </h1>
          <p className="text-[11px] text-[#61503e]">
            {visibleNodes.length}/{graph.nodes.size} active nodes · {visibleEdges.length} links ·
            click <strong className="text-[#9a3412]">+N</strong> to expand
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Searchable Grouped "Jump / Start From..." Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setJumpOpen((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-mono-code border transition-colors ${
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
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    setJumpOpen(false);
                    setJumpQuery('');
                  }
                }}
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
            className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-mono-code border transition-colors ${
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
      <div className="tva-crt-bezel rounded-xl p-2.5 sm:p-3 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono-code uppercase tracking-widest text-[#d4a44a] px-1">
          <span>MODEL TMP-77 // EXPLORE-AS-YOU-GO BRANCH SCOPE</span>
          <span>{selectedNode ? `LOCKED: ${shortenGraphLabel(selectedNode.label, 22)}` : 'SIGNAL: 6-HUB STANDBY'}</span>
        </div>

        <div className="relative tva-crt-screen rounded-lg overflow-hidden h-[clamp(300px,calc(100vh-250px),580px)] select-none">
          <div className="tva-scanlines absolute inset-0 z-10 opacity-40" />
          <div className="tva-crt-vignette absolute inset-0 z-10" />

          <div
            ref={viewportRef}
            className="w-full h-full cursor-grab active:cursor-grabbing overscroll-contain touch-none"
            onPointerDown={(e) => {
              suppressClickRef.current = false;
              dragRef.current = {
                active: true,
                moved: false,
                startX: e.clientX,
                startY: e.clientY,
                origX: pan.x,
                origY: pan.y,
              };
            }}
            onPointerMove={(e) => {
              if (!dragRef.current.active) return;
              const dx = e.clientX - dragRef.current.startX;
              const dy = e.clientY - dragRef.current.startY;
              if (!dragRef.current.moved && Math.hypot(dx, dy) > 5) {
                dragRef.current.moved = true;
                suppressClickRef.current = true;
                setIsDragging(true);
                setHoveredKey(null);
                setHoveredEdgeId(null);
              }
              if (dragRef.current.moved) {
                setPan({
                  x: dragRef.current.origX + dx,
                  y: dragRef.current.origY + dy,
                });
              }
            }}
            onPointerUp={() => {
              dragRef.current.active = false;
              setIsDragging(false);
            }}
            onPointerCancel={() => {
              dragRef.current.active = false;
              setIsDragging(false);
            }}
            onPointerLeave={() => {
              dragRef.current.active = false;
              setIsDragging(false);
            }}
          >
            <svg
              viewBox="0 0 1400 880"
              className="w-full h-full bg-[#0c0907]"
              onClick={() => {
                if (suppressClickRef.current) {
                  suppressClickRef.current = false;
                  return;
                }
                setSelectedNodeKey(null);
                setJumpOpen(false);
              }}
            >
              <defs>
                <pattern id="tva-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#241c15" strokeWidth="1" />
                </pattern>
                <pattern id="tva-grid-major" width="160" height="160" patternUnits="userSpaceOnUse">
                  <path d="M 160 0 L 0 0 0 160" fill="none" stroke="#36281c" strokeWidth="1.2" strokeOpacity="0.45" />
                </pattern>
                <radialGradient id="crt-glow-bg-amber" cx="50%" cy="50%" r="54%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.14" />
                  <stop offset="52%" stopColor="#b45309" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#0c0907" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="crt-glow-bg-emerald" cx="76%" cy="24%" r="40%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#0c0907" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="crt-glow-bg-sky" cx="22%" cy="78%" r="42%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.075" />
                  <stop offset="100%" stopColor="#0c0907" stopOpacity="0" />
                </radialGradient>
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

              <g className="pointer-events-none">
                <rect width="1400" height="880" fill="url(#crt-glow-bg-amber)" />
                <rect width="1400" height="880" fill="url(#crt-glow-bg-emerald)" />
                <rect width="1400" height="880" fill="url(#crt-glow-bg-sky)" />
                <rect width="1400" height="880" fill="url(#tva-grid)" />
                <rect width="1400" height="880" fill="url(#tva-grid-major)" />

                {/* Yggdrasil Temporal Branch Curves */}
                <g fill="none" strokeLinecap="round">
                  <path
                    d="M 700 880 C 700 680, 680 560, 700 440 C 720 320, 685 180, 700 20"
                    stroke="#f59e0b"
                    strokeOpacity="0.14"
                    strokeWidth="2"
                  />
                  <path
                    d="M 700 650 C 560 590, 410 530, 120 390"
                    stroke="#f59e0b"
                    strokeOpacity="0.11"
                    strokeWidth="1.4"
                    strokeDasharray="8 6"
                  />
                  <path
                    d="M 700 590 C 860 540, 1020 480, 1290 360"
                    stroke="#10b981"
                    strokeOpacity="0.11"
                    strokeWidth="1.4"
                    strokeDasharray="6 6"
                  />
                  <path
                    d="M 700 470 C 540 380, 390 250, 160 110"
                    stroke="#38bdf8"
                    strokeOpacity="0.095"
                    strokeWidth="1.3"
                  />
                  <path
                    d="M 700 440 C 860 350, 1020 220, 1250 96"
                    stroke="#10b981"
                    strokeOpacity="0.12"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 700 720 C 570 760, 390 790, 140 820"
                    stroke="#f59e0b"
                    strokeOpacity="0.09"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M 700 720 C 850 755, 1040 785, 1280 815"
                    stroke="#f59e0b"
                    strokeOpacity="0.09"
                    strokeWidth="1.2"
                  />
                </g>

                {/* TVA Concentric Radar Range Rings & Degree Ticks */}
                <g>
                  {RADAR_RINGS.map((ring) => (
                    <circle
                      key={ring.r}
                      cx="700"
                      cy="440"
                      r={ring.r}
                      fill="none"
                      stroke="#f59e0b"
                      strokeOpacity={ring.opacity}
                      strokeWidth="1"
                      strokeDasharray={ring.dashed ? '4 6' : undefined}
                    />
                  ))}
                  <line x1="160" y1="440" x2="1240" y2="440" stroke="#f59e0b" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="3 8" />
                  <line x1="700" y1="48" x2="700" y2="832" stroke="#f59e0b" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="3 8" />

                  {RADAR_TICKS.map((t, idx) => (
                    <line
                      key={idx}
                      x1={t.x1}
                      y1={t.y1}
                      x2={t.x2}
                      y2={t.y2}
                      stroke="#f59e0b"
                      strokeOpacity={t.major ? 0.34 : 0.16}
                      strokeWidth={t.major ? 1.3 : 0.9}
                    />
                  ))}

                  <g fill="#f59e0b" fillOpacity="0.34" fontSize="9.5" fontFamily="IBM Plex Mono, monospace">
                    <text x="700" y="42" textAnchor="middle">000°</text>
                    <text x="1104" y="443" textAnchor="start">090°</text>
                    <text x="700" y="846" textAnchor="middle">180°</text>
                    <text x="296" y="443" textAnchor="end">270°</text>
                  </g>
                </g>

                {/* Ambient Temporal Sparks */}
                {CRT_SPARKS.map((s, idx) => (
                  <circle
                    key={idx}
                    cx={s.x}
                    cy={s.y}
                    r={s.r}
                    fill={s.color}
                    className="crt-spark"
                    style={{ animationDelay: s.delay }}
                  />
                ))}

                {/* Oscilloscope Corner L-Brackets */}
                <g stroke="#f59e0b" strokeOpacity="0.28" strokeWidth="1.4" fill="none">
                  <path d="M 22 44 L 22 22 L 44 22" />
                  <path d="M 1356 22 L 1378 22 L 1378 44" />
                  <path d="M 22 836 L 22 858 L 44 858" />
                  <path d="M 1356 858 L 1378 858 L 1378 836" />
                </g>
              </g>

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
                  const isEdgeActive = activeEdge?.id === edge.id;
                  const isDirectLink =
                    isEdgeActive ||
                    (activeHighlightKey !== null &&
                      (edge.fromKey === activeHighlightKey || edge.toKey === activeHighlightKey));
                  const isFocused = !activeHighlightKey || isDirectLink;

                  const stroke = edge.isTheory
                    ? '#c084fc'
                    : edge.kind === 'incursion' || edge.kind === 'conflict'
                      ? '#f97316'
                      : edge.kind === 'variant'
                        ? '#38bdf8'
                        : '#f59e0b';

                  return (
                    <g
                      key={edge.id}
                      className="crt-edge-group"
                      opacity={isEdgeActive ? 1 : isFocused ? (isDirectLink ? 0.94 : 0.36) : 0.14}
                    >
                      <line
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        stroke={stroke}
                        strokeWidth={isEdgeActive ? 2.8 : isDirectLink ? 2.1 : 1.2}
                        strokeDasharray={edge.isTheory ? '5 4' : undefined}
                      />
                      {isDirectLink && (
                        <line
                          x1={a.x}
                          y1={a.y}
                          x2={b.x}
                          y2={b.y}
                          stroke="#fde68a"
                          strokeWidth={isEdgeActive ? 2.6 : 2.1}
                          strokeDasharray="6 10"
                          className="crt-signal-flow"
                          opacity={0.85}
                        />
                      )}
                      {/* Invisible wider hit target so hovering a line reveals its single pill */}
                      <line
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        stroke="transparent"
                        strokeWidth={14}
                        className="cursor-pointer"
                        onMouseEnter={() => {
                          if (!dragRef.current.active) setHoveredEdgeId(edge.id);
                        }}
                        onMouseLeave={() => setHoveredEdgeId(null)}
                      />
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
                      role="button"
                      tabIndex={0}
                      aria-label={`${node.label} (${node.kind})`}
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                      opacity={isDimmed ? 0.2 : 1}
                      className={`crt-node cursor-pointer focus:outline-none ${isActive ? 'crt-node-active' : ''}`}
                      onMouseEnter={() => {
                        if (!dragRef.current.active) setHoveredKey(node.key);
                      }}
                      onMouseLeave={() => setHoveredKey(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleNodeClick(node.key);
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (suppressClickRef.current) {
                          suppressClickRef.current = false;
                          return;
                        }
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

                {activeEdge && (() => {
                  const a = posMap.get(activeEdge.fromKey);
                  const b = posMap.get(activeEdge.toKey);
                  if (!a || !b) return null;
                  const midX = (a.x + b.x) / 2;
                  const midY = (a.y + b.y) / 2;
                  const labelW = Math.min(230, Math.max(82, activeEdge.label.length * 6.5 + 18));
                  const pillStroke = activeEdge.isTheory
                    ? '#c084fc'
                    : activeEdge.kind === 'incursion' || activeEdge.kind === 'conflict'
                      ? '#f97316'
                      : activeEdge.kind === 'variant'
                        ? '#38bdf8'
                        : '#f59e0b';
                  return (
                    <g className="pointer-events-none">
                      <rect
                        x={midX - labelW / 2}
                        y={midY - 16}
                        width={labelW}
                        height="18"
                        rx="4"
                        fill="#0c0907"
                        fillOpacity="0.96"
                        stroke={pillStroke}
                        strokeOpacity="0.85"
                        strokeWidth="1"
                      />
                      <text
                        x={midX}
                        y={midY - 4}
                        textAnchor="middle"
                        fill="#fef3c7"
                        fontSize="10"
                        fontWeight="600"
                        fontFamily="IBM Plex Mono, monospace"
                      >
                        {activeEdge.label}
                      </text>
                    </g>
                  );
                })()}
              </g>
            </svg>
          </div>

          <div className="absolute top-3 right-3 z-20 flex items-center gap-1 rounded border border-[#3a2d22] bg-[#14100d]/95 p-1">
            <span className="px-1.5 text-[10px] font-mono-code font-semibold text-amber-300 tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(CRT_ZOOM_MAX, Number((z + 0.25).toFixed(4))))}
              className="p-1.5 rounded hover:bg-[#2a2119] text-[#f3e8d2]"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(CRT_ZOOM_MIN, Number((z - 0.25).toFixed(4))))}
              className="p-1.5 rounded hover:bg-[#2a2119] text-[#f3e8d2]"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const next = computeFitCamera(positioned);
                setZoom(next.zoom);
                setPan(next.pan);
              }}
              className="p-1.5 rounded hover:bg-[#2a2119] text-[#f3e8d2]"
              title="Fit all visible nodes"
            >
              <Maximize2 className="w-4 h-4" />
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

          <div className="hidden sm:flex absolute top-3 left-3 z-20 flex-wrap gap-2 rounded border border-[#3a2d22] bg-[#14100d]/90 px-2.5 py-1.5 text-[10px] font-mono-code text-[#d6c5a3]">
            <span><strong className="text-amber-400">C</strong> Character</span>
            <span><strong className="text-amber-400">F</strong> Film/Show</span>
            <span><strong className="text-amber-400">R</strong> Reality</span>
            <span><strong className="text-amber-400">T</strong> Thread</span>
            <span><strong className="text-sky-400">●</strong> Expanded</span>
          </div>

          <div className="pointer-events-none absolute bottom-3 left-3 z-20 hidden sm:flex items-center gap-2 rounded border border-[#3a2d22] bg-[#14100d]/85 px-2.5 py-1 text-[10px] font-mono-code text-[#a89984]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 tva-loom-pulse" />
            <span>TEMP-LOOM // E-616 · E-828 · E-10005</span>
            <span className="text-[#61503e]">·</span>
            <span className="text-[#d6c5a3]">Scroll to zoom · Drag to pan</span>
          </div>

          <div className="pointer-events-none absolute bottom-3 right-3 z-20 rounded border border-[#3a2d22] bg-[#14100d]/85 px-2.5 py-1 text-[10px] font-mono-code text-[#d6c5a3] tabular-nums">
            ZOOM {Math.round(zoom * 100)}% · PAN {Math.round(pan.x)},{Math.round(pan.y)} ·{' '}
            <span className={selectedNode ? 'text-emerald-400' : 'text-amber-400'}>
              {selectedNode ? 'TARGET LOCK' : 'SCANNING'}
            </span>
          </div>

        </div>

        <div className="flex sm:hidden flex-wrap gap-x-2.5 gap-y-1 rounded border border-[#2a2119] bg-[#14100d] px-2.5 py-1.5 text-[10px] font-mono-code text-[#d6c5a3]">
          <span><strong className="text-amber-400">C</strong> Character</span>
          <span><strong className="text-amber-400">F</strong> Film/Show</span>
          <span><strong className="text-amber-400">R</strong> Reality</span>
          <span><strong className="text-amber-400">T</strong> Thread</span>
          <span><strong className="text-sky-400">●</strong> Expanded</span>
        </div>

        {/* Bakelite Bezel Lock-On Telemetry Strip — never obscures CRT nodes */}
        <div className="rounded border border-[#3a2d22] bg-[#14100d]/95 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
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
