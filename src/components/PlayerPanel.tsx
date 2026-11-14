import { GOAL_ROW, INITIAL_WALLS, TEAM_NAME } from '../game/config';
import type { PlayerId, PlayerState } from '../types/game';

type Props = {
  team: PlayerId;
  state: PlayerState;
  active: boolean;
  distance: number | null;
};

export function PlayerPanel({ team, state, active, distance }: Props) {
  return (
    <section className={`panel panel-${team} ${active ? 'panel-active' : ''}`} aria-label={`${TEAM_NAME[team]}資訊`}>
      <header className="panel-head">
        <span className={`dot dot-${team}`} />
        <h2>{TEAM_NAME[team]}</h2>
        {active && <span className="turn-badge">行動中</span>}
      </header>
      <dl className="panel-stats">
        <div>
          <dt>目標</dt>
          <dd>第 {GOAL_ROW[team] + 1} 列</dd>
        </div>
        <div>
          <dt>位置</dt>
          <dd>
            ({state.position.row + 1},{state.position.col + 1})
          </dd>
        </div>
        <div>
          <dt>最短路徑</dt>
          <dd>{distance === null ? '—' : `${distance} 步`}</dd>
        </div>
      </dl>
      <div className="walls-left">
        <span className="walls-label">
          剩餘牆 <strong>{state.wallsRemaining}</strong> / {INITIAL_WALLS}
        </span>
        <div className="wall-pips" aria-hidden="true">
          {Array.from({ length: INITIAL_WALLS }, (_, i) => (
            <span key={i} className={`pip ${i < state.wallsRemaining ? `pip-on pip-${team}` : ''}`} />
          ))}
        </div>
      </div>
    </section>
  );
}
