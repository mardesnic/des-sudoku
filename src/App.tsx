import { useEffect, useState, type CSSProperties } from 'react';

import { Board } from './components/Board';
import { Confetti } from './components/Confetti';
import { Glyph } from './components/Glyph';
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
  THEMES,
  toggleNote,
  undo,
  type Game,
  type Settings,
  type Stats,
  type Theme,
} from './lib/game';
import { STRINGS, detectLang } from './lib/i18n';
import { generate, layoutOf, usesShapes, type Difficulty } from './lib/sudoku';
import { popMenu, pushMenu, useBackButton } from './lib/use-back-button';
import { useCheer } from './lib/use-cheer';
import { useSettings } from './lib/use-settings';
import { useStoredState } from './lib/use-stored-state';
import { useWakeLock } from './lib/use-wake-lock';

type View = 'play' | 'new' | 'settings';

export default function App() {
  const [store, setStore] = useStoredState<{ game?: Game }>('sudoku', {});
  // Games saved while the app had no notes come back without them.
  const game = store.game && {
    ...store.game,
    notes: store.game.notes ?? new Array(store.game.givens.length).fill(0),
  };
  const [stored, setSettings] = useSettings<Settings>(
    'sudoku-settings',
    initialSettings
  );
  // A theme saved before it was removed falls back to the default.
  const settings = THEMES.includes(stored.theme)
    ? stored
    : { ...stored, theme: initialSettings.theme };
  const [stats, setStats] = useStoredState<Stats>('sudoku-stats', initialStats);
  const [view, setViewState] = useState<View>(game ? 'play' : 'new');
  // Menus open over the game, so the phone's Back button closes them.
  const setView = (next: View) => {
    if (next === 'play') popMenu();
    else pushMenu();
    setViewState(next);
  };
  useBackButton(() => {
    if (game) setViewState('play');
  });
  const [selected, setSelected] = useState<number>();
  const [notesMode, setNotesMode] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  useWakeLock();
  const cheer = useCheer(settings.sound);

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
      meta.content = THEME_COLORS[settings.theme] ?? meta.dataset.default;
    }
  }, [settings.theme]);

  const playing = view === 'play' && !!game && !game.solved;

  const update = (next: Game) => {
    if (!game || next === game) return;
    if (next.solved && !game.solved) {
      setStats(recordWin(stats, next));
      setCelebrating(true);
      cheer();
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

  const size = game ? layoutOf(game.values).size : 9;
  // The baby board is simple enough to play without notes.
  const canNote = !usesShapes(size);
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
        const i = selected ?? Math.floor((size * size) / 2);
        const r = (Math.floor(i / size) + move[0] + size) % size;
        const c = ((i % size) + move[1] + size) % size;
        setSelected(r * size + c);
      } else if (/^[1-9]$/.test(key) && Number(key) <= size) {
        input(Number(key));
      } else if (key === 'backspace' || key === 'delete' || key === '0') {
        clear();
      } else if (key === 'n' && canNote) {
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
              <div className='tools'>
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
                {canNote && (
                  <button
                    className={notesMode ? 'tool tool--on' : 'tool'}
                    onClick={() => setNotesMode(!notesMode)}
                    aria-pressed={notesMode}
                  >
                    <Icon name='notes' />
                    {t.notes}
                  </button>
                )}
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

              <div
                className={notesMode ? 'pad pad--notes' : 'pad'}
                style={{ '--size': size } as CSSProperties}
              >
                {Array.from({ length: size }, (_, k) => k + 1).map((d) => (
                  <button
                    key={d}
                    className='pad__key'
                    onClick={() => input(d)}
                    disabled={counts[d] >= size && !notesMode}
                    aria-label={usesShapes(size) ? t.shapes[d - 1] : undefined}
                  >
                    <Glyph value={d} size={size} />
                    {/* Babies can't read the count, so shapes go without. */}
                    <span className='pad__left'>
                      {!usesShapes(size) &&
                        (Math.max(size - counts[d], 0) || '')}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {view === 'settings' && (
        <footer className='footer'>
          <a href='https://github.com/mardesnic/des-sudoku'>{t.source}</a>
        </footer>
      )}
      {celebrating && <Confetti onDone={() => setCelebrating(false)} />}
    </main>
  );
}

const THEME_COLORS: Partial<Record<Theme, string>> = {
  narwhal: '#6fe6fc',
  blocks: '#6ab04c',
};

const MOVES: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};
