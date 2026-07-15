import { useEffect, useMemo, useState } from 'react';
import { getReaderStorage, loadReaderState, saveReaderState, updatePreferences,
  type GardenViewPreference } from '../../lib/reader-state';
import { rankNeighbors } from '../../lib/graph';
import type { GraphData, GraphNode, NeighborNode } from '../../lib/types';
import GardenMap from './GardenMap';
import GardenMapBoundary from './GardenMapBoundary';
import GardenTimeline from './GardenTimeline';
import GardenToolbar, { type GardenFilters } from './GardenToolbar';
import NodePreview from './NodePreview';
import './garden-map.css';
import './garden-timeline.css';
import './garden-view.css';

interface Props { graph: GraphData; }
const emptyFilters: GardenFilters = { type: 'all', status: 'all', tag: 'all', query: '' };

function defaultView(): GardenViewPreference {
  const compact = window.matchMedia('(max-width: 760px)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return compact || reduced ? 'timeline' : 'map';
}

function hasSavedReaderState(storage: Pick<Storage, 'getItem'> | null): boolean {
  try { return Boolean(storage?.getItem('reader-state:v1')); } catch { return false; }
}

function filterNodes(nodes: GraphNode[], filters: GardenFilters): GraphNode[] {
  const query = filters.query.trim().toLocaleLowerCase('zh-CN');
  return nodes.filter((node) => {
    if (filters.type !== 'all' && node.type !== filters.type) return false;
    if (filters.status !== 'all' && node.status !== filters.status) return false;
    if (filters.tag !== 'all' && !node.tags.includes(filters.tag)) return false;
    const text = `${node.title} ${node.summary} ${node.tags.join(' ')}`;
    return !query || text.toLocaleLowerCase('zh-CN').includes(query);
  });
}

export default function GardenView({ graph }: Props) {
  const [view, setView] = useState<GardenViewPreference>('timeline');
  const [filters, setFilters] = useState<GardenFilters>(emptyFilters);
  const [selected, setSelected] = useState<string | null>(null);
  const tags = useMemo(() => [...new Set(graph.nodes.flatMap((node) => node.tags))].sort(), [graph]);
  const nodes = useMemo(() => filterNodes(graph.nodes, filters), [filters, graph]);
  const selectedNode = graph.nodes.find((node) => node.slug === selected) ?? null;
  const neighbors = useMemo<NeighborNode[]>(() => {
    if (!selected) return [];
    return rankNeighbors(selected, graph, 8).flatMap((ranked) => {
      const node = graph.nodes.find((candidate) => candidate.slug === ranked.slug);
      return node ? [{ ...node, score: ranked.score, reasons: ranked.reasons }] : [];
    });
  }, [graph, selected]);

  useEffect(() => {
    const storage = getReaderStorage();
    const state = loadReaderState(storage);
    setView(hasSavedReaderState(storage) ? state.preferences.gardenView : defaultView());
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function changeView(next: GardenViewPreference) {
    setView(next);
    const storage = getReaderStorage();
    const state = loadReaderState(storage);
    saveReaderState(storage, updatePreferences(state, { gardenView: next }));
  }

  function updateFilters(patch: Partial<GardenFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  const timeline = <GardenTimeline nodes={nodes} graph={graph} onSelect={setSelected} />;
  return (
    <div className="garden-view">
      <GardenToolbar {...filters} view={view} tags={tags} count={nodes.length}
        total={graph.nodes.length} onView={changeView} onChange={updateFilters}
        onReset={() => setFilters(emptyFilters)} />
      {!nodes.length ? <div className="garden-empty card"><p className="eyebrow">No matches</p>
        <strong className="display">没有匹配的节点</strong><p>试试放宽筛选条件。</p>
        <button type="button" className="btn btn-primary" onClick={() => setFilters(emptyFilters)}>重置筛选</button>
      </div> : view === 'map' ? <GardenMapBoundary fallback={timeline}>
        <GardenMap nodes={nodes} graph={graph} onSelect={setSelected} />
      </GardenMapBoundary> : timeline}
      <NodePreview node={selectedNode} neighbors={neighbors} onClose={() => setSelected(null)}
        onOpenNeighbor={setSelected} />
    </div>
  );
}
