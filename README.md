# Oral training — frontend

Plain HTML/CSS/JS (via Vite for a dev server and build), talking to the
backend in `../server`.

## Setup

1. `cd client`
2. `npm install`
3. Copy `.env.example` to `.env` if the backend doesn't run on `http://localhost:3001`.
4. `npm run dev` — opens on `http://localhost:5173`. Make sure `server` is running too (`npm run dev` in `../server`).

## Pages

- `index.html` / `src/login.js` — level + teacher dropdowns, "Élève" (direct access) and "Prof" (reveals a password field, verified by the backend) buttons.
- `student.html` / `src/student.js` — first-name identification, unit picker (from `content/<level>/units.json`), chat with the Claude coach, voice recording via the browser's Web Speech API (text field fallback always available), the coach's replies are also read aloud via speech synthesis (best available English voice, auto-selected), end-of-session report.
- `teacher.html` / `src/teacher.js` — dashboard: per-student progression, units tested, most frequent errors (category + specific curriculum point, e.g. "Grammaire — Present Simple/Present Continuous"), filterable by level.
- `src/style.css` — pastel theme, responsive layout, Calibri typography (with a system-font fallback stack; OpenDyslexic is still bundled in `src/assets/fonts/` and declared as a `@font-face` if you want to switch back), subtle animations (respects `prefers-reduced-motion`).
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

## Deploying to GitHub Pages

Live at **https://pierrehenricalmant-crypto.github.io/oral-coach-app/**.

GitHub Pages serves this as a project page — a sub-path of `github.io`, not the domain root — which two things depend on:
- `vite.config.js` sets `base: '/oral-coach-app/'` for production builds only (dev server stays at `/`).
- Every in-app navigation (`window.location.href = ...`) uses `import.meta.env.BASE_URL` instead of a hardcoded `/page.html`, and the OpenDyslexic font files were moved from `public/fonts/` into `src/assets/fonts/` with relative `url()` references in `style.css`, so Vite bundles and rewrites them with the correct base prefix — a root-absolute `/fonts/...` path (or a plain `/page.html` redirect) silently breaks once the site isn't at the domain root.

Steps (no GitHub Actions needed — built and published straight from this machine via the `gh-pages` npm package):
1. Deploy the **backend first** (see `server/README.md`) — you need its URL for the next step.
2. Set `VITE_API_URL` in `.env.production` to the backend's real URL (baked into the build at build time, not read at runtime).
3. `npm run build`, then `npx gh-pages -d dist` — pushes `dist/` to the repo's `gh-pages` branch, which GitHub Pages serves.
4. Go back to the backend's `CLIENT_ORIGIN` env var, set it to this site's origin (`https://<user>.github.io`, scheme+host only, no path), and redeploy the backend once.

**Why GitHub Pages and not Netlify**: see `server/README.md`'s "Why Vercel and not Netlify" note — the same account-wide Netlify deploy freeze affected this site too, so it moved here.
