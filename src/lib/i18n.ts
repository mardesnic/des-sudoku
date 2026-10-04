import type { Theme } from './game';
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
  mistakes: (n: number) =>
    count('en', n, { one: 'mistake', other: 'mistakes' }),
  noMistakes: 'No mistakes',
  hintsUsed: (n: number) => count('en', n, { one: 'hint', other: 'hints' }),
  noHints: 'No hints',
  solved: 'Solved!',
  another: (level: string) => `Another ${level.toLowerCase()} one`,
  changeDifficulty: 'Change difficulty',
  undo: 'Undo',
  erase: 'Erase',
  notes: 'Notes',
  hint: 'Hint',
  source: 'Source',
  cell: (r: number, c: number) => `Row ${r}, column ${c}`,
  hints: 'Hints',
  hintsDetail:
    'How many hints you get per game. A hint fills in the easiest cell to work out next. Hard and expert puzzles have no hints.',
  off: 'Off',
  unlimited: 'Unlimited',
  language: 'Language',
  automatic: 'Automatic',
  theme: 'Theme',
  themes: {
    default: 'Default',
    narwhal: 'Narwhal',
  } as Record<Theme, string>,
  statistics: 'Statistics',
  solvedColumn: 'Solved',
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
  mistakes: (n) =>
    count('hr', n, { one: 'greška', few: 'greške', other: 'grešaka' }),
  noMistakes: 'Bez grešaka',
  hintsUsed: (n) =>
    count('hr', n, { one: 'savjet', few: 'savjeta', other: 'savjeta' }),
  noHints: 'Bez savjeta',
  solved: 'Riješeno!',
  another: (level) => `Nova igra: ${level}`,
  changeDifficulty: 'Promijeni težinu',
  undo: 'Poništi',
  erase: 'Obriši',
  notes: 'Bilješke',
  hint: 'Savjet',
  source: 'Izvorni kod',
  cell: (r, c) => `Redak ${r}, stupac ${c}`,
  hints: 'Savjeti',
  hintsDetail:
    'Koliko savjeta imaš u jednoj igri. Savjet upisuje polje koje je sljedeće najlakše odrediti. Teške i ekspert igre nemaju savjete.',
  off: 'Isklj.',
  unlimited: 'Neograničeno',
  language: 'Jezik',
  automatic: 'Automatski',
  theme: 'Tema',
  themes: {
    default: 'Zadana',
    narwhal: 'Narval',
  },
  statistics: 'Statistika',
  solvedColumn: 'Riješeno',
};

export const STRINGS: Record<Lang, Strings> = { en, hr };
