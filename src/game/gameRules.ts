import {
  GOAL_ROW,
  INITIAL_WALLS,
  RPS_TIME_LIMIT_SECONDS,
  START_POSITIONS,
  TEAM_NAME,
  opponentOf,
} from './config';
import { findMoveTo, getLegalMoves } from './movement';
import { isRpsChoice, rpsWinner } from './rps';
import { hasAnyLegalWall, validateWallPlacement, type WallContext } from './wallRules';
import type {
  ActionMode,
  GameEventType,
  GameState,
  Notice,
  PlayerId,
  Position,
  RpsChoice,
  RpsState,
  WallGeom,
} from '../types/game';

export type GameAction =
  | { type: 'OPEN_RULES' }
  | { type: 'GO_HOME' }
  | { type: 'START_RPS' }
  | { type: 'RPS_PICK'; player: PlayerId; choice: RpsChoice; auto?: boolean }
  | { type: 'RPS_TICK'; fallbackChoice: RpsChoice }
  | { type: 'RPS_BLUE_READY' }
  | { type: 'RPS_CONTINUE' }
  | { type: 'SELECT_ACTION'; mode: ActionMode }
  | { type: 'MOVE'; player: PlayerId; to: Position }
  | { type: 'SET_PENDING_WALL'; player: PlayerId; wall: WallGeom }
  | { type: 'CANCEL_WALL' }
  | { type: 'CONFIRM_WALL'; player: PlayerId }
  | { type: 'PASS_TURN'; player: PlayerId }
  | { type: 'PLAY_AGAIN' };

export function freshRps(round: number): RpsState {
  return {
    round,
    stage: 'redPick',
    redChoice: null,
    blueChoice: null,
    secondsLeft: RPS_TIME_LIMIT_SECONDS,
    autoPicked: { red: false, blue: false },
  };
}

export function createInitialState(): GameState {
  return {
    phase: 'menu',
    currentPlayer: null,
    players: {
      red: { position: { ...START_POSITIONS.red }, wallsRemaining: INITIAL_WALLS },
      blue: { position: { ...START_POSITIONS.blue }, wallsRemaining: INITIAL_WALLS },
    },
    walls: [],
    turnNumber: 1,
    winner: null,
    selectedAction: null,
    pendingWall: null,
    rps: freshRps(1),
    notice: null,
    event: { type: 'none', seq: 0 },
  };
}

function withEvent(state: GameState, type: GameEventType, notice: Notice = state.notice): GameState {
  return { ...state, notice, event: { type, seq: state.event.seq + 1 } };
}

function invalid(state: GameState, text: string): GameState {
  return withEvent(state, 'invalid', { text, tone: 'error' });
}

export function wallContextFor(state: GameState, player: PlayerId): WallContext {
  return {
    walls: state.walls,
    positions: { red: state.players.red.position, blue: state.players.blue.position },
    wallsRemaining: state.players[player].wallsRemaining,
  };
}

/** 目前玩家是否完全沒有合法行動（不能移動，也沒有任何合法牆位） */
export function hasNoLegalAction(state: GameState, player: PlayerId): boolean {
  const me = state.players[player].position;
  const opp = state.players[opponentOf(player)].position;
  if (getLegalMoves(me, opp, state.walls).length > 0) return false;
  return !hasAnyLegalWall(wallContextFor(state, player));
}

function nextTurn(state: GameState): GameState {
  const next = opponentOf(state.currentPlayer as PlayerId);
  return {
    ...state,
    currentPlayer: next,
    turnNumber: state.turnNumber + 1,
    selectedAction: 'move',
    pendingWall: null,
  };
}

function startNewMatch(seq: number): GameState {
  const base = createInitialState();
  return { ...base, phase: 'rps', event: { type: 'none', seq } };
}

