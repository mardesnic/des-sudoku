import { describe, expect, it } from 'vitest';

import {
  enter,
  erase,
  hint,
  hintLimitFor,
  hintsLeft,
  initialStats,
  newGame,
  placed,
  recordWin,
  undo,
  type Game,
} from './game';
import {
  DIFFICULTIES,
  PEERS,
  UNITS,
  generate,
  isUnique,
  rate,
  solve,
} from './sudoku';
import { STRINGS } from './i18n';

// Deterministic stand-in for Math.random.
function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const isValid = (grid: number[]) =>
  UNITS.every((unit) => new Set(unit.map((i) => grid[i])).size === 9);

const puzzles = Object.fromEntries(
  DIFFICULTIES.map((d) => [d, generate(d, seeded(DIFFICULTIES.indexOf(d) + 1))])
);

describe('sudoku', () => {
  it('knows each cell’s 20 peers', () => {
    expect(PEERS.every((p) => p.length === 20)).toBe(true);
  });

  it('solves a known puzzle', () => {
    const grid =
      '530070000600195000098000060800060003400803001700020006060000280000419005000080079'
        .split('')
        .map(Number);
    const { count, solution } = solve(grid, 2);
    expect(count).toBe(1);
    expect(solution!.join('').slice(0, 9)).toBe('534678912');
  });

  it('spots a puzzle with more than one solution', () => {
    expect(isUnique(new Array(81).fill(0))).toBe(false);
  });

  for (const d of DIFFICULTIES) {
    it(`generates a unique ${d} puzzle at the right level`, () => {
      const { givens, solution } = puzzles[d];
      expect(isValid(solution)).toBe(true);
      expect(givens.every((v, i) => v === 0 || v === solution[i])).toBe(true);
      expect(isUnique(givens)).toBe(true);
      expect(rate(givens)).toBe({ easy: 1, medium: 1, hard: 2, expert: 3 }[d]);
    });
  }

  it('makes harder puzzles with fewer numbers', () => {
    const clues = (d: string) => puzzles[d].givens.filter(Boolean).length;
    expect(clues('easy')).toBeGreaterThan(clues('medium'));
    expect(clues('medium')).toBeGreaterThan(clues('hard'));
  });
});

describe('game', () => {
  const start = () => newGame(puzzles.medium);
  const open = (game: Game) => game.givens.indexOf(0);

  it('enters and removes a digit', () => {
    let game = start();
    const i = open(game);
    game = enter(game, i, 5);
    expect(game.values[i]).toBe(5);
    game = enter(game, i, 5);
    expect(game.values[i]).toBe(0);
  });

  it('leaves the given numbers alone', () => {
    const game = start();
    const given = game.givens.findIndex(Boolean);
    expect(enter(game, given, 1)).toBe(game);
    expect(erase(game, given)).toBe(game);
  });

  it('counts wrong digits as mistakes', () => {
    let game = start();
    const i = open(game);
    const wrong = (game.solution[i] % 9) + 1;
    game = enter(game, i, wrong);
    expect(game.mistakes).toBe(1);
    game = enter(game, i, game.solution[i]);
    expect(game.mistakes).toBe(1);
  });

  it('starts with only the givens and no history', () => {
    const game = start();
    expect(game.values).toEqual(game.givens);
    expect(game.history).toEqual([]);
    expect(game.solved).toBe(false);
  });

  it('erases an entry as an undoable move', () => {
    let game = start();
    const i = open(game);
    game = erase(game, i);
    expect(game.history).toHaveLength(0);
    game = enter(game, i, 3);
    game = erase(game, i);
    expect(game.values[i]).toBe(0);
    game = undo(game);
    expect(game.values[i]).toBe(3);
  });

  it('does nothing to undo at the start', () => {
    const game = start();
    expect(undo(game)).toBe(game);
  });

  it('counts how many of each digit are placed', () => {
    const game = start();
    const counts = placed(game.values);
    for (let d = 1; d <= 9; d++) {
      expect(counts[d]).toBe(game.givens.filter((v) => v === d).length);
    }
    expect(placed(game.solution).slice(1)).toEqual(new Array(9).fill(9));
  });

  it('undoes moves one at a time', () => {
    let game = start();
    const i = open(game);
    game = enter(game, i, 4);
    game = enter(game, i, 7);
    game = undo(game);
    expect(game.values[i]).toBe(4);
    game = undo(game);
    expect(game.values[i]).toBe(0);
    expect(game.history).toHaveLength(0);
  });

  it('hints the selected cell, then cells that can be worked out', () => {
    let game = start();
    const i = open(game);
    let cell: number | undefined;
    [game, cell] = hint(game, i);
    expect(cell).toBe(i);
    expect(game.values[i]).toBe(game.solution[i]);
    expect(game.hints).toBe(1);

    [game, cell] = hint(game, i);
    expect(cell).not.toBe(i);
    expect(game.values[cell!]).toBe(game.solution[cell!]);
  });

  it('is solved when every cell is right, and counts the win', () => {
    let game = start();
    for (let n = 0; n < 81 && !game.solved; n++) [game] = hint(game);
    expect(game.solved).toBe(true);
    expect(game.values).toEqual(game.solution);

    const stats = recordWin(recordWin(initialStats, game), game);
    expect(stats.medium).toEqual({ solved: 2 });
    expect(stats.easy).toEqual({ solved: 0 });
  });

  it('locks the board once solved', () => {
    let game = start();
    for (let n = 0; n < 81 && !game.solved; n++) [game] = hint(game);
    const i = open(game);
    expect(enter(game, i, (game.solution[i] % 9) + 1)).toBe(game);
    expect(erase(game, i)).toBe(game);
    expect(undo(game)).toBe(game);
    expect(hint(game)).toEqual([game]);
  });

  it('becomes solved by entering the last digit', () => {
    const base = start();
    const i = open(base);
    let game: Game = {
      ...base,
      values: base.solution.map((v, j) => (j === i ? 0 : v)),
    };
    game = enter(game, i, (game.solution[i] % 9) + 1);
    expect(game.solved).toBe(false);
    game = enter(game, i, game.solution[i]);
    expect(game.solved).toBe(true);
  });
});

describe('hint limit', () => {
  it('counts down the hints left, or never runs out', () => {
    const [game] = hint(newGame(puzzles.easy));
    expect(hintsLeft(game, 5)).toBe(4);
    expect(hintsLeft({ ...game, hints: 7 }, 5)).toBe(0);
    expect(hintsLeft(game, 0)).toBe(0);
    expect(hintsLeft(game, null)).toBe(Infinity);
  });

  it('gives no hints on hard and expert puzzles', () => {
    expect(hintLimitFor('easy', 5)).toBe(5);
    expect(hintLimitFor('medium', null)).toBe(null);
    expect(hintLimitFor('hard', 5)).toBe(0);
    expect(hintLimitFor('expert', null)).toBe(0);
  });
});

describe('translations', () => {
  it('has every string in Croatian', () => {
    expect(Object.keys(STRINGS.hr).sort()).toEqual(
      Object.keys(STRINGS.en).sort()
    );
  });

  it('uses the Croatian plural forms', () => {
    const { mistakes, hintsUsed } = STRINGS.hr;
    expect([1, 2, 5, 11, 21, 22, 25].map(mistakes)).toEqual([
      '1 greška',
      '2 greške',
      '5 grešaka',
      '11 grešaka',
      '21 greška',
      '22 greške',
      '25 grešaka',
    ]);
    expect(hintsUsed(3)).toBe('3 savjeta');
    expect(STRINGS.en.mistakes(1)).toBe('1 mistake');
  });
});
