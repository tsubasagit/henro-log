/** 保存前に写真を縮小・再エンコードする。端末内(IndexedDB)の容量を抑えるのが目的 */

const MAX_EDGE = 1600; // 長辺の上限(px)
const QUALITY = 0.82; // JPEG 品質

export interface DownscaleResult {
  blob: Blob;
  mime: string;
}

/**
 * 画像を長辺 MAX_EDGE 以内に縮小し JPEG で再エンコードする。
 * - スマホ写真の EXIF 回転は createImageBitmap の imageOrientation で吸収する
 * - 画像でない/縮小に失敗した場合は原本をそのまま返す
 * - 再エンコード後にサイズが増えた場合も原本を返す（劣化・肥大を防ぐ）
 */
export async function downscaleImage(file: Blob): Promise<DownscaleResult> {
  const original: DownscaleResult = { blob: file, mime: file.type || 'application/octet-stream' };

  if (!file.type.startsWith('image/')) return original;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return original;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const encoded = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', QUALITY);
    });

    // 再エンコードが失敗、または原本より大きくなった場合は原本を優先
    if (!encoded || encoded.size >= file.size) return original;

    return { blob: encoded, mime: 'image/jpeg' };
  } catch {
    return original;
  }
}
