import { box, col, digits, row } from '../lib/sudoku';
import { isGiven, type Game } from '../lib/game';
import type { Strings } from '../lib/i18n';

type Props = {
  game: Game;
  selected?: number;
  onSelect: (i: number) => void;
  t: Strings;
};

const BOXES = [0, 1, 2, 3, 4, 5, 6, 7, 8];

// Cells of box b in reading order.
const cellsOf = (b: number) =>
  [0, 1, 2, 3, 4, 5, 6, 7, 8].map(
    (k) =>
      (Math.floor(b / 3) * 3 + Math.floor(k / 3)) * 9 + (b % 3) * 3 + (k % 3)
  );

export function Board({ game, selected, onSelect, t }: Props) {
  const { values, notes, solution } = game;
  const digit = selected === undefined ? 0 : values[selected];

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
    <div className='board' role='grid'>
      {BOXES.map((b) => (
        <div key={b} className='board__box'>
          {cellsOf(b).map((i) => (
            <button
              key={i}
              className={cellClass(i)}
              onClick={() => onSelect(i)}
              aria-label={`${t.cell(row(i) + 1, col(i) + 1)}${
                values[i] ? `, ${values[i]}` : ''
              }`}
            >
              {values[i] ? (
                values[i]
              ) : notes[i] ? (
                <span className='notes'>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                    <span
                      key={d}
                      className={d === digit ? 'note note--same' : 'note'}
                    >
                      {digits(notes[i]).includes(d) ? d : ''}
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
