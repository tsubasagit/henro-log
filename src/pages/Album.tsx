import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { TEMPLES } from '../data/temples';
import PhotoViewer, { type ViewerItem } from '../components/PhotoViewer';

interface AlbumItem extends ViewerItem {
  photoId: number;
}

export default function Album() {
  const visits = useLiveQuery(() => db.visits.toArray(), []);
  const [items, setItems] = useState<AlbumItem[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!visits) return;
    const nameMap = new Map(TEMPLES.map((t) => [t.id, t.name]));
    const entries = visits
      .flatMap((v) =>
        (v.photoIds ?? []).map((pid) => ({
          photoId: pid,
          title: `第${v.templeId}番 ${nameMap.get(v.templeId) ?? ''}`,
          subtitle: v.visitedOn,
        })),
      )
      .sort((a, b) => b.subtitle.localeCompare(a.subtitle) || b.photoId - a.photoId);

    let cancelled = false;
    let made: AlbumItem[] = [];
    void (async () => {
      const photos = await db.photos.bulkGet(entries.map((e) => e.photoId));
      made = entries
        .map((e, idx) => {
          const p = photos[idx];
          return p ? { ...e, url: URL.createObjectURL(p.blob) } : null;
        })
        .filter((x): x is AlbumItem => x !== null);
      if (cancelled) {
        made.forEach((m) => URL.revokeObjectURL(m.url));
        return;
      }
      setItems(made);
    })();
    return () => {
      cancelled = true;
      made.forEach((m) => URL.revokeObjectURL(m.url));
    };
  }, [visits]);

  return (
    <div>
      <header className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 z-10">
        <h1 className="font-brush text-2xl text-[#1f5b8c] leading-none">写真</h1>
        <p className="text-sm text-slate-500 mt-0.5">のべ {items.length} 枚の思い出</p>
      </header>

      {items.length === 0 ? (
        <p className="p-4 text-slate-400 text-sm">
          まだ写真がありません。参拝記録に写真を追加すると、ここに思い出が集まります。
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-1 p-1">
          {items.map((it, i) => (
            <button key={it.photoId} type="button" onClick={() => setViewerIndex(i)} className="block">
              <img src={it.url} alt={it.title} className="w-full aspect-square object-cover" />
            </button>
          ))}
        </div>
      )}

      {viewerIndex !== null && (
        <PhotoViewer items={items} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      )}
    </div>
  );
}
