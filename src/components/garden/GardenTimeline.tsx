import { useMemo } from 'react';
import { neighborsOf } from '../../lib/graph';
import type { GraphData, GraphNode } from '../../lib/types';

interface Props { nodes: GraphNode[]; graph: GraphData; onSelect: (slug: string) => void; }
const statusLabels = { seedling: '萌芽', growing: '生长中', evergreen: '常青' };

function monthKey(iso: string) {
  const date = new Date(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function groupNodes(nodes: GraphNode[]) {
  const groups = new Map<string, GraphNode[]>();
  [...nodes].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).forEach((node) => {
    const key = monthKey(node.date);
    groups.set(key, [...(groups.get(key) ?? []), node]);
  });
  return [...groups.entries()];
}

export default function GardenTimeline({ nodes, graph, onSelect }: Props) {
  const groups = useMemo(() => groupNodes(nodes), [nodes]);
  let index = 0;
  return (
    <section className="timeline" aria-label="知识生长时间线">
      <header className="timeline__intro"><p className="eyebrow">Growth Timeline</p>
        <p>按写作时间回看花园如何生长；节点下方保留正文织入的邻居。</p></header>
      <div className="timeline__rail">
        {groups.map(([key, list]) => <section key={key} className="timeline__month">
          <header className="timeline__month-head"><span className="timeline__pin" aria-hidden="true" />
            <h2 className="display">{key.replace('-', ' 年 ')} 月</h2><span>{list.length} 篇</span></header>
          <ol className="timeline__list">
            {list.map((node) => {
              index += 1;
              const itemIndex = index;
              const links = neighborsOf(node.slug, graph, 6).flatMap((slug) => {
                const linked = graph.nodes.find((candidate) => candidate.slug === slug);
                return linked ? [linked] : [];
              });
              return <li key={node.slug} className="timeline__item" style={{ '--i': itemIndex - 1 } as React.CSSProperties}>
                <span className={`timeline__dot timeline__dot--${node.status}`} aria-hidden="true" />
                <article className={`timeline__card timeline__card--${node.type}`}>
                  <button type="button" className="timeline__main" onClick={() => onSelect(node.slug)}>
                    <span className="timeline__meta"><b>{String(itemIndex).padStart(2, '0')}</b>
                      <time dateTime={node.date}>{new Date(node.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</time>
                      <i>{node.type === 'essay' ? '长文' : '笔记'}</i><i>{statusLabels[node.status]}</i></span>
                    <h3 className="display">{node.title}</h3><p>{node.summary}</p>
                    <span className="timeline__tags">{node.tags.map((tag) => <span key={tag}>#{tag}</span>)}</span>
                  </button>
                  {links.length ? <div className="timeline__links"><span>织入</span>
                    {links.map((linked) => <button key={linked.slug} type="button"
                      onClick={() => onSelect(linked.slug)}>{linked.title}</button>)}</div> : null}
                </article>
              </li>;
            })}
          </ol>
        </section>)}
      </div>
    </section>
  );
}
