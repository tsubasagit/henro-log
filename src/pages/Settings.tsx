import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';

function stamp(): string {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function Settings() {
  const visits = useLiveQuery(() => db.visits.toArray(), []);
  const companions = useLiveQuery(() => db.companions.toArray(), []);

  async function exportJson() {
    const data = {
      visits: await db.visits.toArray(),
      companions: await db.companions.toArray(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `henro-log-${stamp()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!window.confirm('現在のデータに追記（同IDは上書き）します。よろしいですか？')) return;
      if (Array.isArray(data.companions)) await db.companions.bulkPut(data.companions);
      if (Array.isArray(data.visits)) await db.visits.bulkPut(data.visits);
      window.alert('インポートしました。');
    } catch {
      window.alert('読み込みに失敗しました。JSONファイルを確認してください。');
    } finally {
      e.target.value = '';
    }
  }

  return (
    <div>
      <header className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 z-10">
        <h1 className="text-lg font-bold text-[#1f5b8c]">設定</h1>
      </header>

      <div className="p-4 space-y-6">
        <section>
          <h2 className="text-sm font-semibold text-slate-600 mb-2">データ</h2>
          <p className="text-xs text-slate-400 mb-3">
            記録は端末内（ブラウザ）に保存されます。機種変更やバックアップにはエクスポートをご利用ください。
          </p>
          <div className="text-sm text-slate-600 mb-3">
            参拝記録 {visits?.length ?? 0} 件 ／ 同行者 {companions?.length ?? 0} 人
          </div>
          <button
            type="button"
            onClick={exportJson}
            className="w-full border-2 border-[#1f5b8c] text-[#1f5b8c] py-2.5 rounded-lg font-semibold mb-3"
          >
            エクスポート（JSON保存）
          </button>
          <label className="block w-full text-center border-2 border-[#1f5b8c] text-[#1f5b8c] py-2.5 rounded-lg font-semibold cursor-pointer">
            インポート（JSON読込）
            <input type="file" accept="application/json" className="hidden" onChange={importJson} />
          </label>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-600 mb-2">このアプリ</h2>
          <p className="text-sm text-slate-500">遍路ログ henro-log — 四国八十八ヶ所の巡拝記録（MVP）</p>
        </section>
      </div>
    </div>
  );
}
