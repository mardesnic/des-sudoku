import type { Difficulty } from './sudoku';

export const LANGS = ['en', 'hr'] as const;
export type Lang = (typeof LANGS)[number];
export type Language = 'auto' | Lang;

// Each language's name in that language, for the picker.
export const LANG_NAMES: Record<Lang, string> = {
  en: 'English',
  hr: 'Hrvatski',
};

export function detectLang(): Lang {
  const preferred = navigator.languages ?? [navigator.language];
  return preferred.some((l) => l.toLowerCase().startsWith('hr')) ? 'hr' : 'en';
}

type Forms = { one: string; few?: string; other: string };

// Croatian has three plural forms: 1 greška, 2 greške, 5 grešaka.
const count = (lang: Lang, n: number, forms: Forms) => {
  const form = new Intl.PluralRules(lang).select(n) as keyof Forms;
  return `${n} ${forms[form] ?? forms.other}`;
};

const en = {
  newGame: 'New game',
  settings: 'Settings',
  cancel: 'Cancel',
  done: 'Done',
  levels: {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    expert: 'Expert',
  } as Record<Difficulty, string>,
  descriptions: {
    easy: 'Plenty of numbers to start',
    medium: 'Fewer numbers to start',
    hard: 'Needs a few tricks',
    expert: 'Needs pairs and X-wings',
  } as Record<Difficulty, string>,
  mistakes: (n: number) =>
    count('en', n, { one: 'mistake', other: 'mistakes' }),
  noMistakes: 'No mistakes',
  hintsUsed: (n: number) => count('en', n, { one: 'hint', other: 'hints' }),
  noHints: 'No hints',
  pause: 'Pause',
  resume: 'Resume',
  paused: 'Paused',
  solved: 'Solved!',
  solvedIn: (level: string, time: string) => `${level} in ${time}`,
  newBest: ', a new best',
  another: (level: string) => `Another ${level.toLowerCase()} one`,
  changeDifficulty: 'Change difficulty',
  undo: 'Undo',
  erase: 'Erase',
  notes: 'Notes',
  hint: 'Hint',
  source: 'Source',
  cell: (r: number, c: number) => `Row ${r}, column ${c}`,
  showMistakes: 'Show mistakes',
  showMistakesDetail:
    'Wrong numbers turn red. When off, only numbers that repeat in a row, column or box do.',
  tidyNotes: 'Tidy notes',
  tidyNotesDetail:
    'Entering a number removes it from the notes in its row, column and box.',
  showTimer: 'Show timer',
  showTimerDetail: 'The time is still recorded when hidden.',
  hints: 'Hints',
  hintsDetail:
    'How many hints you get per game. A hint fills in the easiest cell to work out next.',
  off: 'Off',
  unlimited: 'Unlimited',
  language: 'Language',
  automatic: 'Automatic',
  statistics: 'Statistics',
  solvedColumn: 'Solved',
  bestColumn: 'Best',
  average: 'Average',
  resetStats: 'Reset statistics',
  resetConfirm: 'Clear all times and counts?',
  reset: 'Reset',
};

export type Strings = typeof en;

const hr: Strings = {
  newGame: 'Nova igra',
  settings: 'Postavke',
  cancel: 'Odustani',
  done: 'Gotovo',
  levels: {
    easy: 'Lagano',
    medium: 'Srednje',
    hard: 'Teško',
    expert: 'Ekspert',
  },
  descriptions: {
    easy: 'Puno brojeva za početak',
    medium: 'Manje brojeva za početak',
    hard: 'Treba nekoliko trikova',
    expert: 'Trebaju parovi i X-wing',
  },
  mistakes: (n) =>
    count('hr', n, { one: 'greška', few: 'greške', other: 'grešaka' }),
  noMistakes: 'Bez grešaka',
  hintsUsed: (n) =>
    count('hr', n, { one: 'savjet', few: 'savjeta', other: 'savjeta' }),
  noHints: 'Bez savjeta',
  pause: 'Pauza',
  resume: 'Nastavi',
  paused: 'Pauzirano',
  solved: 'Riješeno!',
  solvedIn: (level, time) => `${level} za ${time}`,
  newBest: ', novi rekord',
  another: (level) => `Nova igra: ${level}`,
  changeDifficulty: 'Promijeni težinu',
  undo: 'Poništi',
  erase: 'Obriši',
  notes: 'Bilješke',
  hint: 'Savjet',
  source: 'Izvorni kod',
  cell: (r, c) => `Redak ${r}, stupac ${c}`,
  showMistakes: 'Prikaži greške',
  showMistakesDetail:
    'Pogrešni brojevi postaju crveni. Kad je isključeno, crveni su samo brojevi koji se ponavljaju u retku, stupcu ili kvadratu.',
  tidyNotes: 'Čisti bilješke',
  tidyNotesDetail:
    'Upisani broj briše se iz bilješki u svom retku, stupcu i kvadratu.',
  showTimer: 'Prikaži vrijeme',
  showTimerDetail: 'Vrijeme se bilježi i kad je skriveno.',
  hints: 'Savjeti',
  hintsDetail:
    'Koliko savjeta imaš u jednoj igri. Savjet upisuje polje koje je sljedeće najlakše odrediti.',
  off: 'Isklj.',
  unlimited: 'Neograničeno',
  language: 'Jezik',
  automatic: 'Automatski',
  statistics: 'Statistika',
  solvedColumn: 'Riješeno',
  bestColumn: 'Najbolje',
  average: 'Prosjek',
  resetStats: 'Poništi statistiku',
  resetConfirm: 'Obrisati sva vremena i brojeve?',
  reset: 'Obriši',
};

export const STRINGS: Record<Lang, Strings> = { en, hr };
