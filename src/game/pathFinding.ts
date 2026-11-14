import { BOARD_SIZE } from './config';
import { isEdgeBlocked } from './edges';
import type { Position, WallGeom } from '../types/game';

/**
 * 幾何可達性 BFS：只考慮棋盤邊界與牆，不把對手球視為永久障礙。
 * 回傳抵達目標列任一格的最短步數；無路回傳 null。
 */
export function shortestDistanceToRow(
  start: Position,
  goalRow: number,
  walls: readonly WallGeom[],
): number | null {
  if (start.row === goalRow) return 0;
  const visited = new Set<number>([start.row * BOARD_SIZE + start.col]);
  let frontier: Position[] = [start];
  let distance = 0;

  while (frontier.length > 0) {
    distance += 1;
    const next: Position[] = [];
    for (const p of frontier) {
      const neighbors: Position[] = [
        { row: p.row - 1, col: p.col },
        { row: p.row + 1, col: p.col },
        { row: p.row, col: p.col - 1 },
        { row: p.row, col: p.col + 1 },
      ];
      for (const n of neighbors) {
        if (isEdgeBlocked(p, n, walls)) continue;
        const key = n.row * BOARD_SIZE + n.col;
        if (visited.has(key)) continue;
        if (n.row === goalRow) return distance;
        visited.add(key);
        next.push(n);
      }
    }
    frontier = next;
  }
  return null;
}

export function hasPathToRow(start: Position, goalRow: number, walls: readonly WallGeom[]): boolean {
  return shortestDistanceToRow(start, goalRow, walls) !== null;
}
