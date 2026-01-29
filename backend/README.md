# Watch Party Backend

Simple Express + Socket.IO backend for synchronizing video playback across a room.

Run locally:

```
cd backend
npm install
npm run dev
```

Environment:
- `PORT` - port to run on (default 3000)

This server is intentionally minimal and stores state in memory (good for prototyping). For production scale, connect a shared store (Redis) and add persistence.
