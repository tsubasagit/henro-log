import { useEffect, useState } from 'react';

/** BGM（音楽）の ON/OFF を端末（localStorage）に保存し、画面間で共有する */
const KEY = 'henro-music';
const EVENT = 'henro-music-change';

export function getMusicOn(): boolean {
  try {
    return localStorage.getItem(KEY) === 'on';
  } catch {
    return false;
  }
}

export function setMusicOn(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // localStorage 不可でも状態は通知する
  }
  window.dispatchEvent(new CustomEvent<boolean>(EVENT, { detail: on }));
}

/** 現在の音楽 ON/OFF を購読する（設定変更が全画面に伝わる） */
export function useMusicOn(): boolean {
  const [on, setOn] = useState(getMusicOn);
  useEffect(() => {
    const handler = (e: Event) => setOn((e as CustomEvent<boolean>).detail);
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);
  return on;
}
