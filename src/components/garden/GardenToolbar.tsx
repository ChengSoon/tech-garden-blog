import type { GardenViewPreference } from '../../lib/reader-state';
import type { GrowthStatus, PostType } from '../../lib/types';

export interface GardenFilters {
  type: 'all' | PostType;
  status: 'all' | GrowthStatus;
  tag: string;
  query: string;
}

interface Props extends GardenFilters {
  view: GardenViewPreference;
  tags: string[];
  count: number;
  total: number;
  onView: (view: GardenViewPreference) => void;
  onChange: (patch: Partial<GardenFilters>) => void;
  onReset: () => void;
}

const statuses: { id: GardenFilters['status']; label: string }[] = [
  { id: 'all', label: '全部状态' },
  { id: 'seedling', label: '萌芽' },
  { id: 'growing', label: '生长中' },
  { id: 'evergreen', label: '常青' },
];

export default function GardenToolbar(props: Props) {
  const hasFilters = props.type !== 'all' || props.status !== 'all' ||
    props.tag !== 'all' || Boolean(props.query.trim());
  return (
    <div className="garden-toolbar card">
      <div className="garden-toolbar__row">
        <div className="garden-segmented" role="group" aria-label="视图切换">
          {([['map', '主题地图'], ['timeline', '时间线']] as const).map(([id, label]) => (
            <button key={id} type="button" className={props.view === id ? 'active' : ''}
              onClick={() => props.onView(id)}>{label}</button>
          ))}
        </div>
        <div className="garden-type-tabs" role="group" aria-label="内容类型">
          {([['all', '全部'], ['essay', '长文'], ['note', '笔记']] as const).map(([id, label]) => (
            <button key={id} type="button" className={props.type === id ? 'active' : ''}
              onClick={() => props.onChange({ type: id })}>{label}</button>
          ))}
        </div>
        <label className="garden-search">
          <span className="sr-only">搜索节点</span>
          <input value={props.query} onChange={(event) => props.onChange({ query: event.target.value })}
            placeholder="搜索标题 / 标签…" />
        </label>
        <span className="garden-count"><strong>{props.count}</strong> / {props.total}</span>
      </div>
      <div className="garden-toolbar__row garden-toolbar__filters">
        <div className="garden-chips" role="group" aria-label="生长状态">
          {statuses.map((item) => (
            <button key={item.id} type="button" className={props.status === item.id ? 'chip active' : 'chip'}
              onClick={() => props.onChange({ status: item.id })}>
              {item.id !== 'all' ? <i className="dot" data-status={item.id} /> : null}{item.label}
            </button>
          ))}
        </div>
        <div className="garden-chips" role="group" aria-label="标签">
          {['all', ...props.tags].map((tag) => (
            <button key={tag} type="button" className={props.tag === tag ? 'chip active' : 'chip'}
              onClick={() => props.onChange({ tag })}>{tag === 'all' ? '全部标签' : `#${tag}`}</button>
          ))}
        </div>
        {hasFilters ? <button type="button" className="btn garden-reset" onClick={props.onReset}>清除筛选</button> : null}
      </div>
    </div>
  );
}
