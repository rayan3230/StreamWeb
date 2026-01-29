import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
app.use(cors())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

const PORT = process.env.PORT || 3000

// In-memory room store (simple, reset on restart)
const rooms = new Map()

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      isPlaying: false,
      currentTime: 0,
      lastUpdated: Date.now(),
      hostId: null,
      users: {}
    })
  }
  return rooms.get(roomId)
}

io.on('connection', (socket) => {
  socket.on('join', ({ roomId, nickname }, cb) => {
    if (!roomId) return cb && cb({ error: 'roomId required' })
    socket.join(roomId)
    const room = getRoom(roomId)
    room.users[socket.id] = { id: socket.id, nickname: nickname || 'Anon' }
    if (!room.hostId) room.hostId = socket.id

    // Send initial state to joining client
    socket.emit('init', {
      isPlaying: room.isPlaying,
      currentTime: room.currentTime,
      lastUpdated: room.lastUpdated,
      hostId: room.hostId,
      users: Object.values(room.users),
      media: room.media || null
    })

    // notify others (include hostId so clients can mark admin)
    io.to(roomId).emit('user-list', { users: Object.values(room.users), hostId: room.hostId })

    // If joiner is not host, ask host to send a more precise sync
    if (room.hostId && room.hostId !== socket.id) {
      io.to(room.hostId).emit('request-sync', { to: socket.id })
    }

    cb && cb({ ok: true })
  })

  socket.on('play', ({ roomId, currentTime, timestamp }) => {
    const room = getRoom(roomId)
    // only host can control playback
    if (room.hostId !== socket.id) return socket.emit('not-authorized', { action: 'play' })
    room.isPlaying = true
    room.currentTime = currentTime
    room.lastUpdated = timestamp || Date.now()
    io.to(roomId).emit('play', { currentTime: room.currentTime, timestamp: room.lastUpdated, actor: socket.id })
  })

  socket.on('pause', ({ roomId, currentTime, timestamp }) => {
    const room = getRoom(roomId)
    if (room.hostId !== socket.id) return socket.emit('not-authorized', { action: 'pause' })
    room.isPlaying = false
    room.currentTime = currentTime
    room.lastUpdated = timestamp || Date.now()
    io.to(roomId).emit('pause', { currentTime: room.currentTime, timestamp: room.lastUpdated, actor: socket.id })
  })

  socket.on('seek', ({ roomId, currentTime, timestamp }) => {
    const room = getRoom(roomId)
    if (room.hostId !== socket.id) return socket.emit('not-authorized', { action: 'seek' })
    room.currentTime = currentTime
    room.lastUpdated = timestamp || Date.now()
    io.to(roomId).emit('seek', { currentTime: room.currentTime, timestamp: room.lastUpdated, actor: socket.id })
  })

  socket.on('set-media', ({ roomId, media }) => {
    const room = getRoom(roomId)
    // only host can set media
    if (room.hostId !== socket.id) return socket.emit('not-authorized', { action: 'set-media' })
    room.media = { ...media, timestamp: Date.now() }
    io.to(roomId).emit('media-updated', room.media)
  })

  // clients send periodic status updates (ping, estimatedTime, connection info)
  socket.on('status-update', ({ roomId, status }) => {
    const room = getRoom(roomId)
    if (!room || !room.users[socket.id]) return
    room.users[socket.id].stats = { ...(room.users[socket.id].stats || {}), ...status, ts: Date.now() }
    io.to(roomId).emit('user-list', { users: Object.values(room.users), hostId: room.hostId })
  })

  // simple ping check
  socket.on('ping-check', ({ ts }) => {
    socket.emit('ping-pong', { ts })
  })

  socket.on('sync-response', ({ roomId, to, state }) => {
    // state from host to a specific client who requested sync
    io.to(to).emit('sync', state)
  })

  socket.on('chat', ({ roomId, message, nickname }) => {
    io.to(roomId).emit('chat', { message, nickname, id: socket.id, ts: Date.now() })
  })

  socket.on('disconnecting', () => {
    const roomsJoined = Array.from(socket.rooms).filter(r => r !== socket.id)
    roomsJoined.forEach(roomId => {
      const room = rooms.get(roomId)
      if (!room) return
      delete room.users[socket.id]
      if (room.hostId === socket.id) {
        // pick new host if any
        const ids = Object.keys(room.users)
        room.hostId = ids.length ? ids[0] : null
      }
      io.to(roomId).emit('user-list', { users: Object.values(room.users), hostId: room.hostId })
    })
  })
})

app.get('/', (req, res) => {
  res.json({ ok: true, msg: 'Watch party backend running' })
})

server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`)
})
