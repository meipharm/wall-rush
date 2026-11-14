import { BOARD_SIZE } from './config';
import type { Position, WallGeom } from '../types/game';

// 格邊與牆幾何：所有移動／跳躍／路徑搜尋共用此處的 isEdgeBlocked

export function isInside(p: Position): boolean {
  return p.row >= 0 && p.row < BOARD_SIZE && p.col >= 0 && p.col < BOARD_SIZE;
}

export function samePosition(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function isOrthogonallyAdjacent(a: Position, b: Position): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

/** 兩相鄰格之間格邊的唯一鍵（與順序無關） */
export function edgeKey(a: Position, b: Position): string {
  const aFirst = a.row < b.row || (a.row === b.row && a.col <= b.col);
  const [p, q] = aFirst ? [a, b] : [b, a];
  return `${p.row},${p.col}|${q.row},${q.col}`;
}

/**
 * 一道兩格牆封住的兩段格邊。
 * H(r,c)：(r,c)↔(r+1,c) 與 (r,c+1)↔(r+1,c+1)
 * V(r,c)：(r,c)↔(r,c+1) 與 (r+1,c)↔(r+1,c+1)
 */
export function wallEdgeKeys(w: WallGeom): [string, string] {
  const r = w.anchorRow;
  const c = w.anchorCol;
  if (w.orientation === 'H') {
    return [
      edgeKey({ row: r, col: c }, { row: r + 1, col: c }),
      edgeKey({ row: r, col: c + 1 }, { row: r + 1, col: c + 1 }),
    ];
  }
  return [
    edgeKey({ row: r, col: c }, { row: r, col: c + 1 }),
    edgeKey({ row: r + 1, col: c }, { row: r + 1, col: c + 1 }),
  ];
}

/**
 * 唯一的格邊阻隔判定。
 * 任一端在棋盤外、兩格不相鄰，或該格邊被任一道牆占用，都視為阻擋。
 */
export function isEdgeBlocked(a: Position, b: Position, walls: readonly WallGeom[]): boolean {
  if (!isInside(a) || !isInside(b)) return true;
  if (!isOrthogonallyAdjacent(a, b)) return true;
  const key = edgeKey(a, b);
  return walls.some((w) => {
    const [e1, e2] = wallEdgeKeys(w);
    return e1 === key || e2 === key;
  });
}
