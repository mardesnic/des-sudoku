import { useEffect, useState } from 'react';

import { Board } from './components/Board';
import { Icon } from './components/Icon';
import { NewGame, SettingsView } from './components/Menu';
import { capitalize, formatTime } from './lib/format';
import {
  enter,
  erase,
  hint,
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
import { generate, type Difficulty } from './lib/sudoku';
import { useStoredState } from './lib/use-stored-state';
import { useTicker } from './lib/use-ticker';
import { useVisible } from './lib/use-visible';

type View = 'play' | 'new' | 'settings';

export default function App() {
  const [{ game }, setStore] = useStoredState<{ game?: Game }>('sudoku', {});
  const [settings, setSettings] = useStoredState<Settings>(
    'sudoku-settings',
    initialSettings
  );
  const [stats, setStats] = useStoredState<Stats>('sudoku-stats', initialStats);
  const [view, setView] = useState<View>(game ? 'play' : 'new');
  const [selected, setSelected] = useState<number>();
  const [notesMode, setNotesMode] = useState(false);
  const [paused, setPaused] = useState(false);
  const visible = useVisible();

  const playing = view === 'play' && !!game && !game.solved;
  useTicker(playing && !paused && visible, (ms) =>
    setStore((s) =>
      s.game ? { game: { ...s.game, elapsed: s.game.elapsed + ms } } : s
    )
  );

  const update = (next: Game) => {
    if (!game || next === game) return;
    if (next.solved && !game.solved) setStats(recordWin(stats, next));
    setStore({ game: next });
  };

  const start = (difficulty: Difficulty) => {
    setStore({ game: newGame(generate(difficulty, Math.random)) });
    setSelected(undefined);
    setNotesMode(false);
    setPaused(false);
    setView('play');
  };

  const input = (d: number) => {
    if (!game || selected === undefined) return;
    update(
      notesMode
        ? toggleNote(game, selected, d)
        : enter(game, selected, d, settings)
    );
  };

  const clear = () => {
    if (game && selected !== undefined) update(erase(game, selected));
  };

  const showHint = () => {
    if (!game) return;
    const [next, i] = hint(game, selected);
    update(next);
    if (i !== undefined) setSelected(i);
  };

  // Keyboard play for computers: digits, arrows, Backspace, N for notes.
  useEffect(() => {
    if (!playing || paused) return;
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
                New game
              </button>
              <button
                className='button button--small'
                onClick={() => setView('settings')}
              >
                Settings
              </button>
            </>
          ) : (
            game && (
              <button
                className='button button--small'
                onClick={() => setView('play')}
              >
                {view === 'new' ? 'Cancel' : 'Done'}
              </button>
            )
          )}
        </div>
      </header>

      {view === 'new' && <NewGame stats={stats} onStart={start} />}
      {view === 'settings' && (
        <SettingsView
          settings={settings}
          setSettings={setSettings}
          stats={stats}
        />
      )}

      {view === 'play' && game && (
        <>
          <div className='status'>
            <span>{capitalize(game.difficulty)}</span>
            {settings.showMistakes && (
              <span className='muted'>
                {game.mistakes} {game.mistakes === 1 ? 'mistake' : 'mistakes'}
              </span>
            )}
            <span className='status__time'>
              {settings.showTimer && formatTime(game.elapsed)}
              {!game.solved && (
                <button
                  className='icon-button'
                  onClick={() => setPaused(!paused)}
                  aria-label={paused ? 'Resume' : 'Pause'}
                >
                  <Icon name={paused ? 'play' : 'pause'} />
                </button>
              )}
            </span>
          </div>

          <div className='board-wrap'>
            <Board
              game={game}
              selected={game.solved ? undefined : selected}
              showMistakes={settings.showMistakes}
              paused={paused}
              onSelect={setSelected}
            />
            {paused && (
              <button className='paused' onClick={() => setPaused(false)}>
                <Icon name='play' />
                Paused
              </button>
            )}
          </div>

          {game.solved ? (
            <section className='card solved'>
              <h2>Solved!</h2>
              <p>
                {capitalize(game.difficulty)} in {formatTime(game.elapsed)}
                {stats[game.difficulty].best === game.elapsed &&
                  stats[game.difficulty].solved > 1 &&
                  ', a new best'}
              </p>
              <p className='muted'>
                {summary(game.mistakes, 'mistake')} ·{' '}
                {summary(game.hints, 'hint')}
              </p>
              <div className='solved__actions'>
                <button
                  className='button'
                  onClick={() => start(game.difficulty)}
                >
                  Another {game.difficulty} one
                </button>
                <button
                  className='button button--secondary'
                  onClick={() => setView('new')}
                >
                  Change difficulty
                </button>
              </div>
            </section>
          ) : (
            <>
              <div className='tools'>
                <button
                  className='tool'
                  onClick={() => update(undo(game))}
                  disabled={paused || !game.history.length}
                >
                  <Icon name='undo' />
                  Undo
                </button>
                <button className='tool' onClick={clear} disabled={paused}>
                  <Icon name='erase' />
                  Erase
                </button>
                <button
                  className={notesMode ? 'tool tool--on' : 'tool'}
                  onClick={() => setNotesMode(!notesMode)}
                  aria-pressed={notesMode}
                  disabled={paused}
                >
                  <Icon name='notes' />
                  Notes {notesMode ? 'on' : 'off'}
                </button>
                <button className='tool' onClick={showHint} disabled={paused}>
                  <Icon name='hint' />
                  Hint
                </button>
              </div>

              <div className={notesMode ? 'pad pad--notes' : 'pad'}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                  <button
                    key={d}
                    className='pad__key'
                    onClick={() => input(d)}
                    disabled={paused || (counts[d] >= 9 && !notesMode)}
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
        <a href='https://github.com/mardesnic/des-sudoku'>Source</a>
      </footer>
    </main>
  );
}

const MOVES: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

const summary = (n: number, word: string) =>
  n === 0 ? `No ${word}s` : `${n} ${word}${n === 1 ? '' : 's'}`;
