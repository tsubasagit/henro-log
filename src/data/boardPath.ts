/**
 * すごろく盤の札所マス座標（SVG viewBox 0 0 380 BOARD_H 基準）。
 *
 * 88札所を「蛇行（ブストロフェドン）」で自動生成する。
 * 88 = 8列 × 11段 でちょうど割り切れるため、手置きゼロで全マスを配置できる。
 * 偶数段は左→右、奇数段は右→左に進み、段の変わり目は同じ列で真下へ落ちる。
 *
 * 盤の形（列数・間隔）を変えたくなったら、このファイルの定数だけ差し替えれば
 * 盤・巡拝路・スタンプ位置がすべて追従する。背景イラストとは独立レイヤー。
 */
export interface BoardNode {
  templeId: number; // 札所番号 1-88
  x: number;
  y: number;
  row: number; // 段（0が最上段）
  col: number; // 見た目の列（0が左端）
}

const COLS = 8;
const ROWS = 11; // 8 × 11 = 88
const H_PAD = 38; // 左右の余白
const V_START = 50; // 最上段の中心y
const ROW_GAP = 62; // 段の縦間隔

/** 盤の描画幅（viewBox幅）。ウィジェット同様380基準 */
export const BOARD_W = 380;
/** 盤の描画高さ（viewBox高さ）。最下段 + 下部余白 */
export const BOARD_H = V_START + (ROWS - 1) * ROW_GAP + 56;

const colX = (col: number) => H_PAD + (col * (BOARD_W - 2 * H_PAD)) / (COLS - 1);

/** 札所1→88の順に並んだ蛇行ノード列 */
export const BOARD_NODES: BoardNode[] = Array.from({ length: 88 }, (_, i) => {
  const templeId = i + 1;
  const row = Math.floor(i / COLS);
  const idxInRow = i % COLS;
  const leftToRight = row % 2 === 0;
  const col = leftToRight ? idxInRow : COLS - 1 - idxInRow;
  return { templeId, x: colX(col), y: V_START + row * ROW_GAP, row, col };
});

/** 巡拝路（1→88を順につなぐ）の polyline points 文字列 */
export const ROUTE_POINTS = BOARD_NODES.map((n) => `${n.x},${n.y}`).join(' ');
