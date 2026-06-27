import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

const WEATHER = ['晴れ', 'くもり', '雨', '雪'];
const TRANSPORT = ['歩き', '車', 'バス', '自転車', '公共交通'];

function today(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function VisitForm() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const [search] = useSearchParams();
  const navigate = useNavigate();

  const temples = useLiveQuery(() => db.temples.orderBy('id').toArray(), []);
  const companions = useLiveQuery(() => db.companions.toArray(), []);

  const [templeId, setTempleId] = useState<number>(Number(search.get('temple')) || 1);
  const [visitedOn, setVisitedOn] = useState<string>(today());
  const [companionIds, setCompanionIds] = useState<number[]>([]);
  const [weather, setWeather] = useState('');
  const [transport, setTransport] = useState('');
  const [note, setNote] = useState('');
  const [nokyo, setNokyo] = useState(false);
  const [newCompanion, setNewCompanion] = useState('');
  const [loaded, setLoaded] = useState(editId === null);

  useEffect(() => {
    if (editId === null) return;
    void db.visits.get(editId).then((v) => {
      if (v) {
        setTempleId(v.templeId);
        setVisitedOn(v.visitedOn);
        setCompanionIds(v.companionIds);
        setWeather(v.weather ?? '');
        setTransport(v.transport ?? '');
        setNote(v.note ?? '');
        setNokyo(v.nokyo);
      }
      setLoaded(true);
    });
  }, [editId]);

  async function addCompanion() {
    const name = newCompanion.trim();
    if (!name) return;
    const cid = (await db.companions.add({ name })) as number;
    setCompanionIds((prev) => [...prev, cid]);
    setNewCompanion('');
  }

  function toggleCompanion(cid: number) {
    setCompanionIds((prev) => (prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]));
  }

  async function save() {
    const now = Date.now();
    if (editId === null) {
      await db.visits.add({
        templeId,
        visitedOn,
        companionIds,
        weather: weather || undefined,
        transport: transport || undefined,
        note: note || undefined,
        nokyo,
        photoIds: [],
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await db.visits.update(editId, {
        templeId,
        visitedOn,
        companionIds,
        weather: weather || undefined,
        transport: transport || undefined,
        note: note || undefined,
        nokyo,
        updatedAt: now,
      });
    }
    navigate(`/temple/${templeId}`);
  }

  async function remove() {
    if (editId === null) return;
    if (!window.confirm('この記録を削除しますか？')) return;
    await db.visits.delete(editId);
    navigate(`/temple/${templeId}`);
  }

  if (!temples || !companions || !loaded) {
    return <div className="p-4 text-slate-500">読み込み中…</div>;
  }

  const labelCls = 'block text-sm font-semibold text-slate-600 mb-1';
  const fieldCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800';

  return (
    <div>
      <header className="bg-[#1f5b8c] text-white px-4 py-3 flex items-center justify-between">
        <button type="button" onClick={() => navigate(-1)} className="text-sm text-white/70">
          ← 戻る
        </button>
        <h1 className="font-bold">{editId === null ? '参拝を記録' : '記録を編集'}</h1>
        <span className="w-10" />
      </header>

      <div className="p-4 space-y-4">
        <div>
          <label className={labelCls}>札所</label>
          <select className={fieldCls} value={templeId} onChange={(e) => setTempleId(Number(e.target.value))}>
            {temples.map((t) => (
              <option key={t.id} value={t.id}>
                第{t.id}番 {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>参拝日</label>
          <input type="date" className={fieldCls} value={visitedOn} onChange={(e) => setVisitedOn(e.target.value)} />
        </div>

        <div>
          <label className={labelCls}>同行者</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {companions.length === 0 && <span className="text-sm text-slate-400">まだ登録がありません</span>}
            {companions.map((c) => {
              const active = companionIds.includes(c.id!);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCompanion(c.id!)}
                  className={`px-3 py-1 rounded-full text-sm border ${
                    active ? 'bg-[#1f5b8c] text-white border-[#1f5b8c]' : 'bg-white text-slate-600 border-slate-300'
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <input
              className={fieldCls}
              placeholder="同行者を追加"
              value={newCompanion}
              onChange={(e) => setNewCompanion(e.target.value)}
            />
            <button
              type="button"
              onClick={addCompanion}
              className="shrink-0 px-4 rounded-lg border border-[#1f5b8c] text-[#1f5b8c] font-semibold"
            >
              追加
            </button>
          </div>
        </div>

        <div>
          <label className={labelCls}>天候</label>
          <div className="flex flex-wrap gap-2">
            {WEATHER.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeather(weather === w ? '' : w)}
                className={`px-3 py-1 rounded-full text-sm border ${
                  weather === w ? 'bg-[#538bb0] text-white border-[#538bb0]' : 'bg-white text-slate-600 border-slate-300'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>移動手段</label>
          <div className="flex flex-wrap gap-2">
            {TRANSPORT.map((tr) => (
              <button
                key={tr}
                type="button"
                onClick={() => setTransport(transport === tr ? '' : tr)}
                className={`px-3 py-1 rounded-full text-sm border ${
                  transport === tr ? 'bg-[#538bb0] text-white border-[#538bb0]' : 'bg-white text-slate-600 border-slate-300'
                }`}
              >
                {tr}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-slate-700">
          <input type="checkbox" checked={nokyo} onChange={(e) => setNokyo(e.target.checked)} className="w-5 h-5" />
          納経（御朱印）をいただいた
        </label>

        <div>
          <label className={labelCls}>心境・メモ</label>
          <textarea
            className={`${fieldCls} h-28`}
            placeholder="そのときの思いや出来事を残しておく"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={save}
          className="w-full bg-[#1f5b8c] hover:bg-[#16446b] text-white py-3 rounded-lg font-semibold"
        >
          保存する
        </button>

        {editId !== null && (
          <button type="button" onClick={remove} className="w-full text-red-500 py-2 text-sm">
            この記録を削除
          </button>
        )}
      </div>
    </div>
  );
}
