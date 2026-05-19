# nefas.tv

![nefas.tv screenshot](public/screenshot.png)

A small, vaporwave-inspired personal / portfolio site built with Next.js (App Router) and TypeScript. It bundles a retro visual style with interactive sections for photos, blog posts, audio playback and small demos.

## Highlights

- Framework: Next.js (App Router)
- Languages: TypeScript + React
- Node: >= 18
- Purpose: Personal/portfolio site with photo galleries, blog snippets, a Winamp-style audio player, and a handful of interactive sections and demos.

## Quick links

- App entry: `app/layout.tsx` (root layout & metadata)
- Page entry: `app/page.tsx` (client preloader -> `LayoutShell`)
- Global styles: `app/globals.css` (imports legacy styles from `public/css/`)
- Static assets: `public/` (images, audio, legacy html/css)
- Content JSON: `data/` (posts, photos, playlists, 3D data)

## Getting started

Prerequisites: Node.js 18+ and npm (or pnpm/yarn).

1) Install dependencies

```powershell
npm install
```

2) Run dev server

```powershell
npm run dev
```

Open http://localhost:3000

3) Build for production

```powershell
npm run build
npm run start
```

4) Optional utilities

```powershell
npm run generate   # generate content (project-specific)
npm run playlist   # generate/update playlist
npm run thumbnails # generate thumbnails (requires sharp)
```

Note: `sharp` is a native dependency used by the thumbnails script. On Windows, if you encounter install/build issues, try `npm rebuild sharp` or use a Linux/macOS CI runner that includes libvips.

## Important folders

- `app/` — Next.js App Router routes and global styles
- `components/` — UI components for sections and widgets
- `public/` — Static assets and legacy site files
- `data/` — JSON content consumed by the app (photos, posts, playlist)
- `lib/`, `utils/`, `types/` — helpers and shared types

## Scripts

- `npm run dev` — development server
- `npm run build` — build for production
- `npm run start` — start the built app
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript typecheck (`tsc --noEmit`)
- `npm run generate` / `playlist` / `thumbnails` — project helper scripts

See `package.json` for full details.

## Development notes

- The project uses the App Router. Many top-level files under `app/` use the new conventions; `app/page.tsx` is a client component and mounts the `Preloader` and `LayoutShell`.
- Global CSS is collected in `app/globals.css` and imports legacy CSS files from `public/css/`. If you plan to modernize styles, consider migrating pieces to component-scoped CSS modules or Tailwind.
- Supabase is included as an optional dependency — search the repo for `createClient` or `SUPABASE_` to find integration points. Add a `.env.local` with required variables if you enable Supabase features.

## Deployment

This is a standard Next.js app and deploys easily to Vercel, Netlify (with appropriate adapter), Docker hosts or other platforms that support Node/Next. Ensure Node 18+ is configured in your deployment environment.

## Troubleshooting

- Run `npm run typecheck` and `npm run lint` to catch type and lint issues early.
- If `sharp` fails to build on Windows, try `npm rebuild sharp` or run thumbnail generation on Linux/macOS.
- Check for missing environment variables by scanning for `process.env` usages and create a `.env.local` or use the provided `.env.example`.

## Contributing

1. Fork and create a feature branch
2. Install deps and run `npm run dev`
3. Open a PR with a clear description and screenshots if UI changes are included

If you'd like, I can also add a small CI workflow and a `.env.example` file. Tell me which follow-up you'd like and I will implement it.

## License

MIT (see `package.json`)

