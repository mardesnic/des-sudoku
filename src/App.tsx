import { useEffect, useState } from 'react';

import { Board } from './components/Board';
import { Confetti } from './components/Confetti';
import { Icon } from './components/Icon';
import { NewGame, SettingsView } from './components/Menu';
import {
  enter,
  erase,
  hint,
  hintLimitFor,
  hintsLeft,
  initialSettings,
  initialStats,
  newGame,
  placed,
  recordWin,
  toggleNote,
  undo,
  type Game,
  type Settings,
  type Stats,
} from './lib/game';
import { STRINGS, detectLang } from './lib/i18n';
import { generate, type Difficulty } from './lib/sudoku';
import { useStoredState } from './lib/use-stored-state';
import { useWakeLock } from './lib/use-wake-lock';

type View = 'play' | 'new' | 'settings';

export default function App() {
  const [store, setStore] = useStoredState<{ game?: Game }>('sudoku', {});
  // Games saved while the app had no notes come back without them.
  const game = store.game && {
    ...store.game,
    notes: store.game.notes ?? new Array(81).fill(0),
  };
  const [settings, setSettings] = useStoredState<Settings>(
    'sudoku-settings',
    initialSettings
  );
  const [stats, setStats] = useStoredState<Stats>('sudoku-stats', initialStats);
  const [view, setView] = useState<View>(game ? 'play' : 'new');
  const [selected, setSelected] = useState<number>();
  const [notesMode, setNotesMode] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  useWakeLock();

  const lang = settings.language === 'auto' ? detectLang() : settings.language;
  const t = STRINGS[lang];
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    // Tint the phone's status bar to match the theme's backdrop.
    for (const meta of document.querySelectorAll<HTMLMetaElement>(
      'meta[name=theme-color]'
    )) {
      meta.dataset.default ??= meta.content;
      meta.content =
        settings.theme === 'narwhal' ? '#6fe6fc' : meta.dataset.default;
    }
  }, [settings.theme]);

  const playing = view === 'play' && !!game && !game.solved;

  const update = (next: Game) => {
    if (!game || next === game) return;
    if (next.solved && !game.solved) {
      setStats(recordWin(stats, next));
      setCelebrating(true);
    }
    setStore({ game: next });
  };

  const start = (difficulty: Difficulty) => {
    setStore({ game: newGame(generate(difficulty, Math.random)) });
    setSelected(undefined);
    setNotesMode(false);
    setView('play');
  };

  const input = (d: number) => {
    if (!game || selected === undefined) return;
    update(
      notesMode ? toggleNote(game, selected, d) : enter(game, selected, d)
    );
  };

  const clear = () => {
    if (game && selected !== undefined) update(erase(game, selected));
  };

  const limit = game ? hintLimitFor(game.difficulty, settings.hintLimit) : 0;
  const left = game ? hintsLeft(game, limit) : 0;

  const showHint = () => {
    if (!game || left <= 0) return;
    const [next, i] = hint(game, selected);
    update(next);
    if (i !== undefined) setSelected(i);
  };

  // Keyboard play for computers: digits, arrows, Backspace, N for notes.
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (!game || e.altKey) return;
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 'z') {
        e.preventDefault();
        update(undo(game));
        return;
      }
      if (e.ctrlKey || e.metaKey) return;
      const move = MOVES[e.key];
      if (move) {
        e.preventDefault();
        const i = selected ?? 40;
        const r = (Math.floor(i / 9) + move[0] + 9) % 9;
        const c = ((i % 9) + move[1] + 9) % 9;
        setSelected(r * 9 + c);
      } else if (/^[1-9]$/.test(key)) {
        input(Number(key));
      } else if (key === 'backspace' || key === 'delete' || key === '0') {
        clear();
      } else if (key === 'n') {
        setNotesMode((n) => !n);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const counts = game ? placed(game.values) : [];

  return (
    <main className='app'>
      <header className='header'>
        <h1>Sudoku</h1>
        <div className='header__actions'>
          {view === 'play' ? (
            <>
              <button
                className='button button--small'
                onClick={() => setView('new')}
              >
                {t.newGame}
              </button>
              <button
                className='button button--small'
                onClick={() => setView('settings')}
              >
                {t.settings}
              </button>
            </>
          ) : (
            game && (
              <button
                className='button button--small'
                onClick={() => setView('play')}
              >
                {view === 'new' ? t.cancel : t.done}
              </button>
            )
          )}
        </div>
      </header>

      {view === 'new' && <NewGame onStart={start} t={t} />}
      {view === 'settings' && (
        <SettingsView
          settings={settings}
          setSettings={setSettings}
          stats={stats}
          t={t}
        />
      )}

      {view === 'play' && game && (
        <>
          <div className='status'>
            <span>{t.levels[game.difficulty]}</span>
            <span className='muted'>{t.mistakes(game.mistakes)}</span>
          </div>

          <Board
            game={game}
            selected={game.solved ? undefined : selected}
            onSelect={setSelected}
            t={t}
          />

          {game.solved ? (
            <section className='card solved'>
              <h2>{t.solved}</h2>
              <p>{t.levels[game.difficulty]}</p>
              <p className='muted'>
                {game.mistakes ? t.mistakes(game.mistakes) : t.noMistakes} ·{' '}
                {game.hints ? t.hintsUsed(game.hints) : t.noHints}
              </p>
              <div className='solved__actions'>
                <button
                  className='button'
                  onClick={() => start(game.difficulty)}
                >
                  {t.another(t.levels[game.difficulty])}
                </button>
                <button
                  className='button button--secondary'
                  onClick={() => setView('new')}
                >
                  {t.changeDifficulty}
                </button>
              </div>
            </section>
          ) : (
            <>
              <div className={limit === 0 ? 'tools tools--3' : 'tools'}>
                <button
                  className='tool'
                  onClick={() => update(undo(game))}
                  disabled={!game.history.length}
                >
                  <Icon name='undo' />
                  {t.undo}
                </button>
                <button className='tool' onClick={clear}>
                  <Icon name='erase' />
                  {t.erase}
                </button>
                <button
                  className={notesMode ? 'tool tool--on' : 'tool'}
                  onClick={() => setNotesMode(!notesMode)}
                  aria-pressed={notesMode}
                >
                  <Icon name='notes' />
                  {t.notes}
                </button>
                {limit !== 0 && (
                  <button
                    className='tool'
                    onClick={showHint}
                    disabled={left <= 0}
                  >
                    <Icon name='hint' />
                    {t.hint} ({left === Infinity ? '∞' : left})
                  </button>
                )}
              </div>

              <div className={notesMode ? 'pad pad--notes' : 'pad'}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                  <button
                    key={d}
                    className='pad__key'
                    onClick={() => input(d)}
                    disabled={counts[d] >= 9 && !notesMode}
                  >
                    {d}
                    <span className='pad__left'>
                      {Math.max(9 - counts[d], 0) || ''}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      <footer className='footer'>
        <a href='https://github.com/mardesnic/des-sudoku'>{t.source}</a>
      </footer>
      {celebrating && <Confetti onDone={() => setCelebrating(false)} />}
    </main>
  );
}

const MOVES: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};
