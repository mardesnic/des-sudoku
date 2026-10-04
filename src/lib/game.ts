import type { Language } from './i18n';
import {
  UNITS,
  candidates,
  digits,
  has,
  type Difficulty,
  type Grid,
  type Puzzle,
} from './sudoku';

// What a cell held before a move, so the move can be undone.
type Change = { i: number; value: number };

export type Game = Puzzle & {
  values: Grid; // givens plus the player's entries
  history: Change[][];
  mistakes: number;
  hints: number;
  solved: boolean;
};

export type Settings = {
  hintLimit: number | null; // hints per game: 0 turns them off, null is unlimited
  language: Language;
  theme: Theme;
};

export const THEMES = ['default', 'narwhal'] as const;
export type Theme = (typeof THEMES)[number];

export const initialSettings: Settings = {
  hintLimit: 5,
  language: 'auto',
  theme: 'default',
};

export const HINT_LIMITS = [0, 3, 5, 10, null];

// Hard and expert puzzles are played without hints, whatever the setting.
export const hintLimitFor = (difficulty: Difficulty, limit: number | null) =>
  difficulty === 'hard' || difficulty === 'expert' ? 0 : limit;

export const hintsLeft = (game: Game, limit: number | null) =>
  limit === null ? Infinity : Math.max(limit - game.hints, 0);

export type Stats = { [D in Difficulty]: { solved: number } };

export const initialStats: Stats = {
  easy: { solved: 0 },
  medium: { solved: 0 },
  hard: { solved: 0 },
  expert: { solved: 0 },
};

export const newGame = (puzzle: Puzzle): Game => ({
  ...puzzle,
  values: [...puzzle.givens],
  history: [],
  mistakes: 0,
  hints: 0,
  solved: false,
});

export const isGiven = (game: Game, i: number) => game.givens[i] !== 0;

// Sets a cell as one undoable move.
function apply(game: Game, i: number, value: number): Game {
  if (game.values[i] === value) return game;
  const values = [...game.values];
  const change: Change = { i, value: values[i] };
  values[i] = value;
  const solved = values.every((v, j) => v === game.solution[j]);
  return { ...game, values, history: [...game.history, [change]], solved };
}

// Puts a digit in a cell, or takes it out if it's already there.
export function enter(game: Game, i: number, d: number): Game {
  if (game.solved || isGiven(game, i)) return game;
  if (game.values[i] === d) return apply(game, i, 0);
  const next = apply(game, i, d);
  const wrong = d !== game.solution[i];
  return wrong ? { ...next, mistakes: next.mistakes + 1 } : next;
}

export function erase(game: Game, i: number): Game {
  if (game.solved || isGiven(game, i)) return game;
  return apply(game, i, 0);
}

export function undo(game: Game): Game {
  const last = game.history.at(-1);
  if (!last || game.solved) return game;
  const values = [...game.values];
  for (const c of last) values[c.i] = c.value;
  return { ...game, values, history: game.history.slice(0, -1) };
}

// The cell to reveal for a hint: the selected cell when it's empty or
// wrong, otherwise the easiest cell to work out from what's on the board.
export function hintCell(game: Game, selected?: number) {
  const { values, solution } = game;
  if (selected !== undefined && values[selected] !== solution[selected]) {
    return selected;
  }
  const open = values.flatMap((v, i) => (v === solution[i] ? [] : [i]));
  if (!open.length) return undefined;

  // Judge only by correct entries, so a wrong digit can't mislead.
  const known = values.map((v, i) => (v === solution[i] ? v : 0));
  const cand = known.map((v, i) => (v ? 0 : candidates(known, i)));
  const single = open.find((i) => digits(cand[i]).length === 1);
  if (single !== undefined) return single;
  for (const unit of UNITS) {
    for (let d = 1; d <= 9; d++) {
      const spots = unit.filter((i) => has(cand[i], d));
      if (spots.length === 1) return spots[0];
    }
  }
  return open[0];
}

export function hint(game: Game, selected?: number): [Game, number?] {
  if (game.solved) return [game];
  const i = hintCell(game, selected);
  if (i === undefined) return [game];
  const next = apply(game, i, game.solution[i]);
  return [{ ...next, hints: next.hints + 1 }, i];
}

// How many of each digit are on the board, indexed 1–9.
export function placed(values: Grid) {
  const out = new Array(10).fill(0);
  for (const v of values) out[v]++;
  return out;
}

export const recordWin = (stats: Stats, game: Game): Stats => ({
  ...stats,
  [game.difficulty]: { solved: stats[game.difficulty].solved + 1 },
});
