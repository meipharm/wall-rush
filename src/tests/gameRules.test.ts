import { describe, expect, it } from 'vitest';
import { INITIAL_WALLS, RPS_TIME_LIMIT_SECONDS, START_POSITIONS } from '../game/config';
import { createInitialState, gameReducer, type GameAction } from '../game/gameRules';
import type { GameState, PlayerId } from '../types/game';

const run = (state: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, state);

/** 直接進入對局，指定先手 */
function playingState(first: PlayerId = 'red'): GameState {
  return { ...createInitialState(), phase: 'playing', currentPlayer: first, selectedAction: 'move' };
}

describe('猜拳流程', () => {
  it('雙方都選定前不會進入揭曉；紅方選擇時藍方選擇被忽略', () => {
    let s = run(createInitialState(), { type: 'START_RPS' });
    expect(s.phase).toBe('rps');
    expect(s.rps.stage).toBe('redPick');

    s = run(s, { type: 'RPS_PICK', player: 'blue', choice: 'rock' });
    expect(s.rps.blueChoice).toBeNull();

    s = run(s, { type: 'RPS_PICK', player: 'red', choice: 'rock' });
    expect(s.rps.stage).toBe('passToBlue');

    // 換手前藍方不可選
    s = run(s, { type: 'RPS_PICK', player: 'blue', choice: 'paper' });
    expect(s.rps.blueChoice).toBeNull();

    s = run(s, { type: 'RPS_BLUE_READY' }, { type: 'RPS_PICK', player: 'blue', choice: 'paper' });
    expect(s.rps.stage).toBe('reveal');
  });

  it('紅方選定後不可再改', () => {
    const s = run(
      createInitialState(),
      { type: 'START_RPS' },
      { type: 'RPS_PICK', player: 'red', choice: 'rock' },
      { type: 'RPS_PICK', player: 'red', choice: 'paper' },
    );
    expect(s.rps.redChoice).toBe('rock');
  });

  it('勝者取得先手', () => {
    const s = run(
      createInitialState(),
      { type: 'START_RPS' },
      { type: 'RPS_PICK', player: 'red', choice: 'rock' },
      { type: 'RPS_BLUE_READY' },
      { type: 'RPS_PICK', player: 'blue', choice: 'paper' },
      { type: 'RPS_CONTINUE' },
    );
    expect(s.phase).toBe('playing');
    expect(s.currentPlayer).toBe('blue');
  });

  it('平手重開新一輪，選擇與倒數都重置；重複按繼續不會跳兩輪', () => {
    const s = run(
      createInitialState(),
      { type: 'START_RPS' },
      { type: 'RPS_PICK', player: 'red', choice: 'rock' },
      { type: 'RPS_BLUE_READY' },
      { type: 'RPS_TICK', fallbackChoice: 'paper' },
      { type: 'RPS_PICK', player: 'blue', choice: 'rock' },
      { type: 'RPS_CONTINUE' },
      { type: 'RPS_CONTINUE' },
    );
    expect(s.phase).toBe('rps');
    expect(s.rps.round).toBe(2);
    expect(s.rps.stage).toBe('redPick');
    expect(s.rps.redChoice).toBeNull();
    expect(s.rps.blueChoice).toBeNull();
    expect(s.rps.secondsLeft).toBe(RPS_TIME_LIMIT_SECONDS);
  });

  it('逾時由系統代選並繼續流程', () => {
    let s = run(createInitialState(), { type: 'START_RPS' });
    for (let i = 0; i < RPS_TIME_LIMIT_SECONDS; i++) {
      s = gameReducer(s, { type: 'RPS_TICK', fallbackChoice: 'scissors' });
    }
    expect(s.rps.stage).toBe('passToBlue');
    expect(s.rps.redChoice).toBe('scissors');
    expect(s.rps.autoPicked.red).toBe(true);
    // passToBlue 階段倒數不會跑
    const again = gameReducer(s, { type: 'RPS_TICK', fallbackChoice: 'rock' });
    expect(again.rps).toEqual(s.rps);
  });
});

