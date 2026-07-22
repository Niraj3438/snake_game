# Snake Game Premium — React Edition

A full React + Vite conversion of the original HTML/CSS/JS Snake Game, with
a complete offline authentication system backed by IndexedDB.

## Stack

- React 18 (functional components, hooks only)
- Vite
- React Router DOM
- React Context API (`AuthContext`)
- IndexedDB for user storage, `localStorage` for the active session
- Plain CSS (no Tailwind, no CSS-in-JS)

Everything runs fully offline — no backend, no external services.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`).

## Routes

| Route     | Description                                    |
|-----------|-------------------------------------------------|
| `/`       | Redirects to `/login`                           |
| `/login`  | Login with email + password                     |
| `/signup` | Create an account (username, email, password)   |
| `/game`   | The Snake game — protected, requires login       |
| `*`       | 404 page                                         |

## Auth flow

- Accounts are created via `/signup` and stored in IndexedDB
  (`db/indexedDB.js`), keyed by a unique email.
- `/login` verifies email + password against IndexedDB.
- On success, a lightweight session (id, username, email — never the
  password) is saved to `localStorage` and exposed through `AuthContext`.
- `/game` is wrapped in `ProtectedRoute`, which redirects to `/login` if
  no session is present.
- Logging out (via the navbar) clears the session and redirects to
  `/login`.

## Project structure

```
src/
  main.jsx
  App.jsx
  components/
    Login.jsx
    Signup.jsx
    SnakeGame.jsx
    Navbar.jsx
    ProtectedRoute.jsx
  context/
    AuthContext.jsx
  db/
    indexedDB.js
  pages/
    LoginPage.jsx
    SignupPage.jsx
    GamePage.jsx
    NotFoundPage.jsx
  styles/
    Auth.css
    Navbar.css
    SnakeGame.css
    NotFound.css
  index.css
```

## Notes on the game itself

The original canvas-based game engine (movement, collisions, food
spawning, particle effects, themes, snake colors, speed settings,
sound effects, mobile touch controls, keyboard controls) is preserved
as-is. It's wired up with `useRef` for the canvas/mutable game state and
`useEffect` for the animation loop and event listeners, instead of the
original direct `document.getElementById` DOM manipulation.
