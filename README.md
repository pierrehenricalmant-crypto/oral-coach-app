# Oral training — frontend

Plain HTML/CSS/JS (via Vite for a dev server and build), talking to the
backend in `../server`.

## Setup

1. `cd client`
2. `npm install`
3. Copy `.env.example` to `.env` if the backend doesn't run on `http://localhost:3001`.
4. Add the OpenDyslexic font files — see `public/fonts/README.txt`.
5. `npm run dev` — opens on `http://localhost:5173`. Make sure `server` is running too (`npm run dev` in `../server`).

## Pages

- `index.html` / `src/login.js` — level + teacher dropdowns, "Élève" (direct access) and "Prof" (reveals a password field, verified by the backend) buttons.
- `student.html` / `src/student.js` — first-name identification, unit picker (from `content/<level>/units.json`), chat with the Claude coach, voice recording via the browser's Web Speech API (text field fallback always available), end-of-session report.
- `teacher.html` / `src/teacher.js` — dashboard: per-student progression, units tested, most frequent errors by category, filterable by level.
- `src/style.css` — pastel theme, responsive layout, OpenDyslexic typography with a safe fallback, subtle animations (respects `prefers-reduced-motion`).
- `src/api.js` — fetch wrapper; sends/receives the httpOnly session cookie (`credentials: 'include'`).

## Safari & accessibility (step 7 pass)

Addressed in code, without being able to run this on an actual Safari
browser/device from this environment — **please verify for real** on macOS
Safari and iOS Safari before relying on it in class:

- `SpeechRecognition` is prefixed (`webkitSpeechRecognition`) and feature-detected; when unavailable the mic button disables itself and the text field takes over — this is the part most likely to behave differently across Safari versions, so it's the first thing to test on a real device.
- `-webkit-appearance: none` + a custom arrow on `<select>`, so form controls look the same across Safari/Chrome/Firefox instead of picking up Safari's native rounded style.
- `env(safe-area-inset-*)` padding so the card clears the iPhone notch/home indicator.
- `-webkit-text-size-adjust: 100%` to stop Safari's automatic text-resizing on rotation.
- Visible `:focus-visible` ring on every interactive element (keyboard navigation).
- `aria-live`/`aria-pressed`/`role="status"` on the chat log and recording controls, so a screen reader announces coach replies and recording state.
- Cookies: `SameSite=Lax` in dev (client and server are same-site — same "localhost", different ports). In production, once client and server are on different real domains, set `COOKIE_SECURE=true` server-side — the auth middleware then switches to `SameSite=None; Secure`, which is what cross-site cookies need under Safari's ITP and Chrome alike (see `server/README.md`).

Color contrast was checked by hand against WCAG AA (≥4.5:1) for the main text/background pairs in `src/style.css` (dark text on every pastel button/card background, muted text on white, error text on its pink background) — all pass, the tightest being the error message at ~4.7:1. Still worth re-running through a browser contrast checker once the app is live. Not yet re-tested after this pass: actual VoiceOver/NVDA screen-reader runs.

## Deploying to Netlify

Netlify auto-detects the Vite build (`npm run build` → `dist/`, already set in `netlify.toml`).

1. Deploy the **backend first** (see `server/README.md`) — you need its URL for the next step.
2. Create a new Netlify site from this repo, **base directory: `client`**.
3. Site settings → Environment variables: set `VITE_API_URL` to the backend's Netlify URL (e.g. `https://oral-coach-api.netlify.app`) — this must be set *before* the build runs, since Vite bakes `VITE_API_URL` into the built JS at build time, not at runtime.
4. Deploy. Then go back to the backend's `CLIENT_ORIGIN` env var and set it to this site's real URL, and redeploy the backend once.
