import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export default function Timeline() {
  const visits = useLiveQuery(() => db.visits.toArray(), []);
  const temples = useLiveQuery(() => db.temples.toArray(), []);

  if (!visits || !temples) {
    return <div className="p-4 text-slate-500">読み込み中…</div>;
  }

  const tmap = new Map(temples.map((t) => [t.id, t]));
  const sorted = [...visits].sort((a, b) => b.visitedOn.localeCompare(a.visitedOn));

  return (
    <div>
      <header className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 z-10">
        <h1 className="font-brush text-2xl text-[#1f5b8c] leading-none">記録</h1>
        <p className="text-sm text-slate-500 mt-0.5">のべ {visits.length} 回の参拝</p>
      </header>

      {sorted.length === 0 ? (
        <p className="p-4 text-slate-400 text-sm">まだ記録がありません。右下の＋から記録できます。</p>
      ) : (
        <ul className="px-4 py-2">
          {sorted.map((v) => {
            const t = tmap.get(v.templeId);
            return (
              <li key={v.id} className="flex gap-3 py-3 border-b border-slate-100">
                <span className="text-xs text-slate-400 w-20 shrink-0 pt-0.5">{v.visitedOn}</span>
                <Link to={`/temple/${v.templeId}`} className="flex-1 min-w-0">
                  <span className="block font-medium text-slate-800">
                    第{t?.id}番 {t?.name}
                  </span>
                  {v.note && <span className="block text-sm text-slate-500 truncate">{v.note}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
