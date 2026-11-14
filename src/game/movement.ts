import { isEdgeBlocked, samePosition } from './edges';
import type { Position, WallGeom } from '../types/game';

export const DIRECTIONS = {
  up: { dr: -1, dc: 0 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 },
} as const;

export type Direction = keyof typeof DIRECTIONS;

export type MoveOption = {
  to: Position;
  kind: 'step' | 'jump';
  direction: Direction;
};

function offset(p: Position, dir: Direction): Position {
  const d = DIRECTIONS[dir];
  return { row: p.row + d.dr, col: p.col + d.dc };
}

/**
 * 計算目前可走的所有落點：
 * - 上下左右一格，不可出界、穿牆、與對手同格。
 * - 對手相鄰時，可沿同方向直線跳到其正後方；兩段格邊都不能有牆，落點需在棋盤內。
 * - 直線跳躍受阻時不提供側跳或斜跳。
 */
export function getLegalMoves(
  from: Position,
  opponent: Position,
  walls: readonly WallGeom[],
): MoveOption[] {
  const options: MoveOption[] = [];
  for (const direction of Object.keys(DIRECTIONS) as Direction[]) {
    const next = offset(from, direction);
    if (isEdgeBlocked(from, next, walls)) continue;

    if (samePosition(next, opponent)) {
      const landing = offset(next, direction);
      if (!isEdgeBlocked(next, landing, walls)) {
        options.push({ to: landing, kind: 'jump', direction });
      }
      continue; // 不允許側跳
    }

    options.push({ to: next, kind: 'step', direction });
  }
  return options;
}

export function findMoveTo(
  from: Position,
  opponent: Position,
  walls: readonly WallGeom[],
  to: Position,
): MoveOption | undefined {
  return getLegalMoves(from, opponent, walls).find((o) => samePosition(o.to, to));
}