function isMyTurn(state: GameState, player: PlayerId): boolean {
  return state.phase === 'playing' && state.currentPlayer === player;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'OPEN_RULES':
      if (state.phase !== 'menu') return state;
      return { ...state, phase: 'rules', notice: null };

    case 'GO_HOME':
      return { ...createInitialState(), event: { type: 'none', seq: state.event.seq } };

    case 'START_RPS':
      if (state.phase !== 'menu' && state.phase !== 'rules') return state;
      return startNewMatch(state.event.seq);

    case 'PLAY_AGAIN':
      if (state.phase !== 'gameOver') return state;
      return startNewMatch(state.event.seq);

    case 'RPS_PICK': {
      if (state.phase !== 'rps' || !isRpsChoice(action.choice)) return state;
      const rps = state.rps;
      if (action.player === 'red' && rps.stage === 'redPick') {
        return withEvent(
          {
            ...state,
            rps: {
              ...rps,
              redChoice: action.choice,
              stage: 'passToBlue',
              secondsLeft: RPS_TIME_LIMIT_SECONDS,
              autoPicked: { ...rps.autoPicked, red: !!action.auto },
            },
          },
          'rpsPick',
          action.auto ? { text: '紅隊逾時，系統已隨機代選。', tone: 'info' } : null,
        );
      }
      if (action.player === 'blue' && rps.stage === 'bluePick') {
        return withEvent(
          {
            ...state,
            rps: {
              ...rps,
              blueChoice: action.choice,
              stage: 'reveal',
              autoPicked: { ...rps.autoPicked, blue: !!action.auto },
            },
          },
          'reveal',
          action.auto ? { text: '藍隊逾時，系統已隨機代選。', tone: 'info' } : null,
        );
      }
      return state; // 非該玩家選擇階段：忽略（防重複點擊）
    }

    case 'RPS_TICK': {
      if (state.phase !== 'rps') return state;
      const { stage, secondsLeft } = state.rps;
      if (stage !== 'redPick' && stage !== 'bluePick') return state;
      const left = secondsLeft - 1;
      if (left > 0) return { ...state, rps: { ...state.rps, secondsLeft: left } };
      return gameReducer(
        { ...state, rps: { ...state.rps, secondsLeft: 0 } },
        {
          type: 'RPS_PICK',
          player: stage === 'redPick' ? 'red' : 'blue',
          choice: action.fallbackChoice,
          auto: true,
        },
      );
    }

    case 'RPS_BLUE_READY':
      if (state.phase !== 'rps' || state.rps.stage !== 'passToBlue') return state;
      return {
        ...state,
        notice: null,
        rps: { ...state.rps, stage: 'bluePick', secondsLeft: RPS_TIME_LIMIT_SECONDS },
      };

    case 'RPS_CONTINUE': {
      const { rps } = state;
      if (state.phase !== 'rps' || rps.stage !== 'reveal' || !rps.redChoice || !rps.blueChoice) {
        return state;
      }
      const winner = rpsWinner(rps.redChoice, rps.blueChoice);
      if (!winner) {
        return {
          ...state,
          rps: freshRps(rps.round + 1),
          notice: { text: '平手！重新猜拳，請將畫面交給紅隊。', tone: 'info' },
        };
      }
      return withEvent(
        {
          ...state,
          phase: 'playing',
          currentPlayer: winner,
          turnNumber: 1,
          selectedAction: 'move',
          pendingWall: null,
        },
        'select',
        { text: `${TEAM_NAME[winner]}猜拳獲勝，取得先手！`, tone: 'success' },
      );
    }

    case 'SELECT_ACTION': {
      if (state.phase !== 'playing' || !state.currentPlayer) return state;
      if (action.mode === 'wall' && state.players[state.currentPlayer].wallsRemaining <= 0) {
        return invalid(state, '你的牆已經用完，只能移動球。');
      }
      return { ...state, selectedAction: action.mode, pendingWall: null, notice: null };
    }

    case 'MOVE': {
      if (!isMyTurn(state, action.player)) return state; // 過期或重複操作：忽略
      const me = state.players[action.player];
      const opp = state.players[opponentOf(action.player)];
      const option = findMoveTo(me.position, opp.position, state.walls, action.to);
      if (!option) {
        return invalid(state, '這一步不合法：只能上下左右走一格，或直線跳過相鄰的對手。');
      }
      const moved: GameState = {
        ...state,
        players: {
          ...state.players,
          [action.player]: { ...me, position: { ...option.to } },
        },
      };
      if (option.to.row === GOAL_ROW[action.player]) {
        return withEvent(
          { ...moved, phase: 'gameOver', winner: action.player, selectedAction: null, pendingWall: null },
          'win',
          { text: `${TEAM_NAME[action.player]}突破防線，獲勝！`, tone: 'success' },
        );
      }
      return withEvent(nextTurn(moved), option.kind === 'jump' ? 'jump' : 'move', null);
    }

    case 'SET_PENDING_WALL': {
      if (!isMyTurn(state, action.player)) return state;
      const check = validateWallPlacement(action.wall, wallContextFor(state, action.player));
      if (!check.ok) {
        return invalid({ ...state, pendingWall: null }, check.message);
      }
      return {
        ...state,
        selectedAction: 'wall',
        pendingWall: { ...action.wall },
        notice: { text: '確認放置這道牆？', tone: 'info' },
      };
    }

    case 'CANCEL_WALL':
      if (state.phase !== 'playing' || !state.pendingWall) return state;
      return { ...state, pendingWall: null, notice: null };

    case 'CONFIRM_WALL': {
      if (!isMyTurn(state, action.player) || !state.pendingWall) return state;
      const geom = state.pendingWall;
      const check = validateWallPlacement(geom, wallContextFor(state, action.player));
      if (!check.ok) return invalid({ ...state, pendingWall: null }, check.message);
      const me = state.players[action.player];
      const placed: GameState = {
        ...state,
        walls: [
          ...state.walls,
          { ...geom, id: `w${state.walls.length + 1}-${action.player}`, owner: action.player },
        ],
        players: {
          ...state.players,
          [action.player]: { ...me, wallsRemaining: me.wallsRemaining - 1 },
        },
      };
      return withEvent(nextTurn(placed), 'wall', null);
    }

    case 'PASS_TURN': {
      if (!isMyTurn(state, action.player)) return state;
      if (!hasNoLegalAction(state, action.player)) {
        return invalid(state, '你仍有合法行動，不能略過回合。');
      }
      return withEvent(nextTurn(state), 'select', {
        text: `${TEAM_NAME[action.player]}無合法行動，已略過回合。`,
        tone: 'info',
      });
    }

    default:
      return state;
  }
}
