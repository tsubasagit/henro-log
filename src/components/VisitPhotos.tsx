import { useEffect, useState } from 'react';
import { db } from '../db/db';

/** 訪問に紐づく写真をサムネイル表示する（IndexedDBのBlobからObjectURLを生成） */
export default function VisitPhotos({ photoIds }: { photoIds: number[] }) {
  const [urls, setUrls] = useState<string[]>([]);
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

  return (
    <div className="grid grid-cols-3 gap-2 mt-2">
      {urls.map((u, i) => (
        <img key={i} src={u} alt="参拝写真" className="w-full h-24 object-cover rounded-lg border border-slate-200" />
      ))}
    </div>
  );
}
