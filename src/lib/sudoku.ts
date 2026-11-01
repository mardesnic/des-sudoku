// Grids are size × size numbers, row by row, with 0 for an empty cell:
// 81 for the usual 9×9 board, 36 for the 6×6 kids board and 16 for the
// 4×4 baby board.
export type Grid = number[];
export type Random = () => number;

export const DIFFICULTIES = [
  'baby',
  'kids',
  'easy',
  'medium',
  'hard',
  'expert',
] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export type Puzzle = {
  difficulty: Difficulty;
  givens: Grid;
  solution: Grid;
};

export type Layout = {
  size: number;
  cells: number[];
  row: (i: number) => number;
  col: (i: number) => number;
  box: (i: number) => number;
  units: number[][]; // rows, then columns, then boxes
  peers: number[][]; // cells sharing a row, column or box with each cell
  all: number; // candidate mask with every digit set
};

// 9×9 boards have 3×3 boxes, 6×6 boards have boxes 2 rows tall and 3
// columns wide, and 4×4 boards have 2×2 boxes.
const BOX_ROWS: Record<number, number> = { 4: 2, 6: 2, 9: 3 };

const layouts = new Map<number, Layout>();

export function layout(size: number): Layout {
  const cached = layouts.get(size);
  if (cached) return cached;
  const boxRows = BOX_ROWS[size];
  const boxCols = size / boxRows;
  const cells = Array.from({ length: size * size }, (_, i) => i);
  const lines = Array.from({ length: size }, (_, k) => k);
  const row = (i: number) => Math.floor(i / size);
  const col = (i: number) => i % size;
  const box = (i: number) =>
    Math.floor(row(i) / boxRows) * boxRows + Math.floor(col(i) / boxCols);
  const l: Layout = {
    size,
    cells,
    row,
    col,
    box,
    units: [row, col, box].flatMap((key) =>
      lines.map((k) => cells.filter((i) => key(i) === k))
    ),
    peers: cells.map((i) =>
      cells.filter(
        (j) =>
          j !== i &&
          (row(j) === row(i) || col(j) === col(i) || box(j) === box(i))
      )
    ),
    all: (1 << (size + 1)) - 2,
  };
  layouts.set(size, l);
  return l;
}

export const layoutOf = (grid: Grid) => layout(Math.sqrt(grid.length));

// The 4×4 baby board is played with shapes instead of digits.
export const usesShapes = (size: number) => size === 4;

// Candidate sets are bitmasks: bit d is set when digit d fits.
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
  const { all, peers } = layoutOf(grid);
  let mask = all;
  for (const p of peers[i]) mask &= ~bit(grid[p]);
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
  const { size, cells, row, col, box, all } = layoutOf(grid);
  const g = [...grid];
  // Digits used in each row, then column, then box.
  const used = new Array(3 * size).fill(0);
  const units = (i: number) => [row(i), size + col(i), 2 * size + box(i)];
  for (const i of cells) {
    if (!g[i]) continue;
    const b = bit(g[i]);
    const [r, c, bx] = units(i);
    if (used[r] & b || used[c] & b || used[bx] & b) return { count: 0 };
    used[r] |= b;
    used[c] |= b;
    used[bx] |= b;
  }

  let count = 0;
  let solution: Grid | undefined;

  const search = (): void => {
    let best = -1;
    let bestMask = 0;
    let bestCount = 10;
    for (const i of cells) {
      if (g[i]) continue;
      const [r, c, bx] = units(i);
      const mask = all & ~(used[r] | used[c] | used[bx]);
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

    const [r, c, bx] = units(best);
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
  const { size, cells, row, col, box, units, peers, all } = layoutOf(grid);
  const g = [...grid];
  const cand = cells.map((i) => (g[i] ? 0 : candidates(g, i)));
  let level = 1;

  const place = (i: number, d: number) => {
    g[i] = d;
    cand[i] = 0;
    for (const p of peers[i]) cand[p] &= ~bit(d);
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
    for (const i of cells) {
      if (!g[i] && bitCount(cand[i]) === 1) {
        place(i, digits(cand[i])[0]);
        found = true;
      }
    }
    for (const unit of units) {
      for (let d = 1; d <= size; d++) {
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
    for (const unit of units) {
      for (let d = 1; d <= size; d++) {
        const spots = unit.filter((i) => has(cand[i], d));
        if (spots.length < 2) continue;
        for (const key of [row, col, box]) {
          const k = key(spots[0]);
          if (!spots.every((i) => key(i) === k)) continue;
          const others = cells.filter((i) => key(i) === k && !unit.includes(i));
          if (eliminate(others, bit(d))) changed = true;
        }
      }
    }
    return changed;
  };

  const subsets = () => {
    let changed = false;
    for (const unit of units) {
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
      for (let a = 1; a <= size; a++) {
        const spotsA = open.filter((i) => has(cand[i], a));
        if (spotsA.length !== 2) continue;
        for (let b = a + 1; b <= size; b++) {
          const spotsB = open.filter((i) => has(cand[i], b));
          if (spotsB.length !== 2 || spotsB.some((i) => !spotsA.includes(i))) {
            continue;
          }
          if (eliminate(spotsA, all & ~(bit(a) | bit(b)))) changed = true;
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
    for (let d = 1; d <= size; d++) {
      for (const [lines, cross] of [
        [units.slice(0, size), col],
        [units.slice(size, 2 * size), row],
      ] as const) {
        const pairs = lines
          .map((line) => line.filter((i) => has(cand[i], d)))
          .filter((spots) => spots.length === 2);
        for (const [a, b] of combinations(pairs, 2)) {
          const x = a.map(cross);
          if (x[0] !== cross(b[0]) || x[1] !== cross(b[1])) continue;
          const others = cells.filter(
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

// The board size, how far to empty the grid, and the techniques each
// level may need.
const TARGETS: Record<
  Difficulty,
  { size: number; clues: number; level: number }
> = {
  baby: { size: 4, clues: 8, level: 1 },
  kids: { size: 6, clues: 16, level: 1 },
  easy: { size: 9, clues: 38, level: 1 },
  medium: { size: 9, clues: 30, level: 1 },
  hard: { size: 9, clues: 0, level: 2 },
  expert: { size: 9, clues: 0, level: 3 },
};

export const sizeOf = (difficulty: Difficulty) => TARGETS[difficulty].size;

const MAX_ATTEMPTS = 200;

export function generate(difficulty: Difficulty, random: Random): Puzzle {
  const target = TARGETS[difficulty];
  const { cells } = layout(target.size);
  const last = cells.length - 1;
  let closest: { puzzle: Puzzle; level: number } | undefined;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const solution = solve(
      new Array(cells.length).fill(0),
      1,
      random
    ).solution!;
    const givens = [...solution];

    // Clear cells in pairs mirrored through the centre, like printed
    // puzzles, keeping only removals that leave a single solution.
    let clues = cells.length;
    for (const i of shuffle(
      cells.slice(0, Math.ceil(cells.length / 2)),
      random
    )) {
      if (clues <= target.clues) break;
      const pair = i === last - i ? [i] : [i, last - i];
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
