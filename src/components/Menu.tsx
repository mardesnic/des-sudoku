import { HINT_LIMITS, THEMES, type Settings, type Stats } from '../lib/game';
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
        {DIFFICULTIES.map((d, n) => (
          <button key={d} className='level' onClick={() => onStart(d)}>
            <span className='level__pips' aria-hidden='true'>
              {DIFFICULTIES.map((_, k) => (
                <span key={k} className={k <= n ? 'pip pip--on' : 'pip'} />
              ))}
            </span>
            {t.levels[d]}
          </button>
        ))}
      </div>
    </section>
  );
}

export function SettingsView({
  settings,
  setSettings,
  stats,
  t,
}: {
  settings: Settings;
  setSettings: (s: Settings) => void;
  stats: Stats;
  t: Strings;
}) {
  const languages: Language[] = ['auto', ...LANGS];

  return (
    <>
      <section className='card'>
        <h2>{t.settings}</h2>

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
          <span>{t.theme}</span>
          <div className='segmented'>
            {THEMES.map((theme) => (
              <button
                key={theme}
                aria-pressed={settings.theme === theme}
                onClick={() => setSettings({ ...settings, theme })}
              >
                {t.themes[theme]}
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
            </tr>
          </thead>
          <tbody>
            {DIFFICULTIES.map((d) => (
              <tr key={d}>
                <th>{t.levels[d]}</th>
                <td>{stats[d].solved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
