import { useEffect, useReducer, useState } from 'react';
import { createInitialState, gameReducer } from './game/gameRules';
import { GameScreen } from './screens/GameScreen';
import { HomeScreen } from './screens/HomeScreen';
import { RpsScreen } from './screens/RpsScreen';
import { RulesScreen } from './screens/RulesScreen';
import { installAudioUnlock, loadSoundPref, playClick, playEventSound, saveSoundPref, unlockAudio } from './sound';

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const [soundOn, setSoundOn] = useState(loadSoundPref);

  // 每個遊戲事件播放一次對應音效
  useEffect(() => {
    if (soundOn && state.event.seq > 0) playEventSound(state.event.type);
  }, [state.event.seq]); // 只依事件序號觸發

  // 第一次互動時解鎖音訊（瀏覽器自動播放政策）
  useEffect(() => {
    installAudioUnlock();
  }, []);

  // 一般按鈕的點擊音（遊戲動作本身另有音效）
  useEffect(() => {
    if (!soundOn) return;
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest('.btn, .mode-btn')) playClick();
    };
    window.addEventListener('click', onClick, true);
    return () => window.removeEventListener('click', onClick, true);
  }, [soundOn]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    saveSoundPref(next);
    if (next) {
      unlockAudio();
      playEventSound('select'); // 開啟時試播，確認聽得到
    }
  };

  const goHome = () => dispatch({ type: 'GO_HOME' });
  const exitMatch = () => {
    if (window.confirm('確定離開這局？目前進度不會保存。')) goHome();
  };

  return (
    <div className="app">
      <header className="app-bar">
        <button type="button" className="brand" onClick={state.phase === 'menu' ? undefined : exitMatchOrHome}>
          <span className="brand-mark" aria-hidden="true" />
          Wall Rush<span className="brand-sub">突破防線</span>
        </button>
        <button
          type="button"
          className={`sound-toggle ${soundOn ? 'sound-on' : ''}`}
          onClick={toggleSound}
          aria-pressed={soundOn}
        >
          音效：{soundOn ? '開' : '關'}
        </button>
      </header>

      {state.phase === 'menu' && (
        <HomeScreen onStart={() => dispatch({ type: 'OPEN_RULES' })} onRules={() => dispatch({ type: 'OPEN_RULES' })} />
      )}
      {state.phase === 'rules' && (
        <RulesScreen onStart={() => dispatch({ type: 'START_RPS' })} onHome={goHome} />
      )}
      {state.phase === 'rps' && <RpsScreen state={state} dispatch={dispatch} soundOn={soundOn} onHome={goHome} />}
      {(state.phase === 'playing' || state.phase === 'gameOver') && (
        <GameScreen state={state} dispatch={dispatch} onExit={exitMatch} />
      )}
    </div>
  );

  function exitMatchOrHome() {
    if (state.phase === 'playing') exitMatch();
    else goHome();
  }
}