describe('對局回合', () => {
  it('合法移動後換手，重複點擊不會同回合移動兩次', () => {
    const move = { type: 'MOVE', player: 'red', to: { row: 6, col: 3 } } as const;
    const s = run(playingState('red'), move, { ...move, to: { row: 5, col: 3 } });
    expect(s.players.red.position).toEqual({ row: 6, col: 3 });
    expect(s.currentPlayer).toBe('blue');
    expect(s.turnNumber).toBe(2);
  });

  it('非法移動不換手、保持原狀並顯示提示', () => {
    const before = playingState('red');
    const s = run(before, { type: 'MOVE', player: 'red', to: { row: 6, col: 4 } });
    expect(s.currentPlayer).toBe('red');
    expect(s.players).toEqual(before.players);
    expect(s.notice?.tone).toBe('error');
  });

  it('放牆：預覽→確認才扣牆換手；重複確認不重複扣牆', () => {
    const wall = { orientation: 'H', anchorRow: 3, anchorCol: 3 } as const;
    let s = run(playingState('red'), { type: 'SELECT_ACTION', mode: 'wall' });
    s = run(s, { type: 'SET_PENDING_WALL', player: 'red', wall });
    expect(s.walls).toHaveLength(0);
    expect(s.pendingWall).toEqual(wall);

    s = run(s, { type: 'CONFIRM_WALL', player: 'red' }, { type: 'CONFIRM_WALL', player: 'red' });
    expect(s.walls).toHaveLength(1);
    expect(s.walls[0].owner).toBe('red');
    expect(s.players.red.wallsRemaining).toBe(INITIAL_WALLS - 1);
    expect(s.currentPlayer).toBe('blue');
  });

  it('非法放牆不扣牆、不換手', () => {
    let s = run(
      playingState('red'),
      { type: 'SET_PENDING_WALL', player: 'red', wall: { orientation: 'H', anchorRow: 3, anchorCol: 3 } },
      { type: 'CONFIRM_WALL', player: 'red' },
    );
    // 藍方嘗試放交叉牆
    s = run(s, {
      type: 'SET_PENDING_WALL',
      player: 'blue',
      wall: { orientation: 'V', anchorRow: 3, anchorCol: 3 },
    });
    expect(s.pendingWall).toBeNull();
    expect(s.currentPlayer).toBe('blue');
    expect(s.players.blue.wallsRemaining).toBe(INITIAL_WALLS);
    expect(s.notice?.text).toContain('交叉');
  });

  it('牆剩 0：不能進入放牆，但仍可移動', () => {
    const base = playingState('red');
    const s0: GameState = {
      ...base,
      players: { ...base.players, red: { ...base.players.red, wallsRemaining: 0 } },
    };
    let s = run(s0, { type: 'SELECT_ACTION', mode: 'wall' });
    expect(s.selectedAction).toBe('move');
    expect(s.notice?.tone).toBe('error');
    s = run(s, { type: 'MOVE', player: 'red', to: { row: 6, col: 3 } });
    expect(s.currentPlayer).toBe('blue');
  });

  it('抵達對方底線立即勝利，之後不得再有行動', () => {
    const base = playingState('red');
    const s0: GameState = {
      ...base,
      players: { ...base.players, red: { ...base.players.red, position: { row: 1, col: 0 } } },
    };
    const s = run(
      s0,
      { type: 'MOVE', player: 'red', to: { row: 0, col: 0 } },
      { type: 'MOVE', player: 'blue', to: { row: 1, col: 3 } },
    );
    expect(s.phase).toBe('gameOver');
    expect(s.winner).toBe('red');
    expect(s.players.blue.position).toEqual(START_POSITIONS.blue);
  });

  it('藍隊抵達第 8 列也立即勝利（含跳躍落點）', () => {
    const base = playingState('blue');
    const s0: GameState = {
      ...base,
      players: {
        red: { ...base.players.red, position: { row: 6, col: 5 } },
        blue: { ...base.players.blue, position: { row: 5, col: 5 } },
      },
    };
    const s = run(s0, { type: 'MOVE', player: 'blue', to: { row: 7, col: 5 } });
    expect(s.winner).toBe('blue');
  });

  it('仍有合法行動時不可略過回合', () => {
    const s = run(playingState('red'), { type: 'PASS_TURN', player: 'red' });
    expect(s.currentPlayer).toBe('red');
  });

  it('再玩一局完整重置棋盤、牆、回合與猜拳', () => {
    const base = playingState('red');
    const over: GameState = {
      ...base,
      phase: 'gameOver',
      winner: 'red',
      turnNumber: 12,
      walls: [{ id: 'w1-red', owner: 'red', orientation: 'H', anchorRow: 2, anchorCol: 2 }],
      players: {
        red: { position: { row: 0, col: 1 }, wallsRemaining: 3 },
        blue: { position: { row: 4, col: 4 }, wallsRemaining: 5 },
      },
    };
    const s = run(over, { type: 'PLAY_AGAIN' });
    expect(s.phase).toBe('rps');
    expect(s.walls).toEqual([]);
    expect(s.winner).toBeNull();
    expect(s.turnNumber).toBe(1);
    expect(s.players.red).toEqual({ position: START_POSITIONS.red, wallsRemaining: INITIAL_WALLS });
    expect(s.players.blue).toEqual({ position: START_POSITIONS.blue, wallsRemaining: INITIAL_WALLS });
    expect(s.rps.round).toBe(1);
    expect(s.rps.redChoice).toBeNull();
  });
});
