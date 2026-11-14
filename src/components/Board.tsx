import { useRef, type PointerEvent } from 'react';
import { BOARD_SIZE } from '../game/config';
import type { MoveOption } from '../game/movement';
import { sameWallGeom, wallFromBoardPoint, type WallValidation } from '../game/wallRules';
import type { ActionMode, PlayerId, PlayerState, Wall as WallT, WallGeom } from '../types/game';
import { Ball } from './Ball';
import { Cell } from './Cell';
import { Wall } from './Wall';

const PCT = 100 / BOARD_SIZE;

type Props = {
  players: Record<PlayerId, PlayerState>;
  walls: WallT[];
  currentPlayer: PlayerId | null;
  mode: ActionMode | null;
  interactive: boolean;
  moveOptions: MoveOption[];
  pendingWall: WallGeom | null;
  previewWall: WallGeom | null;
  previewCheck: WallValidation | null;
  onMove: (option: MoveOption) => void;
  onPreviewWall: (geom: WallGeom | null) => void;
  onPickWall: (geom: WallGeom) => void;
  onBallClick: (team: PlayerId) => void;
};

export function Board(props: Props) {
  const {
    players,
    walls,
    currentPlayer,
    mode,
    interactive,
    moveOptions,
    pendingWall,
    previewWall,
    previewCheck,
  } = props;
  const ref = useRef<HTMLDivElement>(null);
  const wallMode = interactive && mode === 'wall';

  const pointToWall = (e: PointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const x = ((e.clientX - rect.left) / rect.width) * BOARD_SIZE;
    const y = ((e.clientY - rect.top) / rect.height) * BOARD_SIZE;
    return wallFromBoardPoint(x, y);
  };

  const cells = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) cells.push(<Cell key={`${r}-${c}`} row={r} col={c} />);
  }

  const lastWallId = walls.length ? walls[walls.length - 1].id : null;
  const showPreview = wallMode && previewWall && !sameWallGeom(previewWall, pendingWall);

  return (
    <div
      ref={ref}
      className={`board ${wallMode ? 'board-wall-mode' : ''}`}
      onPointerMove={(e) => {
        if (!wallMode || e.pointerType === 'touch') return;
        const g = pointToWall(e);
        if (!sameWallGeom(g, previewWall)) props.onPreviewWall(g);
      }}
      onPointerLeave={(e) => {
        if (wallMode && e.pointerType !== 'touch') props.onPreviewWall(null);
      }}
      onClick={(e) => {
        if (!wallMode) return;
        const g = pointToWall(e);
        if (g) props.onPickWall(g);
      }}
      role="grid"
      aria-label="8×8 棋盤"
    >
      {cells}

      {interactive &&
        mode === 'move' &&
        moveOptions.map((o) => (
          <button
            key={`${o.to.row}-${o.to.col}`}
            type="button"
            className={`move-target move-${o.kind} move-${currentPlayer}`}
            style={{ left: `${o.to.col * PCT}%`, top: `${o.to.row * PCT}%`, width: `${PCT}%`, height: `${PCT}%` }}
            onClick={(e) => {
              e.stopPropagation();
              props.onMove(o);
            }}
            aria-label={`${o.kind === 'jump' ? '跳躍到' : '移動到'}第 ${o.to.row + 1} 列第 ${o.to.col + 1} 欄`}
          >
            {o.kind === 'jump' && <span className="jump-tag">跳</span>}
          </button>
        ))}

      {walls.map((w) => (
        <Wall key={w.id} geom={w} variant={w.owner} fresh={w.id === lastWallId} />
      ))}

      {showPreview && previewWall && (
        <Wall geom={previewWall} variant={previewCheck?.ok ? 'preview-ok' : 'preview-bad'} />
      )}
      {pendingWall && currentPlayer && <Wall geom={pendingWall} variant={`pending-${currentPlayer}`} />}

      {(['blue', 'red'] as const).map((team) => (
        <Ball
          key={team}
          team={team}
          position={players[team].position}
          active={interactive && currentPlayer === team}
          onClick={() => props.onBallClick(team)}
        />
      ))}
    </div>
  );
}
