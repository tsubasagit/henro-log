const MINCHO = '"Hiragino Mincho ProN", "Yu Mincho", "Yu Mincho JP", serif';

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = url;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const ir = img.width / img.height;
  const rr = w / h;
  let sw: number, sh: number, sx: number, sy: number;
  if (ir > rr) {
    sh = img.height;
    sw = sh * rr;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / rr;
    sx = 0;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/** 写真＋記念フレーム（寺名・参拝日・朱印風"巡拝"）を合成し PNG Blob を返す */
export async function composeFramedImage(photoUrl: string, title: string, subtitle: string): Promise<Blob> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas not supported');

  // 背景（和紙風クリーム）
  ctx.fillStyle = '#f1e7d0';
  ctx.fillRect(0, 0, W, H);

  // 写真ウィンドウ（白マット＋枠）
  const px = 60;
  const py = 60;
  const pw = 960;
  const ph = 960;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(px - 10, py - 10, pw + 20, ph + 20);
  const img = await loadImage(photoUrl);
  drawCover(ctx, img, px, py, pw, ph);
  ctx.strokeStyle = '#c9b994';
  ctx.lineWidth = 2;
  ctx.strokeRect(px - 10, py - 10, pw + 20, ph + 20);

  // 朱印風の「巡拝」
  const cx = 968;
  const cy = 1135;
  const r = 64;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = '#c0392b';
  ctx.font = `bold 46px ${MINCHO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('巡', cx, cy - 24);
  ctx.fillText('拝', cx, cy + 24);

  // タイトル（第○番 寺名）
  ctx.fillStyle = '#1f3a52';
  ctx.font = `bold 58px ${MINCHO}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, 60, 1140, 800);

  // 参拝日
  ctx.fillStyle = '#64748b';
  ctx.font = `38px ${MINCHO}`;
  ctx.fillText(subtitle, 60, 1195, 800);

  // フッター（ワードマーク）
  ctx.fillStyle = '#94a3b8';
  ctx.font = '30px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('遍路ログ', W / 2, 1312);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
  });
}

/** Web Share API で共有。非対応ならダウンロードにフォールバック */
export async function shareImage(blob: Blob, filename: string, title: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'image/png' });
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data?: ShareData) => Promise<void>;
  };

  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'shared';
      // それ以外はダウンロードへフォールバック
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
