# Sis-Cooked

Sis-Cooked is a React app for managing recipes and viewing cooking-cost analysis. It currently provides a frontend UI with Home, Recipes, and Analysis tabs; recipe data, AI scanning, and analysis features are placeholders and are not connected to a backend yet.

## Requirements

- Node.js 18+ (or 20+)
- npm

## Run locally

1. Open a terminal in the project folder.
2. Install the dependencies:

   ```sh
   npm install
   ```

3. Start the development server:

   ```sh
   npm run dev
   ```

4. Open the local URL printed by Vite in your browser (usually `http://localhost:5173`).

Stop the server with `Ctrl+C`.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Create a production build in `dist/`. |
| `npm run preview` | Preview the production build locally after running `npm run build`. |
| `npm run lint` | Run ESLint. |

## Project structure

- `src/App.jsx` — app layout and tab navigation.
- `src/pages/Home/` — home screen.
- `src/pages/Recipes/` — recipe search and category UI.
- `src/pages/Analysis/` — analysis dashboard placeholder.
- `src/components/layout/` — shared header and bottom navigation.
