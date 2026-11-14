import type { PlayerId, Position } from '../types/game';

// 集中設定：規則數值只在這裡修改

/** 棋盤邊長（V1.2：8×8） */
export const BOARD_SIZE = 8;

/** 每位玩家初始牆數 */
export const INITIAL_WALLS = 10;

/** 猜拳每位玩家選擇秒數 */
export const RPS_TIME_LIMIT_SECONDS = 10;

/** 牆 anchor 最大值（兩格長牆：0..BOARD_SIZE-2） */
export const WALL_ANCHOR_MAX = BOARD_SIZE - 2;

/**
 * 起點（0-based）。UI 顯示：紅 (8,4)、藍 (1,4)。
 * 屬技術預設：8 欄沒有唯一中央格，若改第 5 欄只需改 col: 4。
 */
export const START_POSITIONS: Record<PlayerId, Position> = {
  red: { row: BOARD_SIZE - 1, col: 3 },
  blue: { row: 0, col: 3 },
};

/** 目標列（0-based）：紅隊往第 1 列、藍隊往第 8 列 */
export const GOAL_ROW: Record<PlayerId, number> = {
  red: 0,
  blue: BOARD_SIZE - 1,
};

export const TEAM_NAME: Record<PlayerId, string> = {
  red: '紅隊',
  blue: '藍隊',
};

export function opponentOf(player: PlayerId): PlayerId {
  return player === 'red' ? 'blue' : 'red';
}
