import { useEffect, useRef, useState } from 'react';

/**
 * ページをスクロール（スライド）している間だけ true を返す。
 * スクロールが idleMs 止まると false に戻る。
 * ヘッダー/フッターをスクロール中だけ透明にして背景を見せる用途。
 */
export function useIsScrolling(idleMs = 260): boolean {
  const [scrolling, setScrolling] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolling(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setScrolling(false), idleMs);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [idleMs]);

  return scrolling;
}
