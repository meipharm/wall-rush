import { describe, expect, it } from 'vitest';
import { randomRpsChoice, rpsWinner } from '../game/rps';

describe('猜拳勝負', () => {
  it('勝負矩陣正確', () => {
    expect(rpsWinner('rock', 'scissors')).toBe('red');
    expect(rpsWinner('scissors', 'paper')).toBe('red');
    expect(rpsWinner('paper', 'rock')).toBe('red');
    expect(rpsWinner('scissors', 'rock')).toBe('blue');
    expect(rpsWinner('paper', 'scissors')).toBe('blue');
    expect(rpsWinner('rock', 'paper')).toBe('blue');
  });

  it('相同選擇為平手', () => {
    expect(rpsWinner('rock', 'rock')).toBeNull();
    expect(rpsWinner('paper', 'paper')).toBeNull();
    expect(rpsWinner('scissors', 'scissors')).toBeNull();
  });

  it('隨機代選只會回傳三個合法選項', () => {
    expect(randomRpsChoice(() => 0)).toBe('scissors');
    expect(randomRpsChoice(() => 0.5)).toBe('rock');
    expect(randomRpsChoice(() => 0.9999)).toBe('paper');
    expect(randomRpsChoice(() => 1)).toBe('paper');
  });
});
