import { digits, layoutOf, usesShapes } from '../lib/sudoku';
import { isGiven, type Game } from '../lib/game';
import type { Strings } from '../lib/i18n';
import { Glyph } from './Glyph';

type Props = {
  game: Game;
  selected?: number;
  onSelect: (i: number) => void;
  t: Strings;
};

export function Board({ game, selected, onSelect, t }: Props) {
  const { values, notes, solution } = game;
  const { size, cells, row, col, box } = layoutOf(values);
  const digit = selected === undefined ? 0 : values[selected];
  const boxes = Array.from({ length: size }, (_, b) => b);
  const noteDigits = Array.from({ length: size }, (_, k) => k + 1);
  const name = (v: number) => (usesShapes(size) ? t.shapes[v - 1] : v);

  const cellClass = (i: number) => {
    const classes = ['cell'];
    const v = values[i];
    if (isGiven(game, i)) classes.push('cell--given');
    else if (v) classes.push('cell--entry');
    if (v && v !== solution[i]) classes.push('cell--wrong');
    if (i === selected) classes.push('cell--selected');
    else if (digit && v === digit) classes.push('cell--same');
    else if (
      selected !== undefined &&
      (row(i) === row(selected) ||
        col(i) === col(selected) ||
        box(i) === box(selected))
    ) {
      classes.push('cell--peer');
    }
    return classes.join(' ');
  };

  return (
    <div className={`board board--${size}`} role='grid'>
      {boxes.map((b) => (
        <div key={b} className='board__box'>
          {cells
            .filter((i) => box(i) === b)
            .map((i) => (
              <button
                key={i}
                className={cellClass(i)}
                onClick={() => onSelect(i)}
                aria-label={`${t.cell(row(i) + 1, col(i) + 1)}${
                  values[i] ? `, ${name(values[i])}` : ''
                }`}
              >
                {values[i] ? (
                  <Glyph value={values[i]} size={size} />
                ) : notes[i] ? (
                  <span className='notes'>
                    {noteDigits.map((d) => (
                      <span
                        key={d}
                        className={d === digit ? 'note note--same' : 'note'}
                      >
                        {digits(notes[i]).includes(d) && (
                          <Glyph value={d} size={size} />
                        )}
                      </span>
                    ))}
                  </span>
                ) : null}
              </button>
            ))}
        </div>
      ))}
    </div>
  );
}
