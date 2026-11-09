# BlipUp

Do pushups. Catch **Blips**. Every rep sends a blip.

A mobile-first web app: pick a pushup target (5–100), count reps by tapping the phone with your nose/chest,
then try to catch the Blip that shows up. Bigger targets = better catch rates. 30 Blips across 4 rarities.

## Stack
- React 19 + Vite + TypeScript + Tailwind v4 + Motion
- Supabase: anonymous + magic-link auth, Postgres with RLS. All writes go through RPCs in
  `supabase/migrations/001_init.sql`, so catches, streaks and powerups can't be faked from the browser.
- Art generated with Higgsfield (GPT Image 2.6), shrunk with `npm run art`.

## Run
```bash
npm install
npm run dev      # http://localhost:5173
npm test         # catch maths + roster checks
npm run build    # static site in dist/
```

`.env` holds the Supabase URL and publishable key (public by design; RLS protects the data).

## Replit
Import this GitHub repo into Replit. `.replit` runs the dev server on port 5000 and deploys `dist/` as a static site.

## Game rules (keep `src/game/catch.ts` and the SQL in sync)
- catch power = 0.5 + (target − 5) / 95 → 0.5× … 1.5×
- catch chance = clamp(base × power, 5%, 95%); base 1★ 70%, 2★ 50%, 3★ 30%, 4★ 15%
- appear odds 60 / 27 / 10 / 3 %; 4★ only at 30+ reps
- 2 throws per Blip. Then: Double Bubble (one more throw at 2×) or let it bounce (rerolls once per session)
