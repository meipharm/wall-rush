import type { GameEventType } from './types/game';

// 以 Web Audio 即時合成簡短音效，不需外部音檔；只在使用者操作後播放

const STORAGE_KEY = 'wall-rush:sound';
let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.07, delay = 0) {
  const ac = getContext();
  if (!ac) return;
  const start = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  amp.gain.setValueAtTime(0.0001, start);
  amp.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playEventSound(type: GameEventType) {
  switch (type) {
    case 'move':
      tone(520, 0.09, 'triangle');
      break;
    case 'jump':
      tone(440, 0.08, 'triangle');
      tone(700, 0.12, 'triangle', 0.07, 0.08);
      break;
    case 'wall':
      tone(160, 0.16, 'square', 0.05);
      tone(240, 0.1, 'square', 0.04, 0.05);
      break;
    case 'invalid':
      tone(180, 0.18, 'sawtooth', 0.04);
      break;
    case 'rpsPick':
      tone(660, 0.07, 'sine');
      break;
    case 'reveal':
      tone(523, 0.1, 'triangle', 0.06, 0);
      tone(659, 0.1, 'triangle', 0.06, 0.1);
      break;
    case 'select':
      tone(784, 0.12, 'sine', 0.05);
      break;
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.07, i * 0.12));
      break;
    default:
      break;
  }
}

export function playTick() {
  tone(900, 0.04, 'square', 0.025);
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
