import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import PhotoViewer, { type ViewerItem } from '../components/PhotoViewer';

function today(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

interface PhotoItem {
  id: number;
  url: string;
}

export default function VisitForm() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const [search] = useSearchParams();
  const navigate = useNavigate();

  const temples = useLiveQuery(() => db.temples.orderBy('id').toArray(), []);

  const [templeId, setTempleId] = useState<number>(Number(search.get('temple')) || 1);
  const [visitedOn, setVisitedOn] = useState<string>(today());
  const [note, setNote] = useState('');
  const [nokyo, setNokyo] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(editId === null);

  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  useEffect(() => {
    if (editId === null) return;
    let cancelled = false;
    void (async () => {
      const v = await db.visits.get(editId);
      if (v) {
        setTempleId(v.templeId);
        setVisitedOn(v.visitedOn);
        setNote(v.note ?? '');
        setNokyo(v.nokyo);
        const ph = await db.photos.bulkGet(v.photoIds ?? []);
        const loadedPhotos = ph
          .filter((p): p is NonNullable<typeof p> => Boolean(p))
          .map((p) => ({ id: p.id as number, url: URL.createObjectURL(p.blob) }));
        if (!cancelled) setPhotos(loadedPhotos);
        else loadedPhotos.forEach((p) => URL.revokeObjectURL(p.url));
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  async function onPickPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const startIndex = photos.length; // 追加した写真の先頭位置
    const now = Date.now();
    const added: PhotoItem[] = [];
    for (const f of Array.from(files)) {
      const pid = (await db.photos.add({ blob: f, mime: f.type, createdAt: now })) as number;
      added.push({ id: pid, url: URL.createObjectURL(f) });
    }
    setPhotos((prev) => [...prev, ...added]);
    e.target.value = '';
    // 撮影直後にその場で記念フレームを表示
    setViewerIndex(startIndex);
  }

  async function removePhoto(pid: number) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === pid);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((p) => p.id !== pid);
    });
    await db.photos.delete(pid);
  }

  async function save() {
    const now = Date.now();
    const photoIds = photos.map((p) => p.id);
    if (editId === null) {
      await db.visits.add({
        templeId,
        visitedOn,
        companionIds: [],
        note: note || undefined,
        nokyo,
        photoIds,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await db.visits.update(editId, {
        templeId,
        visitedOn,
        note: note || undefined,
        nokyo,
        photoIds,
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

  if (!temples || !loaded) {
    return <div className="p-4 text-slate-500">読み込み中…</div>;
  }

  const labelCls = 'block text-sm font-semibold text-slate-600 mb-1';
  const fieldCls = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800';

  const templeName = temples.find((t) => t.id === templeId)?.name ?? '';
  const viewerItems: ViewerItem[] = photos.map((p) => ({
    url: p.url,
    title: `第${templeId}番 ${templeName}`,
    subtitle: visitedOn,
  }));

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
          <label className={labelCls}>写真</label>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              {photos.map((p, i) => (
                <div key={p.id} className="relative">
                  <button type="button" onClick={() => setViewerIndex(i)} className="block w-full">
                    <img src={p.url} alt="参拝写真" className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removePhoto(p.id)}
                    aria-label="写真を削除"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800/80 text-white text-sm leading-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="block w-full text-center border-2 border-[#1f5b8c] text-[#1f5b8c] py-2.5 rounded-lg font-semibold cursor-pointer">
            📷 写真を撮る・追加
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="hidden"
              onChange={onPickPhotos}
            />
          </label>
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

      {viewerIndex !== null && (
        <PhotoViewer items={viewerItems} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      )}
    </div>
  );
}
