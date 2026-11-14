import { TEAM_NAME } from '../game/config';
import type { PlayerId } from '../types/game';

type Props = { player: PlayerId | null; turnNumber: number };

export function TurnIndicator({ player, turnNumber }: Props) {
  if (!player) return null;
  return (
    <div className={`turn-indicator turn-${player}`} aria-live="polite">
      <span className={`dot dot-${player}`} />
      <strong>{TEAM_NAME[player]}的回合</strong>
      <span className="turn-count">第 {turnNumber} 手</span>
    </div>
  );
}
