import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Crosshair,
  ExternalLink,
  Maximize2,
  Network,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { EntityRef } from '../data/index.ts';
import { FACTIONS, REALITIES } from '../data/index.ts';
import {
  buildUnifiedGraph,
  getNeighborhood,
  type GraphEdge,
  type GraphNode,
} from '../lib/graph.ts';

type GraphPreset =
  | 'convergence'
  | 'by-reality'
  | 'by-faction'
  | 'phase-5-6'
  | 'legacy-bridges'
  | 'all';

const CONVERGENCE_NODE_KEYS = new Set([
  'title:avengers-doomsday',
  'character:doctor-doom',
  'character:tony-stark',
  'character:steve-rogers',
  'character:peggy-carter',
  'character:sam-wilson',
  'character:thor',
  'character:shang-chi',
  'character:scott-lang',
  'character:kate-bishop',
  'character:yelena-belova',
  'character:bucky-barnes',
  'character:sentry',
  'character:reed-richards',
  'character:sue-storm',
  'character:johnny-storm',
  'character:ben-grimm',
  'character:franklin-richards',
  'character:professor-x',
  'character:magneto',
  'character:cyclops',
  'character:beast',
  'character:gambit',
  'character:shuri',
  'character:namor',
  'character:loki',
  'character:monica-rambeau',
  'character:peter-parker-616',
  'character:deadpool',
  'character:wolverine',
  'title:thunderbolts',
  'title:fantastic-four-first-steps',
  'title:the-marvels',
  'title:deadpool-wolverine',
  'title:loki-s2',
  'title:spider-man-brand-new-day',
  'reality:earth-616',
  'reality:earth-828',
  'reality:earth-10005',
  'thread:thread-doom-franklin',
  'thread:thread-f4-breach',
  'thread:thread-loki-world-tree',
  'thread:thread-theory-stark-face',
]);

interface PositionedNode {
  node: GraphNode;
  x: number;
  y: number;
}

