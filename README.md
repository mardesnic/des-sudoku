# Sudoku

A free sudoku that works offline. It makes a new puzzle every time, in four difficulty levels, and every puzzle has exactly one solution.

## Demo

Check out the live demo at: https://mardesnic.github.io/des-sudoku/

On your phone, open it and choose **Add to Home Screen** (Safari) or **Install app** (Chrome). It then opens like an app and works offline.

## Features

- New puzzles made on your device: easy, medium, hard and expert
- Levels are set by the techniques a puzzle needs, not only by how many numbers it starts with
- Highlights the row, column, box and matching numbers of the selected cell
- Mistakes shown in red
- Hints that fill in the easiest cell to work out next: 5 per game by default, or 3, 10, unlimited or off (none on hard and expert)
- Undo, erase, and a count of how many of each number are left
- A count of puzzles solved at each level
- Keyboard play on a computer: digits, arrow keys, Backspace, Ctrl+Z to undo
- Picks up where you left off after a reload
- Keeps the screen on while you play
- In English and Croatian, following the phone's language unless you pick one
- Light and dark mode, no ads, accounts or tracking

## Development

```bash
npm install
npm run dev        # local dev server
npm test           # generator, solver, game and translation tests
npm run build      # production build in dist/
```

`npm run deploy` builds the app and publishes it to GitHub Pages.
