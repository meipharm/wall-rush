import { BOARD_SIZE, GOAL_ROW, WALL_ANCHOR_MAX } from './config';
import { wallEdgeKeys } from './edges';
import { hasPathToRow } from './pathFinding';
import type { PlayerId, Position, WallGeom } from '../types/game';

export type WallRejectReason = 'noWallsLeft' | 'outOfBounds' | 'overlap' | 'cross' | 'blocksPath';

export const WALL_REJECT_MESSAGES: Record<WallRejectReason, string> = {
  noWallsLeft: '你的牆已經用完，只能移動球。',
  outOfBounds: '牆必須完整放在棋盤內的格線上。',
  overlap: '此位置與既有的牆重疊，不能放置。',
  cross: '此位置會與既有的牆交叉，不能放置。',
  blocksPath: '此位置會完全封鎖通往終點的路徑，不能放置。',
};

export type WallValidation =
  | { ok: true }
  | { ok: false; reason: WallRejectReason; message: string };

export type WallContext = {
  walls: readonly WallGeom[];
  positions: Record<PlayerId, Position>;
  wallsRemaining: number;
};

function reject(reason: WallRejectReason): WallValidation {
  return { ok: false, reason, message: WALL_REJECT_MESSAGES[reason] };
}

export function isWallInBounds(w: WallGeom): boolean {
  const okOrientation = w.orientation === 'H' || w.orientation === 'V';
  const okRow = Number.isInteger(w.anchorRow) && w.anchorRow >= 0 && w.anchorRow <= WALL_ANCHOR_MAX;
  const okCol = Number.isInteger(w.anchorCol) && w.anchorCol >= 0 && w.anchorCol <= WALL_ANCHOR_MAX;
  return okOrientation && okRow && okCol;
}

/** 兩道牆是否占用相同格邊 */
export function wallsOverlap(a: WallGeom, b: WallGeom): boolean {
  const ea = wallEdgeKeys(a);
  const eb = wallEdgeKeys(b);
  return ea.some((e) => eb.includes(e));
}

/** 水平與垂直牆在同一 anchor（中點交叉） */
export function wallsCross(a: WallGeom, b: WallGeom): boolean {
  return (
    a.orientation !== b.orientation && a.anchorRow === b.anchorRow && a.anchorCol === b.anchorCol
  );
}

/** 依 5.3 放牆檢查程序驗證；不修改任何輸入 */
export function validateWallPlacement(candidate: WallGeom, ctx: WallContext): WallValidation {
  if (ctx.wallsRemaining <= 0) return reject('noWallsLeft');
  if (!isWallInBounds(candidate)) return reject('outOfBounds');
  if (ctx.walls.some((w) => wallsOverlap(w, candidate))) return reject('overlap');
  if (ctx.walls.some((w) => wallsCross(w, candidate))) return reject('cross');

  // 暫時加入候選牆後，確認雙方都仍有路
  const simulated = [...ctx.walls, candidate];
  const redOk = hasPathToRow(ctx.positions.red, GOAL_ROW.red, simulated);
  const blueOk = hasPathToRow(ctx.positions.blue, GOAL_ROW.blue, simulated);
  if (!redOk || !blueOk) return reject('blocksPath');

  return { ok: true };
}

/** 列出全部 98 個候選牆位 */
export function allWallCandidates(): WallGeom[] {
  const list: WallGeom[] = [];
  for (const orientation of ['H', 'V'] as const) {
    for (let r = 0; r <= WALL_ANCHOR_MAX; r++) {
      for (let c = 0; c <= WALL_ANCHOR_MAX; c++) {
        list.push({ orientation, anchorRow: r, anchorCol: c });
      }
    }
  }
  return list;
}

export function hasAnyLegalWall(ctx: WallContext): boolean {
  return allWallCandidates().some((w) => validateWallPlacement(w, ctx).ok);
}

/**
 * 將棋盤上的點（以格為單位，0..BOARD_SIZE）換算成最接近的牆位。
 * 靠近水平格線 → H；靠近垂直格線 → V；牆以最近的格線交點為中心。
 */
export function wallFromBoardPoint(x: number, y: number): WallGeom {
  const clamp = (v: number) => Math.min(BOARD_SIZE - 1, Math.max(1, v));
  const k = clamp(Math.round(y));
  const m = clamp(Math.round(x));
  const dy = Math.abs(y - k);
  const dx = Math.abs(x - m);
  return { orientation: dy <= dx ? 'H' : 'V', anchorRow: k - 1, anchorCol: m - 1 };
}

export function sameWallGeom(a: WallGeom | null, b: WallGeom | null): boolean {
  if (!a || !b) return false;
  return a.orientation === b.orientation && a.anchorRow === b.anchorRow && a.anchorCol === b.anchorCol;
}
