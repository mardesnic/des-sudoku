import { useState } from 'react';

import { formatTime } from '../lib/format';
import { HINT_LIMITS, type Settings, type Stats } from '../lib/game';
import { LANG_NAMES, LANGS, type Language, type Strings } from '../lib/i18n';
import { DIFFICULTIES, type Difficulty } from '../lib/sudoku';

export function NewGame({
  onStart,
  t,
}: {
  onStart: (d: Difficulty) => void;
  t: Strings;
}) {
  return (
    <section className='card'>
      <h2>{t.newGame}</h2>
      <div className='levels'>
        {DIFFICULTIES.map((d) => (
          <button key={d} className='level' onClick={() => onStart(d)}>
            <span>{t.levels[d]}</span>
            <span className='muted'>{t.descriptions[d]}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

type Toggle = 'showMistakes' | 'autoNotes' | 'showTimer';

export function SettingsView({
  settings,
  setSettings,
  stats,
  onResetStats,
  t,
}: {
  settings: Settings;
  setSettings: (s: Settings) => void;
  stats: Stats;
  onResetStats: () => void;
  t: Strings;
}) {
  const [confirming, setConfirming] = useState(false);
  const hasStats = DIFFICULTIES.some((d) => stats[d].solved > 0);

  const toggle = (key: Toggle, label: string, detail: string) => (
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

  const languages: Language[] = ['auto', ...LANGS];

  return (
    <>
      <section className='card'>
        <h2>{t.settings}</h2>
        {toggle('showMistakes', t.showMistakes, t.showMistakesDetail)}
        {toggle('autoNotes', t.tidyNotes, t.tidyNotesDetail)}
        {toggle('showTimer', t.showTimer, t.showTimerDetail)}

        <div className='field'>
          <span>
            {t.hints}
            <span className='muted'>{t.hintsDetail}</span>
          </span>
          <div className='segmented'>
            {HINT_LIMITS.map((limit) => (
              <button
                key={String(limit)}
                aria-pressed={settings.hintLimit === limit}
                aria-label={limit === null ? t.unlimited : undefined}
                onClick={() => setSettings({ ...settings, hintLimit: limit })}
              >
                {limit === null ? '∞' : limit === 0 ? t.off : limit}
              </button>
            ))}
          </div>
        </div>

        <div className='field'>
          <span>{t.language}</span>
          <div className='segmented'>
            {languages.map((l) => (
              <button
                key={l}
                aria-pressed={settings.language === l}
                onClick={() => setSettings({ ...settings, language: l })}
              >
                {l === 'auto' ? t.automatic : LANG_NAMES[l]}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className='card'>
        <h2>{t.statistics}</h2>
        <table className='stats'>
          <thead>
            <tr>
              <th />
              <th>{t.solvedColumn}</th>
              <th>{t.bestColumn}</th>
              <th>{t.average}</th>
            </tr>
          </thead>
          <tbody>
            {DIFFICULTIES.map((d) => {
              const s = stats[d];
              return (
                <tr key={d}>
                  <th>{t.levels[d]}</th>
                  <td>{s.solved}</td>
                  <td>{s.best === undefined ? '–' : formatTime(s.best)}</td>
                  <td>{s.solved ? formatTime(s.total / s.solved) : '–'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {hasStats &&
          (confirming ? (
            <div className='reset'>
              <span>{t.resetConfirm}</span>
              <button
                className='button button--small button--danger'
                onClick={() => {
                  onResetStats();
                  setConfirming(false);
                }}
              >
                {t.reset}
              </button>
              <button
                className='button button--small'
                onClick={() => setConfirming(false)}
              >
                {t.cancel}
              </button>
            </div>
          ) : (
            <div className='reset'>
              <button
                className='button button--small'
                onClick={() => setConfirming(true)}
              >
                {t.resetStats}
              </button>
            </div>
          ))}
      </section>
    </>
  );
}
