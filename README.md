# Sudoku

A free sudoku that works offline. It makes a new puzzle every time, in four difficulty levels, and every puzzle has exactly one solution.

## Demo

Check out the live demo at: https://mardesnic.github.io/des-sudoku/

On your phone, open it and choose **Add to Home Screen** (Safari) or **Install app** (Chrome). It then opens like an app and works offline.

## Features

- New puzzles made on your device: easy, medium, hard and expert
- Levels are set by the techniques a puzzle needs, not only by how many numbers it starts with
- Notes (pencil marks), tidied up automatically as you fill in numbers
- Highlights the row, column, box and matching numbers of the selected cell
- Mistakes shown in red, or only repeated numbers if you prefer
- Hints that fill in the easiest cell to work out next
- Undo, erase, and a count of how many of each number are left
- Timer with pause, and best and average times for each level
- Keyboard play on a computer: digits, arrow keys, Backspace, N for notes, Ctrl+Z to undo
- Picks up where you left off after a reload
- Light and dark mode, no ads, accounts or tracking

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # generator, solver and game tests
npm run build      # production build in dist/
```

`npm run deploy` builds the app and publishes it to GitHub Pages.
