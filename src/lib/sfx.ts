import stampUrl from '../assets/audio/henro-stamp.wav';
import fanfareUrl from '../assets/audio/henro-fanfare.wav';

/** 押印（参拝を記録）したときのファミコン風 効果音。ユーザー操作から呼ぶ前提 */
let stampEl: HTMLAudioElement | null = null;
let fanfareEl: HTMLAudioElement | null = null;

function play(el: HTMLAudioElement): void {
  try {
    el.currentTime = 0;
    void el.play().catch(() => {
      // 再生できない環境では無音（無視）
    });
  } catch {
    // no-op
  }
}

export function playStamp(): void {
  if (!stampEl) {
    stampEl = new Audio(stampUrl);
    stampEl.volume = 0.5;
  }
  play(stampEl);
  // 対応端末では、押印の手応えとして短い振動も返す
  try {
    navigator.vibrate?.(12);
  } catch {
    // no-op
  }
}

/** 八十八ヶ所 満願（すべて達成）のお祝いファンファーレ */
export function playFanfare(): void {
  if (!fanfareEl) {
    fanfareEl = new Audio(fanfareUrl);
    fanfareEl.volume = 0.6;
  }
  play(fanfareEl);
}
