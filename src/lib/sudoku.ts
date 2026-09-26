// Grids are 81 numbers, row by row, with 0 for an empty cell.
export type Grid = number[];
export type Random = () => number;

export const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export type Puzzle = {
  difficulty: Difficulty;
  givens: Grid;
  solution: Grid;
};

export const row = (i: number) => Math.floor(i / 9);
export const col = (i: number) => i % 9;
export const box = (i: number) =>
  Math.floor(row(i) / 3) * 3 + Math.floor(col(i) / 3);

const CELLS = Array.from({ length: 81 }, (_, i) => i);

// The 27 rows, columns and boxes.
export const UNITS: number[][] = [
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((r) => CELLS.filter((i) => row(i) === r)),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => CELLS.filter((i) => col(i) === c)),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((b) => CELLS.filter((i) => box(i) === b)),
];

// The 20 cells that share a row, column or box with each cell.
export const PEERS: number[][] = CELLS.map((i) =>
  CELLS.filter(
    (j) =>
      j !== i && (row(j) === row(i) || col(j) === col(i) || box(j) === box(i))
  )
);

// Candidate sets are bitmasks: bit d is set when digit d (1–9) fits.
export const ALL = 0b1111111110;
export const bit = (d: number) => 1 << d;
export const has = (mask: number, d: number) => (mask & bit(d)) !== 0;

export function bitCount(mask: number) {
  let n = 0;
  for (; mask; mask &= mask - 1) n++;
  return n;
}

export function digits(mask: number) {
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (has(mask, d)) out.push(d);
  return out;
}

export function candidates(grid: Grid, i: number) {
  let mask = ALL;
  for (const p of PEERS[i]) mask &= ~bit(grid[p]);
  return mask;
}

