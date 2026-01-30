import { useEffect, useRef, useState } from 'react'
import './App.css'
import { socket } from './socket'
import MediaPlayer from './MediaPlayer'
import MediaForm from './MediaForm'

export default function App() {
  const [theater, setTheater] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [roomId, setRoomId] = useState('')
  const [nickname, setNickname] = useState('')
  const [joined, setJoined] = useState(false)
  const [users, setUsers] = useState([])
  const [hostId, setHostId] = useState(null)
  const [media, setMedia] = useState(null)
  const [messages, setMessages] = useState([])
  const messageRef = useRef()
  const videoWrapRef = useRef(null)

  const isHost = socket.id === hostId
  const mediaRef = useRef(media)
  useEffect(() => { mediaRef.current = media }, [media])

  useEffect(() => {
    socket.on('init', (state) => {
      setHostId(state.hostId)
      setUsers(state.users || [])
      if (state.media) setMedia(state.media)
    })
    socket.on('user-list', (payload) => {
      setUsers(payload.users)
      setHostId(payload.hostId)
    })
    socket.on('not-authorized', (info) => {
      alert('Not authorized to perform: ' + (info?.action || 'action'))
    })
    socket.on('media-updated', (m) => setMedia(m))
    socket.on('play', ({ currentTime, timestamp }) => {
      setMedia((prev) => prev ? { ...prev, startAt: currentTime, _autoPlay: true } : prev)
    })
    socket.on('pause', ({ currentTime, timestamp }) => {
      setMedia((prev) => prev ? { ...prev, startAt: currentTime, _autoPlay: false } : prev)
    })
    socket.on('seek', ({ currentTime, timestamp }) => {
      setMedia((prev) => prev ? { ...prev, startAt: currentTime } : prev)
    })
    socket.on('chat', (m) => setMessages((s) => [...s, m]))

    return () => {
      socket.off('init')
      socket.off('user-list')
      socket.off('chat')
      socket.off('media-updated')
      socket.off('play')
      socket.off('pause')
      socket.off('seek')
      socket.off('ping-pong')
      socket.off('not-authorized')
    }
  }, [])

  function joinRoom() {
    if (!roomId) return alert('Enter room id')
    socket.emit('join', { roomId, nickname }, (res) => {
      if (res && res.error) return alert(res.error)
      setJoined(true)
    })
  }

  function makeRoomId() {
    // generate a simple 6-digit numeric id (zero-padded)
    return Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  }

  async function createRoom() {
    const id = makeRoomId()
    setRoomId(id)
    const link = `${window.location.origin}${window.location.pathname}?room=${id}`
    try {
      await navigator.clipboard.writeText(link)
      alert('Room created — link copied to clipboard')
    } catch (e) {
      // fallback
      prompt('Room created, copy this link:', link)
    }
  }

  function createAndJoin() {
    const id = makeRoomId()
    setRoomId(id)
    socket.emit('join', { roomId: id, nickname }, (res) => {
      if (res && res.error) return alert(res.error)
      setJoined(true)
    })
  }

  function leaveRoom() {
    if (!roomId) return
    socket.emit('leave', { roomId })
    // reset local UI state
    setJoined(false)
    setMedia(null)
    setUsers([])
    setHostId(null)
  }

  function sendChat() {
    const t = messageRef.current?.value
    if (!t) return
    socket.emit('chat', { roomId, message: t, nickname: nickname || 'Anon' })
    messageRef.current.value = ''
  }

  function toggleFullscreen() {
    if (!videoWrapRef.current) return
    if (!document.fullscreenElement) {
      videoWrapRef.current.requestFullscreen().catch(e => console.error(e))
    } else {
      document.exitFullscreen()
    }
  }

  useEffect(() => {
    if (!joined || !roomId) return
    let ping = 0
    function doPing() {
      const ts = Date.now()
      socket.emit('ping-check', { ts })
      socket.once('ping-pong', ({ ts: echoed }) => {
        ping = Date.now() - echoed
      })
    }

    // send status every 3 seconds
    const iv = setInterval(() => {
      // compute estimated currentTime for reporting
      let estimated = 0
      const m = mediaRef.current
      if (m) {
        if (m._autoPlay) {
          const ts = m.timestamp || Date.now()
          estimated = (m.startAt || 0) + (Date.now() - ts) / 1000
        } else {
          estimated = m.startAt || 0
        }
      }
      const connection = navigator.connection || {}
      const status = { estimatedTime: estimated, ping: ping, downlink: connection.downlink || null, effectiveType: connection.effectiveType || null }
      socket.emit('status-update', { roomId, status })
      doPing()
    }, 3000)

    return () => clearInterval(iv)
  }, [joined, roomId])

  return (
    <div className={`app-container ${theater? 'theater':''}`}>
      {!joined ? (
        <div className="join-panel">
          <h2>Join a watch room</h2>
          <input placeholder="Room ID" value={roomId} onChange={(e) => setRoomId(e.target.value)} />
          <input placeholder="Nickname (optional)" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          <div className="flex-wrap" style={{ justifyContent: 'center' }}>
            <button onClick={joinRoom}>Join</button>
            <button onClick={createRoom} style={{ background: '#10b981' }}>Create</button>
            <button onClick={createAndJoin} style={{ background: '#8b5cf6' }}>Create & Join</button>
          </div>
        </div>
      ) : (
        <div className={`room ${sidebarOpen? 'sidebar-open':''}`}>
          <div className="left">
            <div className="topbar">
              <div className="room-info"><strong>Room:</strong> <span className="room-code">{roomId}</span></div>
              <div className="top-controls">
                <div className="role">{isHost? 'Role: Admin' : 'Role: Viewer'}</div>
                <button className="btn small" onClick={toggleFullscreen}>Fullscreen</button>
                <button className="btn small" onClick={()=>setTheater(t=>!t)}>{theater? 'Exit Theater':'Theater'}</button>
                <button className="btn small" onClick={()=>setSidebarOpen(s=>!s)}>{sidebarOpen? 'Hide Panel':'Show Panel'}</button>
                <button className="btn btn-danger small" onClick={leaveRoom}>Leave</button>
              </div>
            </div>
            <div 
              style={{ position: 'relative' }} 
              ref={videoWrapRef} 
              className="video-container"
              onDoubleClick={toggleFullscreen}
            >
              <MediaPlayer media={media} />
              {!isHost && (
                <>
                  <div className="viewer-interaction-blocker"></div>
                  <div className="viewer-notice">
                    Admin Room — Synced
                  </div>
                </>
              )}
            </div>
            {isHost && (
              <div style={{marginTop:10}} className="panel">
                <h4 style={{margin:'0 0 8px 0'}}>Admin Controls</h4>
                <MediaForm media={media} setMedia={setMedia} roomId={roomId} socket={socket} />
              </div>
            )}
          </div>
          <div className={`right ${sidebarOpen? 'open':''}`}> 
            <div className="users panel">
              <h3 style={{ marginTop: 0 }}>Users</h3>
              <div>
                {users.map((u) => (
                  <div key={u.id} className={`user ${u.id === socket.id ? 'you' : ''} ${u.id === hostId ? 'host' : ''}`}>
                    <span className="dot" style={{ background: u.id === hostId ? 'gold' : '#374151' }}></span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <div>
                        <span style={{ fontWeight: u.id === socket.id ? 600 : 400 }}>
                          {u.nickname}
                          {u.id === socket.id ? ' (you)' : ''}
                          {u.id === hostId ? ' (Admin)' : ' (Viewer)'}
                        </span>
                        <div style={{ fontSize: 12, color: '#9fb0d6' }}>{u.id}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12 }}>Time: {u.stats ? (Math.round((u.stats.estimatedTime || 0) * 10) / 10) + 's' : '-'}</div>
                        <div style={{ fontSize: 12 }}>Ping: {u.stats ? (u.stats.ping || '-') + 'ms' : '-'}</div>
                        <div style={{ fontSize: 12 }}>DL: {u.stats && u.stats.downlink ? u.stats.downlink + 'Mb/s' : '-'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="chat panel">
              <h3>Chat</h3>
              <div className="messages">
                {messages.map((m, i) => (
                  <div key={i}><strong>{m.nickname}</strong>: {m.message}</div>
                ))}
              </div>
              <div className="composer">
                <input ref={messageRef} placeholder="Message" onKeyDown={(e) => e.key === 'Enter' && sendChat()} />
                <button onClick={sendChat}>Send</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
