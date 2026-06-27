import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Visit } from '../db/db';
import { sortByDate } from '../lib/derive';

const REGIONS = [
  { label: '阿波・発心の道場（1〜23番）', from: 1, to: 23 },
  { label: '土佐・修行の道場（24〜39番）', from: 24, to: 39 },
  { label: '伊予・菩提の道場（40〜65番）', from: 40, to: 65 },
  { label: '讃岐・涅槃の道場（66〜88番）', from: 66, to: 88 },
];

export default function TempleList() {
  const temples = useLiveQuery(() => db.temples.orderBy('id').toArray(), []);
  const visits = useLiveQuery(() => db.visits.toArray(), []);

  if (!temples || !visits) {
    return <div className="p-4 text-slate-500">読み込み中…</div>;
  }

  const byTemple = new Map<number, Visit[]>();
  for (const v of visits) {
    const arr = byTemple.get(v.templeId) ?? [];
    arr.push(v);
    byTemple.set(v.templeId, arr);
  }
  const visitedCount = temples.filter((t) => byTemple.has(t.id)).length;

  return (
    <div>
      <header className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 z-10">
        <h1 className="text-lg font-bold text-[#1f5b8c]">札所一覧</h1>
        <p className="text-sm text-slate-500 mt-0.5">{visitedCount} / 88 ヶ寺 参拝済み</p>
        <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#1f5b8c] transition-all" style={{ width: `${(visitedCount / 88) * 100}%` }} />
        </div>
      </header>

      {REGIONS.map((region) => (
        <section key={region.label}>
          <h2 className="px-4 pt-4 pb-1 text-sm font-semibold text-slate-500">{region.label}</h2>
          <ul>
            {temples
              .filter((t) => t.id >= region.from && t.id <= region.to)
              .map((t) => {
                const vs = sortByDate(byTemple.get(t.id) ?? []);
                const last = vs[vs.length - 1];
                return (
                  <li key={t.id}>
                    <Link
                      to={`/temple/${t.id}`}
                      className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 active:bg-slate-50"
                    >
                      <span
                        className={`w-9 h-9 shrink-0 rounded-full grid place-items-center text-sm font-bold ${
                          vs.length ? 'bg-[#1f5b8c] text-white' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {t.id}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium text-slate-800 truncate">{t.name}</span>
                        <span className="block text-xs text-slate-500 truncate">
                          {t.city}・{t.honzon}
                        </span>
                      </span>
                      <span className="text-right text-xs shrink-0">
                        {last ? (
                          <>
                            <span className="block text-slate-700">{last.visitedOn}</span>
                            <span className="block text-slate-400">{vs.length}回</span>
                          </>
                        ) : (
                          <span className="text-slate-300">未参拝</span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