export function shuffle<T>(items: T[], random: Random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Backtracking search, always trying the cell with the fewest candidates.
// Stops after `limit` solutions: 2 is enough to tell a puzzle isn't unique.
export function solve(
  grid: Grid,
  limit = 1,
  random?: Random
): { count: number; solution?: Grid } {
  const g = [...grid];
  const used = new Array(27).fill(0);
  for (const i of CELLS) {
    if (!g[i]) continue;
    const b = bit(g[i]);
    if (used[row(i)] & b || used[9 + col(i)] & b || used[18 + box(i)] & b) {
      return { count: 0 };
    }
    used[row(i)] |= b;
    used[9 + col(i)] |= b;
    used[18 + box(i)] |= b;
  }

  let count = 0;
  let solution: Grid | undefined;

  const search = (): void => {
    let best = -1;
    let bestMask = 0;
    let bestCount = 10;
    for (const i of CELLS) {
      if (g[i]) continue;
      const mask = ALL & ~(used[row(i)] | used[9 + col(i)] | used[18 + box(i)]);
      const n = bitCount(mask);
      if (n === 0) return;
      if (n < bestCount) {
        best = i;
        bestMask = mask;
        bestCount = n;
        if (n === 1) break;
      }
    }
    if (best === -1) {
      count++;
      solution ??= [...g];
      return;
    }

    const r = row(best);
    const c = 9 + col(best);
    const bx = 18 + box(best);
    const options = random
      ? shuffle(digits(bestMask), random)
      : digits(bestMask);
    for (const d of options) {
      const b = bit(d);
      g[best] = d;
      used[r] |= b;
      used[c] |= b;
      used[bx] |= b;
      search();
      g[best] = 0;
      used[r] &= ~b;
      used[c] &= ~b;
      used[bx] &= ~b;
      if (count >= limit) return;
    }
  };

  search();
  return { count, solution };
}

export const isUnique = (grid: Grid) => solve(grid, 2).count === 1;

// Solves the way a person would, and returns the hardest technique it
// needed: 1 singles, 2 locked candidates, 3 pairs, triples and X-wings,
// 4 something beyond those.
export function rate(grid: Grid): number {
  const g = [...grid];
  const cand = CELLS.map((i) => (g[i] ? 0 : candidates(g, i)));
  let level = 1;

  const place = (i: number, d: number) => {
    g[i] = d;
    cand[i] = 0;
    for (const p of PEERS[i]) cand[p] &= ~bit(d);
  };

  const eliminate = (cells: number[], mask: number) => {
    let changed = false;
    for (const i of cells) {
      if (cand[i] & mask) {
        cand[i] &= ~mask;
        changed = true;
      }
    }
    return changed;
  };

  const singles = () => {
    let found = false;
    for (const i of CELLS) {
      if (!g[i] && bitCount(cand[i]) === 1) {
        place(i, digits(cand[i])[0]);
        found = true;
      }
    }
    for (const unit of UNITS) {
      for (let d = 1; d <= 9; d++) {
        const spots = unit.filter((i) => has(cand[i], d));
        if (spots.length === 1) {
          place(spots[0], d);
          found = true;
        }
      }
    }
    return found;
  };

  // A digit confined to one row or column of a box can't be elsewhere in
  // that line, and a digit confined to one box within a line can't be
  // elsewhere in that box.
  const lockedCandidates = () => {
    let changed = false;
    for (const unit of UNITS) {
      for (let d = 1; d <= 9; d++) {
        const spots = unit.filter((i) => has(cand[i], d));
        if (spots.length < 2) continue;
        for (const key of [row, col, box]) {
          const k = key(spots[0]);
          if (!spots.every((i) => key(i) === k)) continue;
          const others = CELLS.filter((i) => key(i) === k && !unit.includes(i));
          if (eliminate(others, bit(d))) changed = true;
        }
      }
    }
    return changed;
  };

  const subsets = () => {
    let changed = false;
    for (const unit of UNITS) {
      const open = unit.filter((i) => !g[i]);
      // Naked pairs and triples: n cells that between them allow only n
      // digits take those digits from the rest of the unit.
      for (const size of [2, 3]) {
        const small = open.filter((i) => bitCount(cand[i]) <= size);
        for (const group of combinations(small, size)) {
          const mask = group.reduce((m, i) => m | cand[i], 0);
          if (bitCount(mask) !== size) continue;
          const rest = open.filter((i) => !group.includes(i));
          if (eliminate(rest, mask)) changed = true;
        }
      }
      // Hidden pairs: two digits that fit only in the same two cells.
      for (let a = 1; a <= 9; a++) {
        const spotsA = open.filter((i) => has(cand[i], a));
        if (spotsA.length !== 2) continue;
        for (let b = a + 1; b <= 9; b++) {
          const spotsB = open.filter((i) => has(cand[i], b));
          if (spotsB.length !== 2 || spotsB.some((i) => !spotsA.includes(i))) {
            continue;
          }
          if (eliminate(spotsA, ALL & ~(bit(a) | bit(b)))) changed = true;
        }
      }
    }
    return changed;
  };

  // A digit that fits in the same two columns of two rows must be in those
  // columns in those rows, so it can't be anywhere else in the columns.
  // Likewise with rows and columns swapped.
  const xWing = () => {
    let changed = false;
    for (let d = 1; d <= 9; d++) {
      for (const [lines, cross] of [
        [UNITS.slice(0, 9), col],
        [UNITS.slice(9, 18), row],
      ] as const) {
        const pairs = lines
          .map((line) => line.filter((i) => has(cand[i], d)))
          .filter((spots) => spots.length === 2);
        for (const [a, b] of combinations(pairs, 2)) {
          const x = a.map(cross);
          if (x[0] !== cross(b[0]) || x[1] !== cross(b[1])) continue;
          const others = CELLS.filter(
            (i) => x.includes(cross(i)) && !a.includes(i) && !b.includes(i)
          );
          if (eliminate(others, bit(d))) changed = true;
        }
      }
    }
    return changed;
  };

  while (g.includes(0)) {
    if (singles()) continue;
    if (lockedCandidates()) {
      level = Math.max(level, 2);
      continue;
    }
    if (subsets() || xWing()) {
      level = Math.max(level, 3);
      continue;
    }
    return 4;
  }
  return level;
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  const out: T[][] = [];
  items.forEach((item, i) => {
    for (const rest of combinations(items.slice(i + 1), size - 1)) {
      out.push([item, ...rest]);
    }
  });
  return out;
}

// How far to empty the grid, and the techniques each level may need.
const TARGETS: Record<Difficulty, { clues: number; level: number }> = {
  easy: { clues: 38, level: 1 },
  medium: { clues: 30, level: 1 },
  hard: { clues: 0, level: 2 },
  expert: { clues: 0, level: 3 },
};

const MAX_ATTEMPTS = 200;

export function generate(difficulty: Difficulty, random: Random): Puzzle {
  const target = TARGETS[difficulty];
  let closest: { puzzle: Puzzle; level: number } | undefined;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const solution = solve(new Array(81).fill(0), 1, random).solution!;
    const givens = [...solution];

    // Clear cells in pairs mirrored through the centre, like printed
    // puzzles, keeping only removals that leave a single solution.
    let clues = 81;
    for (const i of shuffle(CELLS.slice(0, 41), random)) {
      if (clues <= target.clues) break;
      const pair = i === 40 ? [40] : [i, 80 - i];
      for (const j of pair) givens[j] = 0;
      if (isUnique(givens)) {
        clues -= pair.length;
      } else {
        for (const j of pair) givens[j] = solution[j];
      }
    }

    const level = rate(givens);
    const puzzle = { difficulty, givens, solution };
    if (level === target.level) return puzzle;
    // Rarely, the right level doesn't turn up; settle for the nearest
    // rather than keep the player waiting.
    const off = Math.abs(level - target.level);
    if (!closest || off < Math.abs(closest.level - target.level)) {
      closest = { puzzle, level };
    }
  }
  return closest!.puzzle;
}
