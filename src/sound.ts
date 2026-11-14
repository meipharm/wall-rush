import type { GameEventType } from './types/game';

// 以 Web Audio 即時合成音效，不需外部音檔。
// 瀏覽器（尤其 iOS Safari）要求在使用者點擊／按鍵的當下解鎖音訊，
// 因此由 installAudioUnlock() 在第一次互動時建立並啟動 AudioContext。

const STORAGE_KEY = 'wall-rush:sound';
const MASTER_VOLUME = 0.9;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function createContext(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      // 主音量 + 壓縮器：音量夠大又不爆音
      const comp = ctx.createDynamicsCompressor();
      master = ctx.createGain();
      master.gain.value = MASTER_VOLUME;
      master.connect(comp).connect(ctx.destination);
    }
    return ctx;
  } catch {
    return null;
  }
}

/** 必須在使用者手勢事件中呼叫，才能確實解鎖音訊 */
export function unlockAudio() {
  const ac = createContext();
  if (!ac) return;
  try {
    if (ac.state !== 'running') void ac.resume();
    // iOS 需播放一段無聲緩衝才算解鎖
    const buffer = ac.createBuffer(1, 1, 22050);
    const src = ac.createBufferSource();
    src.buffer = buffer;
    src.connect(ac.destination);
    src.start(0);
  } catch {
    // 忽略：不支援時維持無音效
  }
}

/** 掛上全域互動監聽，在第一次點擊／觸控／按鍵時解鎖音訊 */
export function installAudioUnlock() {
  // Safari 16.4+：讓網頁音效不受 iPhone 靜音開關影響
  try {
    const nav = navigator as unknown as { audioSession?: { type: string } };
    if (nav.audioSession) nav.audioSession.type = 'playback';
  } catch {
    // 不支援則略過
  }
  const handler = () => {
    unlockAudio();
    if (ctx && ctx.state === 'running') {
      for (const ev of events) window.removeEventListener(ev, handler, true);
    }
  };
  const events = ['pointerdown', 'touchend', 'keydown', 'click'] as const;
  for (const ev of events) window.addEventListener(ev, handler, true);
}

function tone(freq: number, duration: number, type: OscillatorType = 'triangle', gain = 0.35, delay = 0) {
  const ac = createContext();
  if (!ac || !master) return;
  if (ac.state === 'suspended') void ac.resume();
  const start = ac.currentTime + 0.01 + delay;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp).connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

export function playEventSound(type: GameEventType) {
  switch (type) {
    case 'move':
      tone(523, 0.16);
      tone(784, 0.14, 'sine', 0.2, 0.02);
      break;
    case 'jump':
      tone(440, 0.14);
      tone(880, 0.2, 'triangle', 0.35, 0.1);
      break;
    case 'wall':
      tone(130, 0.25, 'square', 0.25);
      tone(196, 0.18, 'square', 0.2, 0.06);
      break;
    case 'invalid':
      tone(220, 0.14, 'sawtooth', 0.22);
      tone(165, 0.22, 'sawtooth', 0.22, 0.12);
      break;
    case 'rpsPick':
      tone(660, 0.15, 'triangle', 0.3);
      break;
    case 'reveal':
      tone(523, 0.16, 'triangle', 0.3, 0);
      tone(659, 0.16, 'triangle', 0.3, 0.12);
      tone(784, 0.22, 'triangle', 0.3, 0.24);
      break;
    case 'select':
      tone(784, 0.18, 'triangle', 0.3);
      tone(1047, 0.22, 'sine', 0.25, 0.1);
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.32, 'triangle', 0.35, i * 0.14));
      tone(1319, 0.6, 'sine', 0.25, 0.6);
      break;
    default:
      break;
  }
}

/** 一般按鈕點擊音 */
export function playClick() {
  tone(880, 0.07, 'triangle', 0.18);
}

export function playTick() {
  tone(1000, 0.06, 'square', 0.12);
}

export function loadSoundPref(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function saveSoundPref(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    // 無法存取 localStorage 時僅本次有效
  }
}
