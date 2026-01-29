# Watch Party (fullstack)

This workspace contains a React (Vite) frontend in `my-watch-party` and a Node.js + Socket.IO backend in `backend`.

Quick run (dev):

1. Start backend

```bash
cd backend
npm install
npm run dev
```

2. Start frontend

```bash
cd my-watch-party
npm install
npm run dev
```

By default the frontend will try to connect to `http://localhost:3000`. You can override with `VITE_SERVER_URL`.

Docker (backend):

```bash
cd backend
docker build -t watch-party-backend .
docker run -p 3000:3000 watch-party-backend
```

Notes:
- Room state is stored in memory; for production scale use Redis or another shared store.
- The frontend includes a basic VideoPlayer and room join UI; it uses `socket.io-client`.
