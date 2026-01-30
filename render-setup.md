Render + Vercel deployment quick reference

This project has a frontend in `my-watch-party/` (Vite + React) and a backend in `backend/` (Node + Socket.IO).

Backend (Render)
-----------------
Use Render Web Service (Node) with these settings (Root Directory = `backend`):

- Name: StreamWeb-backend
- Branch: main
- Root Directory: backend
- Environment: Node
- Build Command: `npm ci`
- Start Command: `npm start`
- Health Check Path: `/`
- Instance Type: Starter (or pick a plan)
- Auto-deploy: enable (optional)

After deploy, Render will give you a URL like `https://your-service.onrender.com`.
Use that full URL (including https://) for `VITE_SERVER_URL` in the frontend.

Frontend (Vercel)
------------------
When importing the repo to Vercel, set:
- Root Directory: `my-watch-party`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: (leave default) or `npm ci`

Add Environment Variable in Vercel project settings:
- Name: `VITE_SERVER_URL`
- Value: `https://streamweb-fxu5.onrender.com` (replace with your actual Render URL)
- Add for Production and Preview as needed.

Local testing
-------------
Frontend (dev):
```bash
cd my-watch-party
# use .env.local or inline env
# Option A: create .env.local with VITE_SERVER_URL=https://streamweb-fxu5.onrender.com
npm ci
npm run dev
```

Frontend (production preview):
```bash
cd my-watch-party
npm ci
npm run build
npm run preview
# open the preview URL printed by Vite (usually http://localhost:4173)
```

Backend (local):
```bash
cd backend
npm ci
npm start
# open http://localhost:3000 to check the root endpoint
```

Vercel CLI (optional)
---------------------
```bash
# Install CLI if needed
npm i -g vercel
# From frontend folder
cd my-watch-party
vercel login
vercel            # follow prompts to link project
vercel --prod     # production deploy
# Add env variable via CLI
vercel env add VITE_SERVER_URL production
```

Troubleshooting
---------------
- If socket connections fail, open the browser console to inspect CORS or mixed-content errors.
- Ensure both frontend and backend use HTTPS in production.
- Backend uses `process.env.PORT` — Render provides the port automatically.
- If you see dependency vulnerabilities reported by `npm audit`, you can run `npm audit` and `npm audit fix` locally before deploying, but `npm ci` is fine for reproducible installs on Render.

Notes
-----
- The repo already contains `backend/package.json` with `start: "node index.js"` and `my-watch-party/package.json` with Vite build scripts.
- I added `my-watch-party/.env.example` with `VITE_SERVER_URL` set to your Render URL. Copy this to `.env.local` for local development and update as needed.
