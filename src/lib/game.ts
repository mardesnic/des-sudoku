import type { Language } from './i18n';
import {
  PEERS,
  UNITS,
  bit,
  candidates,
  digits,
  has,
  type Difficulty,
  type Grid,
  type Puzzle,
} from './sudoku';

// What a cell held before a move, so the move can be undone.
type Change = { i: number; value: number; notes: number };

export type Game = Puzzle & {
  values: Grid; // givens plus the player's entries
  notes: number[]; // pencil marks as digit bitmasks
  history: Change[][];
  mistakes: number;
  hints: number;
  elapsed: number; // ms of play, paused while hidden or paused
  solved: boolean;
};

export type Settings = {
  showMistakes: boolean;
  autoNotes: boolean; // clear a digit's pencil marks from peers on entry
  showTimer: boolean;
  hintLimit: number | null; // hints per game: 0 turns them off, null is unlimited
  language: Language;
};

export const initialSettings: Settings = {
  showMistakes: true,
  autoNotes: true,
  showTimer: true,
  hintLimit: 5,
  language: 'auto',
};

export const HINT_LIMITS = [0, 3, 5, 10, null];

export const hintsLeft = (game: Game, limit: number | null) =>
  limit === null ? Infinity : Math.max(limit - game.hints, 0);

export type Best = { solved: number; best?: number; total: number };
export type Stats = { [D in Difficulty]: Best };

export const initialStats: Stats = {
  easy: { solved: 0, total: 0 },
  medium: { solved: 0, total: 0 },
  hard: { solved: 0, total: 0 },
  expert: { solved: 0, total: 0 },
};

export const newGame = (puzzle: Puzzle): Game => ({
  ...puzzle,
  values: [...puzzle.givens],
  notes: new Array(81).fill(0),
  history: [],
  mistakes: 0,
  hints: 0,
  elapsed: 0,
  solved: false,
});

export const isGiven = (game: Game, i: number) => game.givens[i] !== 0;

// Applies cell updates as one undoable move.
function apply(
  game: Game,
  updates: { i: number; value?: number; notes?: number }[]
): Game {
  const values = [...game.values];
  const notes = [...game.notes];
  const changes: Change[] = [];
  for (const u of updates) {
    const value = u.value ?? values[u.i];
    const note = u.notes ?? notes[u.i];
    if (value === values[u.i] && note === notes[u.i]) continue;
    changes.push({ i: u.i, value: values[u.i], notes: notes[u.i] });
    values[u.i] = value;
    notes[u.i] = note;
  }
  if (!changes.length) return game;
  const solved = values.every((v, i) => v === game.solution[i]);
  return {
    ...game,
    values,
    notes,
    history: [...game.history, changes],
    solved,
  };
}

// Puts a digit in a cell, or takes it out if it's already there.
export function enter(
  game: Game,
  i: number,
  d: number,
  settings: Settings
): Game {
  if (game.solved || isGiven(game, i)) return game;
  if (game.values[i] === d) return apply(game, [{ i, value: 0 }]);

  const updates = [{ i, value: d, notes: 0 }];
  if (settings.autoNotes) {
    for (const p of PEERS[i]) {
      if (has(game.notes[p], d)) {
        updates.push({
          i: p,
          value: game.values[p],
          notes: game.notes[p] & ~bit(d),
        });
      }
    }
  }
  const next = apply(game, updates);
  const wrong = d !== game.solution[i];
  return wrong ? { ...next, mistakes: next.mistakes + 1 } : next;
}

export function toggleNote(game: Game, i: number, d: number): Game {
  if (game.solved || isGiven(game, i)) return game;
  // A pencil mark replaces an entry, like writing over it.
  const notes = game.values[i] ? bit(d) : game.notes[i] ^ bit(d);
  return apply(game, [{ i, value: 0, notes }]);
}

export function erase(game: Game, i: number): Game {
  if (game.solved || isGiven(game, i)) return game;
  return apply(game, [{ i, value: 0, notes: 0 }]);
}

export function undo(game: Game): Game {
  const last = game.history.at(-1);
  if (!last || game.solved) return game;
  const values = [...game.values];
  const notes = [...game.notes];
  for (const c of last) {
    values[c.i] = c.value;
    notes[c.i] = c.notes;
  }
  return { ...game, values, notes, history: game.history.slice(0, -1) };
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
  const d = game.solution[i];
  const updates = [{ i, value: d, notes: 0 }];
  for (const p of PEERS[i]) {
    if (has(game.notes[p], d)) {
      updates.push({
        i: p,
        value: game.values[p],
        notes: game.notes[p] & ~bit(d),
      });
    }
  }
  const next = apply(game, updates);
  return [{ ...next, hints: next.hints + 1 }, i];
}

// Cells whose digit repeats in a row, column or box.
export function conflicts(values: Grid) {
  const out = new Set<number>();
  for (const unit of UNITS) {
    for (const i of unit) {
      if (values[i] && unit.some((j) => j !== i && values[j] === values[i])) {
        out.add(i);
      }
    }
  }
  return out;
}

// How many of each digit are on the board, indexed 1–9.
export function placed(values: Grid) {
  const out = new Array(10).fill(0);
  for (const v of values) out[v]++;
  return out;
}

export function recordWin(stats: Stats, game: Game): Stats {
  const r = stats[game.difficulty];
  return {
    ...stats,
    [game.difficulty]: {
      solved: r.solved + 1,
      total: r.total + game.elapsed,
      best:
        r.best === undefined ? game.elapsed : Math.min(r.best, game.elapsed),
    },
  };
}
