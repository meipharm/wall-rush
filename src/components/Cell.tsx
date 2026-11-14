import { BOARD_SIZE, GOAL_ROW } from '../game/config';

const PCT = 100 / BOARD_SIZE;

type Props = { row: number; col: number };

export function Cell({ row, col }: Props) {
  const goal = row === GOAL_ROW.red ? 'goal-red' : row === GOAL_ROW.blue ? 'goal-blue' : '';
  return (
    <div
      className={`cell ${goal} ${(row + col) % 2 === 0 ? 'cell-even' : 'cell-odd'}`}
      style={{ left: `${col * PCT}%`, top: `${row * PCT}%`, width: `${PCT}%`, height: `${PCT}%` }}
      aria-hidden="true"
    />
  );
}
