import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

export default function Companions() {
  const companions = useLiveQuery(() => db.companions.toArray(), []);
  const visits = useLiveQuery(() => db.visits.toArray(), []);

  if (!companions || !visits) {
    return <div className="p-4 text-slate-500">読み込み中…</div>;
  }

  const stats = companions
    .map((c) => {
      const vs = visits.filter((v) => v.companionIds.includes(c.id!));
      const temples = new Set(vs.map((v) => v.templeId));
      return { c, visitCount: vs.length, templeCount: temples.size };
    })
    .sort((a, b) => b.templeCount - a.templeCount);

  return (
    <div>
      <header className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 z-10">
        <h1 className="text-lg font-bold text-[#1f5b8c]">同行者</h1>
        <p className="text-sm text-slate-500 mt-0.5">一緒に回った人ごとの歩み</p>
      </header>

      {stats.length === 0 ? (
        <p className="p-4 text-slate-400 text-sm">
          同行者の記録がありません。参拝記録の入力時に同行者を追加できます。
        </p>
      ) : (
        <ul className="px-4">
          {stats.map((s) => (
            <li key={s.c.id} className="flex items-center justify-between py-3 border-b border-slate-100">
              <span>
                <span className="block font-medium text-slate-800">{s.c.name}</span>
                {s.c.relation && <span className="text-xs text-slate-400">{s.c.relation}</span>}
              </span>
              <span className="text-right text-sm">
                <span className="block text-slate-700">{s.templeCount} ヶ寺</span>
                <span className="block text-xs text-slate-400">のべ {s.visitCount} 回</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
