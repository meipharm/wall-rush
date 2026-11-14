import { useEffect, useMemo, useState, type Dispatch } from 'react';
import { Board } from '../components/Board';
import { PlayerPanel } from '../components/PlayerPanel';
import { TurnIndicator } from '../components/TurnIndicator';
import { BOARD_SIZE, GOAL_ROW, TEAM_NAME, WALL_ANCHOR_MAX, opponentOf } from '../game/config';
import { hasNoLegalAction, wallContextFor, type GameAction } from '../game/gameRules';
import { getLegalMoves, type Direction } from '../game/movement';
import { shortestDistanceToRow } from '../game/pathFinding';
import { validateWallPlacement } from '../game/wallRules';
import type { GameState, PlayerId, WallGeom } from '../types/game';
import { ResultScreen } from './ResultScreen';

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  onExit: () => void;
};

const ARROW_DIR: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

export function GameScreen({ state, dispatch, onExit }: Props) {
  const { players, walls, currentPlayer, selectedAction, pendingWall, phase } = state;
  const playing = phase === 'playing' && currentPlayer !== null;
  const [previewWall, setPreviewWall] = useState<WallGeom | null>(null);

  const moveOptions = useMemo(() => {
    if (!currentPlayer) return [];
    return getLegalMoves(players[currentPlayer].position, players[opponentOf(currentPlayer)].position, walls);
  }, [players, walls, currentPlayer]);

  const previewCheck = useMemo(() => {
    if (!previewWall || !currentPlayer) return null;
    return validateWallPlacement(previewWall, wallContextFor(state, currentPlayer));
  }, [previewWall, currentPlayer, state]);

  const distances = useMemo(
    () => ({
      red: shortestDistanceToRow(players.red.position, GOAL_ROW.red, walls),
      blue: shortestDistanceToRow(players.blue.position, GOAL_ROW.blue, walls),
    }),
    [players, walls],
  );

  const stuck = playing && currentPlayer ? hasNoLegalAction(state, currentPlayer) : false;

  // 換手或離開放牆模式時清除預覽
  useEffect(() => {
    setPreviewWall(null);
  }, [currentPlayer, selectedAction]);

  const pickWall = (g: WallGeom) => {
    if (!currentPlayer) return;
    setPreviewWall(g);
    dispatch({ type: 'SET_PENDING_WALL', player: currentPlayer, wall: g });
  };

  const rotatePending = () => {
    const base = pendingWall ?? previewWall;
    if (!base || !currentPlayer) return;
    pickWall({ ...base, orientation: base.orientation === 'H' ? 'V' : 'H' });
  };

  // 鍵盤操作
  useEffect(() => {
    if (!playing || !currentPlayer) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      const key = e.key;
      if (key === 'm' || key === 'M') {
        dispatch({ type: 'SELECT_ACTION', mode: 'move' });
        return;
      }
      if (key === 'w' || key === 'W') {
        dispatch({ type: 'SELECT_ACTION', mode: 'wall' });
        return;
      }
      if (selectedAction === 'move' && ARROW_DIR[key]) {
        e.preventDefault();
        const option = moveOptions.find((o) => o.direction === ARROW_DIR[key]);
        if (option) dispatch({ type: 'MOVE', player: currentPlayer, to: option.to });
        else dispatch({ type: 'MOVE', player: currentPlayer, to: { row: -1, col: -1 } });
        return;
      }
      if (selectedAction === 'wall') {
        const cursor: WallGeom = previewWall ?? pendingWall ?? { orientation: 'H', anchorRow: 3, anchorCol: 3 };
        const clamp = (v: number) => Math.min(WALL_ANCHOR_MAX, Math.max(0, v));
        if (ARROW_DIR[key]) {
          e.preventDefault();
          const d = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[ARROW_DIR[key]];
          if (pendingWall) dispatch({ type: 'CANCEL_WALL' });
          setPreviewWall(
            previewWall || pendingWall
              ? { ...cursor, anchorRow: clamp(cursor.anchorRow + d[0]), anchorCol: clamp(cursor.anchorCol + d[1]) }
              : cursor,
          );
        } else if (key === 'r' || key === 'R' || key === ' ') {
          e.preventDefault();
          if (pendingWall) dispatch({ type: 'CANCEL_WALL' });
          setPreviewWall({ ...cursor, orientation: cursor.orientation === 'H' ? 'V' : 'H' });
        } else if (key === 'Enter') {
          e.preventDefault();
          if (pendingWall) dispatch({ type: 'CONFIRM_WALL', player: currentPlayer });
          else pickWall(cursor);
        } else if (key === 'Escape') {
          if (pendingWall) dispatch({ type: 'CANCEL_WALL' });
          else dispatch({ type: 'SELECT_ACTION', mode: 'move' });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const me: PlayerId | null = currentPlayer;
  const noWalls = me ? players[me].wallsRemaining <= 0 : true;

  return (
    <div className="game-layout">
      <PlayerPanel
        team="blue"
        state={players.blue}
        active={playing && currentPlayer === 'blue'}
        distance={distances.blue}
      />

      <main className="game-center">
        <div className="game-topbar">
          <TurnIndicator player={currentPlayer} turnNumber={state.turnNumber} />
          <button type="button" className="btn btn-ghost btn-small" onClick={onExit}>
            離開對局
          </button>
        </div>

        <div className="board-frame">
          <div className="axis axis-top" aria-hidden="true">
            {Array.from({ length: BOARD_SIZE }, (_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>
          <div className="axis axis-left" aria-hidden="true">
            {Array.from({ length: BOARD_SIZE }, (_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>
          <Board
            players={players}
            walls={walls}
            currentPlayer={currentPlayer}
            mode={selectedAction}
            interactive={playing}
            moveOptions={moveOptions}
            pendingWall={pendingWall}
            previewWall={previewWall}
            previewCheck={previewCheck}
            onMove={(o) => me && dispatch({ type: 'MOVE', player: me, to: o.to })}
            onPreviewWall={setPreviewWall}
            onPickWall={pickWall}
            onBallClick={(team) => {
              if (playing && team === currentPlayer) dispatch({ type: 'SELECT_ACTION', mode: 'move' });
            }}
          />
        </div>

        {playing && me && (
          <div className="action-bar">
            <div className="mode-switch" role="radiogroup" aria-label="行動選擇">
              <button
                type="button"
                role="radio"
                aria-checked={selectedAction === 'move'}
                className={`mode-btn ${selectedAction === 'move' ? `mode-on mode-${me}` : ''}`}
                onClick={() => dispatch({ type: 'SELECT_ACTION', mode: 'move' })}
              >
                移動球 <kbd>M</kbd>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={selectedAction === 'wall'}
                className={`mode-btn ${selectedAction === 'wall' ? `mode-on mode-${me}` : ''}`}
                onClick={() => dispatch({ type: 'SELECT_ACTION', mode: 'wall' })}
                disabled={noWalls}
                title={noWalls ? '牆已用完' : undefined}
              >
                放牆（剩 {players[me].wallsRemaining}） <kbd>W</kbd>
              </button>
            </div>

            {selectedAction === 'wall' && (
              <div className="wall-controls">
                {pendingWall ? (
                  <>
                    <button
                      type="button"
                      className={`btn btn-${me}`}
                      onClick={() => dispatch({ type: 'CONFIRM_WALL', player: me })}
                    >
                      確認放置
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={rotatePending}>
                      旋轉
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: 'CANCEL_WALL' })}>
                      取消
                    </button>
                  </>
                ) : (
                  <span className="hint">點選兩格之間的格線預覽牆位（靠近哪條格線就放在哪條）</span>
                )}
              </div>
            )}

            {selectedAction === 'move' && (
              <span className="hint">
                點亮的格子可前往；標「跳」為直線跳躍。鍵盤可用方向鍵。
              </span>
            )}

            {stuck && (
              <button type="button" className="btn btn-ghost" onClick={() => dispatch({ type: 'PASS_TURN', player: me })}>
                無合法行動，略過回合
              </button>
            )}
          </div>
        )}

        <div className={`notice ${state.notice ? `notice-${state.notice.tone}` : 'notice-empty'}`} role="status" aria-live="polite">
          {state.notice?.text ?? (me ? `${TEAM_NAME[me]}：移動一次或放一道牆，二擇一。` : '')}
        </div>
      </main>

      <PlayerPanel
        team="red"
        state={players.red}
        active={playing && currentPlayer === 'red'}
        distance={distances.red}
      />

      {phase === 'gameOver' && state.winner && (
        <ResultScreen
          winner={state.winner}
          turnNumber={state.turnNumber}
          onPlayAgain={() => dispatch({ type: 'PLAY_AGAIN' })}
          onHome={() => dispatch({ type: 'GO_HOME' })}
        />
      )}
    </div>
  );
}
