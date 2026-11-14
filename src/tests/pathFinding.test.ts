import { describe, expect, it } from 'vitest';
import { GOAL_ROW, START_POSITIONS } from '../game/config';
import { hasPathToRow, shortestDistanceToRow } from '../game/pathFinding';
import type { WallGeom } from '../types/game';

const fullRowAt3: WallGeom[] = [0, 2, 4, 6].map((c) => ({
  orientation: 'H' as const,
  anchorRow: 3,
  anchorCol: c,
}));

describe('BFS 幾何可達性', () => {
  it('空棋盤：雙方最短距離都是 7 步', () => {
    expect(shortestDistanceToRow(START_POSITIONS.red, GOAL_ROW.red, [])).toBe(7);
    expect(shortestDistanceToRow(START_POSITIONS.blue, GOAL_ROW.blue, [])).toBe(7);
  });

  it('整列被牆隔開 → 雙方都無路', () => {
    expect(hasPathToRow(START_POSITIONS.red, GOAL_ROW.red, fullRowAt3)).toBe(false);
    expect(hasPathToRow(START_POSITIONS.blue, GOAL_ROW.blue, fullRowAt3)).toBe(false);
  });

  it('留一個缺口 → 有路但需要繞行', () => {
    const walls = fullRowAt3.slice(0, 3); // 第 7、8 欄留空
    expect(shortestDistanceToRow(START_POSITIONS.red, GOAL_ROW.red, walls)).toBe(7 + 3);
  });

  it('已在目標列 → 距離 0', () => {
    expect(shortestDistanceToRow({ row: 0, col: 5 }, GOAL_ROW.red, [])).toBe(0);
  });
});
