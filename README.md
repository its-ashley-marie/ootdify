# ootdify — vanilla SPA prototype

A deliberately framework-free product prototype so the interaction logic stays understandable and the visual layer can keep evolving independently.

## Run it

Because the app uses ES modules, serve the folder instead of double-clicking `index.html`.

```bash
cd ootdify-v2
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Current product loop

1. Enter through a returning-user shortcut, a prototype Google provider, or a name/email form.
2. **Global** is the broader outfit discovery feed.
3. **Friends** is a filtered feed containing only people the prototype account follows.
4. On touch devices, drag/swipe left to pass or right to keep.
5. On laptops/desktops, use the Left/Right arrow keys or the visible action controls.
6. Kept outfits can be filed into boards.
7. Upload a local outfit image, caption and tags.
8. Your Profile becomes a clickable outfit archive; open any thumbnail into a larger scrollable post history with dates.
9. **Calendar** automatically places your own posts on the day they were created and supports month-to-month browsing.
10. Prototype state persists in `localStorage` across refreshes.

## Architecture

- `index.html` — SPA mount point and font setup.
- `js/state.js` — single state source, session adapter, global/friends queues, calendar cursor, mutations and `localStorage` persistence.
- `js/router.js` — small hash router (`#feed`, `#friends`, `#calendar`, `#boards`, `#profile`).
- `js/app.js` — rendering, swipe controller, calendar rendering, post-history viewer, keyboard controls and DOM events.
- `style.css` — bubbly/organic visual system that can still be reskinned without touching state logic.

## Friends prototype note

The current prototype uses a small hard-coded `following` list in `state.js` because there is no real backend/user graph yet. The Friends feed is intentionally built as a filtered view of the same post model so a later database can replace that list without changing the UI architecture.

A post swiped in Friends is removed from Global too (and vice versa) so the same outfit does not immediately appear twice.

## Authentication note

The **Continue with Google** button is intentionally a prototype provider adapter, not real Google OAuth. `signInWithGoogle()` is isolated in `state.js` so it can later be replaced with Google Identity Services / Firebase / Supabase Auth without rewriting the rest of the app.

The app also stores the most recently used prototype account separately so signed-out users can see a **Continue as ...** returning-user entry point.

## Intentionally not implemented yet

- Production Google OAuth / password authentication
- Backend/database
- Real friend/follow requests and multi-user sync
- Comments/notifications
- Cloud image storage
- Production accessibility/security audit

## Updated aesthetic

Charcoal `#292827` backgrounds, muted red `#8E4242` accents, and cream `#FFFCF2` text. The palette applies to all screens, navigation, forms, dialogs, and interaction states while preserving the rounded visual style and existing app behavior.
