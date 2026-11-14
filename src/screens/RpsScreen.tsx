import { useEffect, type Dispatch } from 'react';
import { RPS_TIME_LIMIT_SECONDS, TEAM_NAME } from '../game/config';
import type { GameAction } from '../game/gameRules';
import { RPS_CHOICES, RPS_ICON, RPS_LABEL, randomRpsChoice, rpsWinner } from '../game/rps';
import type { GameState, PlayerId } from '../types/game';
import { playTick } from '../sound';

type Props = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  soundOn: boolean;
  onHome: () => void;
};

export function RpsScreen({ state, dispatch, soundOn, onHome }: Props) {
  const { rps } = state;
  const picking: PlayerId | null = rps.stage === 'redPick' ? 'red' : rps.stage === 'bluePick' ? 'blue' : null;

  // 倒數計時：只在選擇階段運作
  useEffect(() => {
    if (!picking) return;
    const id = window.setInterval(() => {
      dispatch({ type: 'RPS_TICK', fallbackChoice: randomRpsChoice() });
    }, 1000);
    return () => window.clearInterval(id);
  }, [picking, rps.round, dispatch]);

  useEffect(() => {
    if (soundOn && picking && rps.secondsLeft <= 3 && rps.secondsLeft > 0) playTick();
  }, [soundOn, picking, rps.secondsLeft]);

  const progress = rps.secondsLeft / RPS_TIME_LIMIT_SECONDS;

  return (
    <main className="rps">
      <header className="rps-head">
        <h1>猜拳決定先手</h1>
        <span className="rps-round">第 {rps.round} 輪</span>
      </header>

      {picking && (
        <section className={`rps-card rps-${picking}`}>
          <p className="rps-who">
            <span className={`dot dot-${picking}`} />
            {TEAM_NAME[picking]}請選擇
          </p>
          <p className="rps-privacy">
            {picking === 'red' ? '藍隊請先別看畫面' : '紅隊請先別看畫面'}。按下即鎖定，不能更改。
          </p>
          <div className="countdown" style={{ ['--p' as string]: progress }} aria-live="polite">
            <span>{rps.secondsLeft}</span>
          </div>
          <div className="rps-choices">
            {RPS_CHOICES.map((choice) => (
              <button
                key={choice}
                type="button"
                className={`rps-choice rps-choice-${picking}`}
                onClick={() => dispatch({ type: 'RPS_PICK', player: picking, choice })}
              >
                <span className="rps-icon" aria-hidden="true">
                  {RPS_ICON[choice]}
                </span>
                {RPS_LABEL[choice]}
              </button>
            ))}
          </div>
        </section>
      )}

      {rps.stage === 'passToBlue' && (
        <section className="rps-card rps-pass">
          <p className="rps-locked">紅隊已鎖定選擇（內容保密）</p>
          {rps.autoPicked.red && <p className="rps-auto">紅隊逾時，系統已隨機代選。</p>}
          <p className="rps-who">
            <span className="dot dot-blue" />
            請將畫面交給藍隊
          </p>
          <button
            type="button"
            className="btn btn-blue btn-large"
            onClick={() => dispatch({ type: 'RPS_BLUE_READY' })}
          >
            藍隊：我準備好了
          </button>
        </section>
      )}

      {rps.stage === 'reveal' && rps.redChoice && rps.blueChoice && (
        <RevealView
          red={rps.redChoice}
          blue={rps.blueChoice}
          autoPicked={rps.autoPicked}
          onContinue={() => dispatch({ type: 'RPS_CONTINUE' })}
        />
      )}

      {state.notice && rps.stage === 'redPick' && (
        <p className={`notice notice-${state.notice.tone}`}>{state.notice.text}</p>
      )}

      <button type="button" className="btn btn-ghost btn-small rps-exit" onClick={onHome}>
        返回首頁
      </button>
    </main>
  );
}

function RevealView({
  red,
  blue,
  autoPicked,
  onContinue,
}: {
  red: NonNullable<GameState['rps']['redChoice']>;
  blue: NonNullable<GameState['rps']['blueChoice']>;
  autoPicked: Record<PlayerId, boolean>;
  onContinue: () => void;
}) {
  const winner = rpsWinner(red, blue);
  return (
    <section className="rps-card rps-reveal">
      <div className="reveal-row">
        <div className={`reveal-hand reveal-red ${winner === 'red' ? 'reveal-win' : ''}`}>
          <span className="reveal-team">紅隊</span>
          <span className="rps-icon big" aria-hidden="true">
            {RPS_ICON[red]}
          </span>
          <span>{RPS_LABEL[red]}</span>
          {autoPicked.red && <small>（逾時代選）</small>}
        </div>
        <span className="reveal-vs">VS</span>
        <div className={`reveal-hand reveal-blue ${winner === 'blue' ? 'reveal-win' : ''}`}>
          <span className="reveal-team">藍隊</span>
          <span className="rps-icon big" aria-hidden="true">
            {RPS_ICON[blue]}
          </span>
          <span>{RPS_LABEL[blue]}</span>
          {autoPicked.blue && <small>（逾時代選）</small>}
        </div>
      </div>
      <p className="reveal-result">{winner ? `${TEAM_NAME[winner]}獲勝，取得先手！` : '平手！'}</p>
      <button
        type="button"
        className={`btn btn-large ${winner ? `btn-${winner}` : 'btn-primary'}`}
        onClick={onContinue}
        autoFocus
      >
        {winner ? '開始對戰' : '重新猜拳（交給紅隊）'}
      </button>
    </section>
  );
}
