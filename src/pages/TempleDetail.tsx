import { useParams, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { sortByDate, daysBetween, intervalLabel } from '../lib/derive';
import VisitPhotos from '../components/VisitPhotos';

export default function TempleDetail() {
  const { id } = useParams();
  const templeId = Number(id);

  const temple = useLiveQuery(() => db.temples.get(templeId), [templeId]);
  const visits = useLiveQuery(() => db.visits.where('templeId').equals(templeId).toArray(), [templeId]);

  if (!temple || !visits) {
    return <div className="p-4 text-slate-500">読み込み中…</div>;
  }

  const sorted = sortByDate(visits);

  return (
    <div>
      <header className="bg-[#1f5b8c] text-white px-4 py-4">
        <Link to="/" className="text-sm text-white/70">
          ← 札所一覧
        </Link>
        <h1 className="text-xl font-bold mt-1">
          第{temple.id}番 {temple.name}
        </h1>
        <p className="text-sm text-white/80 mt-1">
          {temple.prefecture}
          {temple.city}
        </p>
        <p className="text-sm text-white/80">
          ご本尊：{temple.honzon}／{temple.sect}
        </p>
      </header>

      <div className="px-4 py-3">
        <Link
          to={`/visit/new?temple=${temple.id}`}
          className="block text-center bg-[#1f5b8c] hover:bg-[#16446b] text-white py-2.5 rounded-lg font-semibold"
        >
          この札所の参拝を記録
        </Link>
      </div>

      <h2 className="px-4 pt-2 pb-1 text-sm font-semibold text-slate-500">参拝履歴（{sorted.length}回）</h2>

      {sorted.length === 0 ? (
        <p className="px-4 text-slate-400 text-sm">まだ記録がありません。</p>
      ) : (
        <ul className="px-4 space-y-3 pb-4">
          {sorted.map((v, i) => {
            const prev = sorted[i - 1];
            const interval = prev ? intervalLabel(daysBetween(prev.visitedOn, v.visitedOn)) : '初回';
            return (
              <li key={v.id} className="border border-slate-200 rounded-lg p-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium text-slate-800">{v.visitedOn}</span>
                  <span className="text-xs text-[#538bb0]">
                    {i + 1}回目・{interval}
                  </span>
                </div>
                {v.nokyo && <p className="text-xs text-slate-500 mt-0.5">納経あり</p>}
                {v.note && <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{v.note}</p>}
                <VisitPhotos
                  photoIds={v.photoIds ?? []}
                  title={`第${temple.id}番 ${temple.name}`}
                  subtitle={v.visitedOn}
                />
                <Link to={`/visit/${v.id}`} className="inline-block text-xs text-[#538bb0] mt-2">
                  編集
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
