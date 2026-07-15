import type { GraphNode, NeighborNode, RelationReason } from '../../lib/types';

interface Props {
  node: GraphNode | null;
  neighbors?: NeighborNode[];
  onClose: () => void;
  onOpenNeighbor?: (slug: string) => void;
}

const statusLabels = { seedling: '萌芽', growing: '生长中', evergreen: '常青' };
const reasonLabels: Record<RelationReason, string> = {
  link: '正文链接', series: '同系列', tag: '共同主题',
};

export default function NodePreview({ node, neighbors = [], onClose, onOpenNeighbor }: Props) {
  if (!node) return null;
  return <div className="preview-overlay" role="presentation" onClick={onClose}>
    <aside className="preview-panel" role="dialog" aria-modal="true" aria-label={node.title}
      onClick={(event) => event.stopPropagation()}>
      <header className="preview-panel__head"><p className="eyebrow">Node preview</p>
        <button type="button" className="btn" onClick={onClose} aria-label="关闭预览">关闭</button></header>
      <div className="preview-panel__meta"><span className="badge">{node.type === 'essay' ? '长文' : '笔记'}</span>
        <span className="badge"><span className="dot" data-status={node.status} />{statusLabels[node.status]}</span></div>
      <h2 className="display">{node.title}</h2><p className="preview-summary">{node.summary}</p>
      <div className="preview-tags">{node.tags.map((tag) => <span key={tag} className="badge">#{tag}</span>)}</div>
      {neighbors.length ? <div className="preview-neighbors"><p>推荐路径 · {neighbors.length}</p><ul>
        {neighbors.map((neighbor) => <li key={neighbor.slug}><button type="button"
          onClick={() => onOpenNeighbor?.(neighbor.slug)}><small>{neighbor.type === 'essay' ? 'Essay' : 'Note'}</small>
          <strong>{neighbor.title}</strong><span>{neighbor.reasons.map((reason) => reasonLabels[reason]).join(' · ')}</span>
        </button></li>)}
      </ul></div> : <p className="muted">这个节点还没有可解释的推荐路径。</p>}
      <div className="preview-actions"><a className="btn btn-primary" href={`/posts/${node.slug}/`}>阅读全文</a>
        <button type="button" className="btn" onClick={onClose}>继续漫游</button></div>
    </aside>
  </div>;
}
