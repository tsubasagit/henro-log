import stampUrl from '../assets/audio/henro-stamp.wav';

/** 押印（参拝を記録）したときのファミコン風 効果音。ユーザー操作から呼ぶ前提 */
let el: HTMLAudioElement | null = null;

export function playStamp(): void {
  try {
    if (!el) {
      el = new Audio(stampUrl);
      el.volume = 0.5;
    }
    el.currentTime = 0;
    void el.play().catch(() => {
      // 再生できない環境では無音（無視）
    });
  } catch {
    // no-op
  }
}
