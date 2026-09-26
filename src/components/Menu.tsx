import { capitalize, formatTime } from '../lib/format';
import { DIFFICULTIES, type Difficulty } from '../lib/sudoku';
import type { Settings, Stats } from '../lib/game';

export function NewGame({
  stats,
  onStart,
}: {
  stats: Stats;
  onStart: (d: Difficulty) => void;
}) {
  return (
    <section className='card'>
      <h2>New game</h2>
      <div className='levels'>
        {DIFFICULTIES.map((d) => (
          <button key={d} className='level' onClick={() => onStart(d)}>
            <span>{capitalize(d)}</span>
            <span className='muted'>
              {stats[d].best === undefined
                ? DESCRIPTIONS[d]
                : `Best ${formatTime(stats[d].best)}`}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

const DESCRIPTIONS: Record<Difficulty, string> = {
  easy: 'Plenty of numbers to start',
  medium: 'Fewer numbers to start',
  hard: 'Needs a few tricks',
  expert: 'Needs pairs and X-wings',
};

export function SettingsView({
  settings,
  setSettings,
  stats,
}: {
  settings: Settings;
  setSettings: (s: Settings) => void;
  stats: Stats;
}) {
  const toggle = (key: keyof Settings, label: string, detail: string) => (
    <label className='check'>
      <input
        type='checkbox'
        checked={settings[key]}
        onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
      />
      <span>
        {label}
        <span className='muted'>{detail}</span>
      </span>
    </label>
  );

  return (
    <>
      <section className='card'>
        <h2>Settings</h2>
        {toggle(
          'showMistakes',
          'Show mistakes',
          'Wrong numbers turn red. When off, only numbers that repeat in a row, column or box do.'
        )}
        {toggle(
          'autoNotes',
          'Tidy notes',
          'Entering a number removes it from the notes in its row, column and box.'
        )}
        {toggle(
          'showTimer',
          'Show timer',
          'The time is still recorded when hidden.'
        )}
      </section>

      <section className='card'>
        <h2>Statistics</h2>
        <table className='stats'>
          <thead>
            <tr>
              <th />
              <th>Solved</th>
              <th>Best</th>
              <th>Average</th>
            </tr>
          </thead>
          <tbody>
            {DIFFICULTIES.map((d) => {
              const s = stats[d];
              return (
                <tr key={d}>
                  <th>{capitalize(d)}</th>
                  <td>{s.solved}</td>
                  <td>{s.best === undefined ? '–' : formatTime(s.best)}</td>
                  <td>{s.solved ? formatTime(s.total / s.solved) : '–'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
