import type { ReactNode } from 'react';

import { usesShapes } from '../lib/sudoku';

// Shapes for the digits 1–4 on the baby board. Each shape
// has its own color too, so they can be told apart either way.
const SHAPES: Record<number, ReactNode> = {
  1: <circle cx='12' cy='12' r='9' />,
  2: <rect x='3.5' y='3.5' width='17' height='17' rx='2' />,
  3: <path d='M12 3 22 20.5H2Z' />,
  4: (
    <path d='m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8Z' />
  ),
};

export function Glyph({ value, size }: { value: number; size: number }) {
  if (!usesShapes(size)) return value;
  return (
    <svg
      className={`shape shape--${value}`}
      viewBox='0 0 24 24'
      aria-hidden='true'
    >
      {SHAPES[value]}
    </svg>
  );
}
