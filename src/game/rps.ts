import type { PlayerId, RpsChoice } from '../types/game';

export const RPS_CHOICES: readonly RpsChoice[] = ['scissors', 'rock', 'paper'];

export const RPS_LABEL: Record<RpsChoice, string> = {
  scissors: '剪刀',
  rock: '石頭',
  paper: '布',
};

export const RPS_ICON: Record<RpsChoice, string> = {
  scissors: '✌️',
  rock: '✊',
  paper: '✋',
};

const BEATS: Record<RpsChoice, RpsChoice> = {
  rock: 'scissors',
  scissors: 'paper',
  paper: 'rock',
};

/** 回傳勝方；平手回傳 null */
export function rpsWinner(red: RpsChoice, blue: RpsChoice): PlayerId | null {
  if (red === blue) return null;
  return BEATS[red] === blue ? 'red' : 'blue';
}

export function randomRpsChoice(rng: () => number = Math.random): RpsChoice {
  const index = Math.min(RPS_CHOICES.length - 1, Math.max(0, Math.floor(rng() * RPS_CHOICES.length)));
  return RPS_CHOICES[index];
}

export function isRpsChoice(value: unknown): value is RpsChoice {
  return value === 'rock' || value === 'paper' || value === 'scissors';
}