function computeLayout(
  nodes: GraphNode[],
  preset: GraphPreset,
  focusCenterKey: string | null,
  focusHops: 1 | 2 | null,
  graphAdjacency: Map<string, { neighborKey: string; edge: GraphEdge }[]>,
): PositionedNode[] {
  const cx = 700;
  const cy = 440;

  if (focusCenterKey && focusHops) {
    const center = nodes.find((n) => n.key === focusCenterKey);
    if (center) {
      const result: PositionedNode[] = [{ node: center, x: cx, y: cy }];
      const hop1Keys = new Set(
        (graphAdjacency.get(focusCenterKey) ?? []).map((x) => x.neighborKey),
      );
      const ring1 = nodes.filter((n) => n.key !== focusCenterKey && hop1Keys.has(n.key));
      const ring2 = nodes.filter((n) => n.key !== focusCenterKey && !hop1Keys.has(n.key));

      ring1.forEach((n, i) => {
        const angle = (i / Math.max(1, ring1.length)) * Math.PI * 2 - Math.PI / 2;
        const r = ring1.length > 14 ? 255 : 215;
        result.push({ node: n, x: cx + Math.cos(angle) * r * 1.18, y: cy + Math.sin(angle) * r * 0.92 });
      });

      ring2.forEach((n, i) => {
        const angle = (i / Math.max(1, ring2.length)) * Math.PI * 2 - Math.PI / 2;
        const r = 415;
        result.push({ node: n, x: cx + Math.cos(angle) * r * 1.28, y: cy + Math.sin(angle) * r * 0.9 });
      });
      return result;
    }
  }

  const clusterOrder =
    preset === 'by-reality'
      ? REALITIES.map((r) => r.id)
      : FACTIONS.map((f) => f.id);

  const buckets = new Map<string, GraphNode[]>();
  const pinnedCenter: GraphNode[] = [];

  for (const n of nodes) {
    if (n.key === 'title:avengers-doomsday' || n.key === 'character:doctor-doom') {
      pinnedCenter.push(n);
      continue;
    }
    const groupKey =
      preset === 'by-reality'
        ? n.realityId ?? 'other'
        : n.factionId ?? n.realityId ?? n.kind;
    if (!buckets.has(groupKey)) buckets.set(groupKey, []);
    buckets.get(groupKey)!.push(n);
  }

  const result: PositionedNode[] = [];
  pinnedCenter.forEach((n) => {
    if (n.key === 'title:avengers-doomsday') result.push({ node: n, x: cx, y: cy + 35 });
    else result.push({ node: n, x: cx, y: cy - 65 });
  });

  const groupKeys = Array.from(buckets.keys()).sort((a, b) => {
    const ia = clusterOrder.indexOf(a);
    const ib = clusterOrder.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  groupKeys.forEach((gKey, gIdx) => {
    const items = buckets.get(gKey)!;
    const sectorAngle = (gIdx / Math.max(1, groupKeys.length)) * Math.PI * 2 - Math.PI / 2;
    const baseRx = nodes.length > 70 ? 450 : 370;
    const baseRy = nodes.length > 70 ? 295 : 250;
    const anchorX = cx + Math.cos(sectorAngle) * baseRx;
    const anchorY = cy + Math.sin(sectorAngle) * baseRy;

    items.forEach((item, idx) => {
      const localRing = Math.floor(idx / 6);
      const posInRing = idx % 6;
      const localCount = Math.min(6, items.length - localRing * 6);
      const angle = (posInRing / Math.max(1, localCount)) * Math.PI * 2 + gIdx * 0.4;
      const spread = items.length === 1 ? 0 : 58 + localRing * 54;
      result.push({
        node: item,
        x: anchorX + Math.cos(angle) * spread * 1.15,
        y: anchorY + Math.sin(angle) * spread * 0.85,
      });
    });
  });

  return result;
}

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
  const [preset, setPreset] = useState<GraphPreset>('convergence');
  const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(focusKey);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [focusHops, setFocusHops] = useState<1 | 2 | null>(focusKey ? 1 : null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; origX: number; origY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  useEffect(() => {
    if (focusKey && graph.nodes.has(focusKey)) {
      setSelectedNodeKey(focusKey);
      setFocusHops(1);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [focusKey, graph]);

  const { visibleNodes, visibleEdges } = useMemo(() => {
    let candidateKeys: Set<string>;

    if (selectedNodeKey && focusHops && graph.nodes.has(selectedNodeKey)) {
      const hood = getNeighborhood(graph, selectedNodeKey, focusHops);
      candidateKeys = hood.nodeKeys;
    } else {
      candidateKeys = new Set<string>();
      for (const n of graph.nodes.values()) {
        if (preset === 'convergence') {
          if (CONVERGENCE_NODE_KEYS.has(n.key)) candidateKeys.add(n.key);
        } else if (preset === 'phase-5-6') {
          if (
            n.era === 'phase-5' ||
            n.era === 'phase-6' ||
            n.doomsdayStatus === 'confirmed' ||
            n.kind === 'reality' ||
            n.kind === 'thread'
          ) {
            candidateKeys.add(n.key);
          }
        } else if (preset === 'legacy-bridges') {
          if (
            n.era === 'pre-phase-1' ||
            n.doomsdayStatus === 'legacy' ||
            n.key === 'title:deadpool-wolverine' ||
            n.key === 'title:spider-man-no-way-home' ||
            n.key === 'title:the-marvels' ||
            n.key === 'title:avengers-doomsday' ||
            n.kind === 'reality'
          ) {
            candidateKeys.add(n.key);
          }
        } else {
          candidateKeys.add(n.key);
        }
      }
    }

    const nodesList = Array.from(candidateKeys)
      .map((k) => graph.nodes.get(k)!)
      .filter(Boolean);

    const edgesList = graph.edges.filter(
      (e) => candidateKeys.has(e.fromKey) && candidateKeys.has(e.toKey) && (preset !== 'all' || e.priority <= 2),
    );

    return { visibleNodes: nodesList, visibleEdges: edgesList };
  }, [graph, preset, selectedNodeKey, focusHops]);

  const positioned = useMemo(
    () =>
      computeLayout(
        visibleNodes,
        preset,
        selectedNodeKey && focusHops ? selectedNodeKey : null,
        focusHops,
        graph.adjacency,
      ),
    [visibleNodes, preset, selectedNodeKey, focusHops, graph.adjacency],
  );

  const posMap = useMemo(
    () => new Map(positioned.map((p) => [p.node.key, p])),
    [positioned],
  );

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

  const resetCamera = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-4">
      <div className="tva-folder rounded-md p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1d1610] flex items-center gap-2">
            <Network className="w-5 h-5 text-[#c2410c]" /> TemPad CRT Multiverse Scope
          </h1>
          <p className="text-xs text-[#61503e]">
            Showing {visibleNodes.length} nodes &amp; {visibleEdges.length} links. Drag to pan, scroll to zoom, click any blip for 1–2 hop isolation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ['convergence', 'CH-01 Convergence'],
              ['by-faction', 'CH-02 Factions'],
              ['by-reality', 'CH-03 Realities'],
              ['phase-5-6', 'CH-04 Phase 5–6'],
              ['legacy-bridges', 'CH-05 Pre-Phase 1'],
              ['all', 'CH-06 Full Web'],
            ] as [GraphPreset, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setPreset(id);
                setFocusHops(null);
                onClearFocusKey();
              }}
              className={`rounded px-2.5 py-1.5 text-xs font-mono-code border transition-colors ${
                preset === id && !focusHops
                  ? 'border-[#1d1610] bg-[#1d1610] text-[#f59e0b] font-bold'
                  : 'border-[#cbb895] bg-[#fffaf0] text-[#61503e] hover:text-[#1d1610]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Recessed Bakelite CRT Monitor Frame */}
      <div className="tva-crt-bezel rounded-xl p-3 sm:p-4 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono-code uppercase tracking-widest text-[#d4a44a] px-1">
          <span>MODEL TMP-77 // PHOSPHOR TIMELINE OSCILLOSCOPE</span>
          <span>SIGNAL: LOCKED</span>
        </div>

        <div className="relative tva-crt-screen rounded-lg overflow-hidden h-[540px] sm:h-[620px] select-none">
          <div className="tva-scanlines absolute inset-0 z-10 opacity-40" />

          <div
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => {
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
            }}
            onPointerLeave={() => {
              dragRef.current.active = false;
            }}
            onWheel={(e) => {
              e.preventDefault();
              setZoom((z) => Math.min(2.6, Math.max(0.45, z + (e.deltaY < 0 ? 0.12 : -0.12))));
            }}
          >
            <svg
              viewBox="0 0 1400 880"
              className="w-full h-full bg-[#0c0907]"
              onClick={() => setSelectedNodeKey(null)}
            >
              <defs>
                <pattern id="tva-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#241c15" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="1400" height="880" fill="url(#tva-grid)" />

              <g
                transform={`translate(${700 + pan.x}, ${440 + pan.y}) scale(${zoom}) translate(-700, -440)`}
              >
                {visibleEdges.map((edge) => {
                  const a = posMap.get(edge.fromKey);
                  const b = posMap.get(edge.toKey);
                  if (!a || !b) return null;
                  const isFocused =
                    !activeHighlightKey ||
                    edge.fromKey === activeHighlightKey ||
                    edge.toKey === activeHighlightKey;

                  const stroke = edge.isTheory
                    ? '#c084fc'
                    : edge.kind === 'incursion' || edge.kind === 'conflict'
                      ? '#f97316'
                      : edge.kind === 'variant'
                        ? '#38bdf8'
                        : '#f59e0b';

                  const midX = (a.x + b.x) / 2;
                  const midY = (a.y + b.y) / 2;

                  return (
                    <g key={edge.id} opacity={isFocused ? 0.85 : 0.12}>
                      <line
                        x1={a.x}
                        y1={a.y}
                        x2={b.x}
                        y2={b.y}
                        stroke={stroke}
                        strokeWidth={activeHighlightKey && isFocused ? 2 : 1.1}
                        strokeDasharray={edge.isTheory ? '5 4' : undefined}
                      />
                      {activeHighlightKey && isFocused && (focusHops || edge.priority <= 2) && (
                        <text
                          x={midX}
                          y={midY - 4}
                          textAnchor="middle"
                          fill="#f3e8d2"
                          fontSize="10"
                          fontFamily="IBM Plex Mono, monospace"
                          className="pointer-events-none"
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })}

                {positioned.map(({ node, x, y }) => {
                  const isSelected = node.key === selectedNodeKey;
                  const isDimmed = activeHighlightKey !== null && !connectedToActive.has(node.key);
                  const radius =
                    node.key === 'title:avengers-doomsday' || node.key === 'character:doctor-doom'
                      ? 19
                      : node.kind === 'reality'
                        ? 15
                        : node.kind === 'thread'
                          ? 13
                          : 11;

                  const nodeColor = '#f59e0b';

                  return (
                    <g
                      key={node.key}
                      transform={`translate(${x}, ${y})`}
                      opacity={isDimmed ? 0.2 : 1}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredKey(node.key)}
                      onMouseLeave={() => setHoveredKey(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeKey(node.key);
                      }}
                    >
                      {isSelected && (
                        <circle r={radius + 6} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3 2" />
                      )}
                      <circle
                        r={radius}
                        fill="#16120e"
                        stroke={node.isTheory ? '#c084fc' : nodeColor}
                        strokeWidth={isSelected ? 3 : 2}
                      />
                      <text
                        y={3}
                        textAnchor="middle"
                        fill={node.isTheory ? '#c084fc' : '#fbbf24'}
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
                      <rect
                        x={-68}
                        y={radius + 4}
                        width="136"
                        height="17"
                        rx="3"
                        fill="#120f0c"
                        fillOpacity="0.9"
                        stroke={isSelected ? '#10b981' : '#3a2d22'}
                        strokeWidth="0.8"
                      />
                      <text
                        y={radius + 16}
                        textAnchor="middle"
                        fill="#f3e8d2"
                        fontSize="10.5"
                        fontWeight={isSelected ? '700' : '500'}
                        fontFamily="Inter, sans-serif"
                        className="pointer-events-none"
                      >
                        {node.label.length > 20 ? `${node.label.slice(0, 19)}…` : node.label}
                      </text>
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
          </div>

          {selectedNode && (
            <div className="absolute bottom-3 left-3 right-3 z-20 sm:right-auto sm:max-w-lg rounded border border-amber-500/70 bg-[#14100d]/95 p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] font-mono-code uppercase text-amber-400">
                  {selectedNode.kind} locked
                </div>
                <div className="text-sm font-bold text-[#f3e8d2] truncate">{selectedNode.label}</div>
                <div className="text-[11px] text-[#a89984] truncate">{selectedNode.sublabel}</div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setFocusHops(1);
                    resetCamera();
                  }}
                  className={`inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-mono-code border ${
                    focusHops === 1
                      ? 'border-amber-500 bg-amber-500 text-black font-bold'
                      : 'border-[#3a2d22] bg-[#211b16] text-[#f3e8d2] hover:border-amber-500'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" /> 1-Hop
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFocusHops(2);
                    resetCamera();
                  }}
                  className={`inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-mono-code border ${
                    focusHops === 2
                      ? 'border-amber-500 bg-amber-500 text-black font-bold'
                      : 'border-[#3a2d22] bg-[#211b16] text-[#f3e8d2] hover:border-amber-500'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" /> 2-Hop
                </button>
                {focusHops && (
                  <button
                    type="button"
                    onClick={() => {
                      setFocusHops(null);
                      onClearFocusKey();
                    }}
                    className="rounded border border-[#3a2d22] bg-[#14100d] px-2.5 py-1.5 text-xs font-mono-code text-[#a89984] hover:text-[#f3e8d2]"
                  >
                    Exit Focus
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelect(selectedNode.ref)}
                  className="inline-flex items-center gap-1 rounded bg-emerald-500 px-2.5 py-1.5 text-xs font-mono-code font-bold text-black hover:bg-emerald-400"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Dossier
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Index Strip */}
      <div className="tva-folder rounded-md p-4 space-y-2">
        <div className="text-[11px] font-mono-code uppercase tracking-widest font-bold text-[#61503e]">
          Quick Scope Index ({visibleNodes.length} visible)
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
          {visibleNodes.map((n) => (
            <button
              key={n.key}
              type="button"
              onClick={() => {
                setSelectedNodeKey(n.key);
                setFocusHops(1);
                resetCamera();
              }}
              className={`rounded border px-2 py-1 text-[11px] transition-colors ${
                selectedNodeKey === n.key
                  ? 'border-[#1d1610] bg-[#1d1610] text-[#f59e0b] font-semibold'
                  : 'border-[#cbb895] bg-[#fffaf0] text-[#61503e] hover:border-[#b45309] hover:text-[#1d1610]'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
