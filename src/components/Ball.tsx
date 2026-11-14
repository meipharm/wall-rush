import { BOARD_SIZE, TEAM_NAME } from '../game/config';
import type { PlayerId, Position } from '../types/game';

const PCT = 100 / BOARD_SIZE;

type Props = { team: PlayerId; position: Position; active: boolean; onClick?: () => void };

export function Ball({ team, position, active, onClick }: Props) {
  return (
    <button
      type="button"
      className={`ball ball-${team} ${active ? 'ball-active' : ''}`}
      style={{ left: `${(position.col + 0.5) * PCT}%`, top: `${(position.row + 0.5) * PCT}%` }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      tabIndex={-1}
      aria-label={`${TEAM_NAME[team]}的球，位於第 ${position.row + 1} 列第 ${position.col + 1} 欄`}
    />
  );
}
