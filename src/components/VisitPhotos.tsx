import { useEffect, useState } from 'react';
import { db } from '../db/db';
import PhotoViewer, { type ViewerItem } from './PhotoViewer';

/** 訪問に紐づく写真をサムネイル表示し、タップで記念フレーム付きビューアを開く */
export default function VisitPhotos({
  photoIds,
  title,
  subtitle,
}: {
  photoIds: number[];
  title: string;
  subtitle: string;
}) {
  const [urls, setUrls] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const key = photoIds.join(',');

  useEffect(() => {
    if (photoIds.length === 0) {
      setUrls([]);
      return;
    }
    let cancelled = false;
    let made: string[] = [];
    void (async () => {
      const photos = await db.photos.bulkGet(photoIds);
      made = photos.filter((p): p is NonNullable<typeof p> => Boolean(p)).map((p) => URL.createObjectURL(p.blob));
      if (cancelled) {
        made.forEach((u) => URL.revokeObjectURL(u));
        return;
      }
      setUrls(made);
    })();
    return () => {
      cancelled = true;
      made.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (urls.length === 0) return null;

  const items: ViewerItem[] = urls.map((u) => ({ url: u, title, subtitle }));

  return (
    <>
      <div className="grid grid-cols-3 gap-2 mt-2">
        {urls.map((u, i) => (
          <button key={i} type="button" onClick={() => setViewerIndex(i)} className="block">
            <img src={u} alt="参拝写真" className="w-full h-24 object-cover rounded-lg border border-slate-200" />
          </button>
        ))}
      </div>
      {viewerIndex !== null && (
        <PhotoViewer items={items} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      )}
    </>
  );
}
