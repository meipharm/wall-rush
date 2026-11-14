import { useEffect, useRef } from 'react';
import { TEAM_NAME } from '../game/config';
import type { PlayerId } from '../types/game';

type Props = {
  winner: PlayerId;
  turnNumber: number;
  onPlayAgain: () => void;
  onHome: () => void;
};

export function ResultScreen({ winner, turnNumber, onPlayAgain, onHome }: Props) {
  const firstBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    firstBtn.current?.focus();
  }, []);

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div className={`result-card result-${winner}`}>
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 18 }, (_, i) => (
            <span key={i} style={{ ['--i' as string]: i }} />
          ))}
        </div>
        <p className="result-kicker">突破成功</p>
        <h2 id="result-title">{TEAM_NAME[winner]}獲勝！</h2>
        <p className="result-sub">共進行 {turnNumber} 手</p>
        <div className="result-actions">
          <button ref={firstBtn} type="button" className={`btn btn-${winner}`} onClick={onPlayAgain}>
            再玩一局
          </button>
          <button type="button" className="btn btn-ghost" onClick={onHome}>
            返回首頁
          </button>
        </div>
      </div>
    </div>
  );
}
