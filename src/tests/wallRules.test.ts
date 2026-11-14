import { describe, expect, it } from 'vitest';
import { BOARD_SIZE, INITIAL_WALLS, START_POSITIONS } from '../game/config';
import { isEdgeBlocked } from '../game/edges';
import {
  allWallCandidates,
  validateWallPlacement,
  wallFromBoardPoint,
  type WallContext,
} from '../game/wallRules';
import type { Position, WallGeom } from '../types/game';

const H = (r: number, c: number): WallGeom => ({ orientation: 'H', anchorRow: r, anchorCol: c });
const V = (r: number, c: number): WallGeom => ({ orientation: 'V', anchorRow: r, anchorCol: c });

const ctx = (walls: WallGeom[], over: Partial<WallContext> = {}): WallContext => ({
  walls,
  positions: { red: START_POSITIONS.red, blue: START_POSITIONS.blue },
  wallsRemaining: INITIAL_WALLS,
  ...over,
});

/** 列出棋盤上所有被封住的相鄰格邊 */
function blockedEdges(walls: WallGeom[]): string[] {
  const out: string[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const a: Position = { row: r, col: c };
      for (const b of [
        { row: r + 1, col: c },
        { row: r, col: c + 1 },
      ]) {
        if (b.row < BOARD_SIZE && b.col < BOARD_SIZE && isEdgeBlocked(a, b, walls)) {
          out.push(`${a.row},${a.col}-${b.row},${b.col}`);
        }
      }
    }
  }
  return out.sort();
}

describe('兩格牆幾何', () => {
  it('水平牆恰好封住兩段正確格邊', () => {
    expect(blockedEdges([H(2, 3)])).toEqual(['2,3-3,3', '2,4-3,4']);
  });

  it('垂直牆恰好封住兩段正確格邊', () => {
    expect(blockedEdges([V(4, 1)])).toEqual(['4,1-4,2', '5,1-5,2']);
  });

  it('8×8 共 98 個候選牆位，空棋盤全部合法', () => {
    const all = allWallCandidates();
    expect(all).toHaveLength(98);
    expect(all.every((w) => validateWallPlacement(w, ctx([])).ok)).toBe(true);
  });
});

describe('放牆合法性', () => {
  it('出界 anchor 被拒絕', () => {
    for (const w of [H(7, 0), H(0, 7), V(-1, 0), V(0, -1)]) {
      const res = validateWallPlacement(w, ctx([]));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.reason).toBe('outOfBounds');
    }
  });

  it('水平與垂直牆在同 anchor 交叉被拒絕', () => {
    const res = validateWallPlacement(H(3, 3), ctx([V(3, 3)]));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('cross');
  });

  it('同方向牆重疊被拒絕', () => {
    for (const [existing, cand] of [
      [H(3, 3), H(3, 4)],
      [H(3, 3), H(3, 3)],
      [V(2, 2), V(3, 2)],
    ] as const) {
      const res = validateWallPlacement(cand, ctx([existing]));
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.reason).toBe('overlap');
    }
  });

  it('同方向相鄰牆端點接觸允許', () => {
    expect(validateWallPlacement(H(3, 5), ctx([H(3, 3)])).ok).toBe(true);
    expect(validateWallPlacement(V(4, 2), ctx([V(2, 2)])).ok).toBe(true);
  });

  it('牆剩 0 不可放置', () => {
    const res = validateWallPlacement(H(3, 3), ctx([], { wallsRemaining: 0 }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('noWallsLeft');
  });

  it('只封住紅隊也必須拒絕', () => {
    const positions = { red: { row: 7, col: 0 }, blue: START_POSITIONS.blue };
    const res = validateWallPlacement(H(5, 0), ctx([V(6, 0)], { positions }));
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe('blocksPath');
      expect(res.message).toBe('此位置會完全封鎖通往終點的路徑，不能放置。');
    }
    // 同一位置在紅球不在角落時是合法的
    expect(validateWallPlacement(H(5, 0), ctx([V(6, 0)])).ok).toBe(true);
  });

  it('只封住藍隊也必須拒絕', () => {
    const positions = { red: START_POSITIONS.red, blue: { row: 0, col: 7 } };
    const res = validateWallPlacement(H(1, 6), ctx([V(0, 6)], { positions }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toBe('blocksPath');
  });

  it('BFS 不把對手球當永久障礙物', () => {
    // 紅球在 (7,0)，唯一出口是往上經過 (6,0)，而藍球正停在 (6,0)
    const positions = { red: { row: 7, col: 0 }, blue: { row: 6, col: 0 } };
    expect(validateWallPlacement(H(2, 4), ctx([V(6, 0)], { positions })).ok).toBe(true);
  });
});

describe('指標座標換算牆位', () => {
  it('靠近水平格線 → H，牆中心為最近交點', () => {
    expect(wallFromBoardPoint(2.4, 3.05)).toEqual(H(2, 1));
  });
  it('靠近垂直格線 → V', () => {
    expect(wallFromBoardPoint(5.02, 6.3)).toEqual(V(5, 4));
  });
  it('邊緣自動夾在合法範圍', () => {
    expect(wallFromBoardPoint(0.95, 0.2)).toEqual(V(0, 0));
    expect(wallFromBoardPoint(7.9, 7.05)).toEqual(H(6, 6));
  });
});
