import { describe, expect, it } from 'vitest';
import { getLegalMoves } from '../game/movement';
import type { Position, WallGeom } from '../types/game';

const P = (row: number, col: number): Position => ({ row, col });
const targets = (from: Position, opp: Position, walls: WallGeom[] = []) =>
  getLegalMoves(from, opp, walls)
    .map((o) => `${o.kind}:${o.to.row},${o.to.col}`)
    .sort();

describe('一般移動', () => {
  it('初始紅球只能上、左、右（下方是棋盤邊界）', () => {
    expect(targets(P(7, 3), P(0, 3))).toEqual(['step:6,3', 'step:7,2', 'step:7,4']);
  });

  it('角落只有兩個方向，且永遠不含斜向', () => {
    expect(targets(P(0, 0), P(7, 7))).toEqual(['step:0,1', 'step:1,0']);
  });

  it('牆會阻擋對應方向', () => {
    // H(5,3) 封住 (5,3)↔(6,3)
    const walls: WallGeom[] = [{ orientation: 'H', anchorRow: 5, anchorCol: 3 }];
    expect(targets(P(6, 3), P(0, 0), walls)).toEqual(['step:6,2', 'step:6,4', 'step:7,3']);
  });

  it('不可進入對手所在格', () => {
    const list = getLegalMoves(P(4, 3), P(4, 4), [{ orientation: 'V', anchorRow: 4, anchorCol: 4 }]);
    // 對手在右側，但其後方 (4,5) 被 V(4,4) 擋住 → 不可跳也不可進入
    expect(list.some((o) => o.to.row === 4 && o.to.col === 4)).toBe(false);
    expect(list.some((o) => o.kind === 'jump')).toBe(false);
  });
});

describe('直線跳躍', () => {
  it('對手相鄰且後方可達 → 可直線跳過', () => {
    expect(targets(P(4, 3), P(3, 3))).toEqual(['jump:2,3', 'step:4,2', 'step:4,4', 'step:5,3']);
  });

  it('自己與對手之間有牆 → 不可跳躍', () => {
    // H(3,3) 封住 (3,3)↔(4,3)
    const walls: WallGeom[] = [{ orientation: 'H', anchorRow: 3, anchorCol: 3 }];
    expect(targets(P(4, 3), P(3, 3), walls)).toEqual(['step:4,2', 'step:4,4', 'step:5,3']);
  });

  it('對手與落點之間有牆 → 不可跳躍，也不可側跳', () => {
    // H(2,3) 封住 (2,3)↔(3,3)
    const walls: WallGeom[] = [{ orientation: 'H', anchorRow: 2, anchorCol: 3 }];
    const list = targets(P(4, 3), P(3, 3), walls);
    expect(list).toEqual(['step:4,2', 'step:4,4', 'step:5,3']);
    expect(list).not.toContain('jump:3,2');
    expect(list).not.toContain('jump:3,4');
  });

  it('對手正後方是棋盤邊界 → 不可跳躍，左右空格也不可側跳', () => {
    const list = targets(P(1, 3), P(0, 3));
    expect(list).toEqual(['step:1,2', 'step:1,4', 'step:2,3']);
    expect(list.some((t) => t.endsWith(':0,2') || t.endsWith(':0,4'))).toBe(false);
  });

  it('水平方向也可直線跳躍', () => {
    expect(targets(P(5, 2), P(5, 3))).toContain('jump:5,4');
  });
});
