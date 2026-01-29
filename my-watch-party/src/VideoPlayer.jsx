import { useEffect, useRef } from 'react'

export default function VideoPlayer({ socket, roomId, isHost }) {
  const videoRef = useRef(null)
  const ignoreRemote = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    function onPlay() {
      if (!isHost || ignoreRemote.current) return
      socket.emit('play', { roomId, currentTime: video.currentTime, timestamp: Date.now() })
    }

    function onPause() {
      if (!isHost || ignoreRemote.current) return
      socket.emit('pause', { roomId, currentTime: video.currentTime, timestamp: Date.now() })
    }

    function onSeeked() {
      if (!isHost || ignoreRemote.current) return
      socket.emit('seek', { roomId, currentTime: video.currentTime, timestamp: Date.now() })
    }

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('seeked', onSeeked)

    function applyRemotePlay({ currentTime, timestamp }) {
      const expected = currentTime + (Date.now() - (timestamp || Date.now())) / 1000
      const drift = Math.abs(video.currentTime - expected)
      ignoreRemote.current = true
      if (drift > 0.5) video.currentTime = expected
      video.play().catch(() => {})
      setTimeout(() => (ignoreRemote.current = false), 200)
    }

    function applyRemotePause({ currentTime }) {
      ignoreRemote.current = true
      video.currentTime = currentTime
      video.pause()
      setTimeout(() => (ignoreRemote.current = false), 200)
    }

    function applyRemoteSeek({ currentTime, timestamp }) {
      ignoreRemote.current = true
      const expected = currentTime + (Date.now() - (timestamp || Date.now())) / 1000
      video.currentTime = expected
      setTimeout(() => (ignoreRemote.current = false), 200)
    }

    socket.on('play', applyRemotePlay)
    socket.on('pause', applyRemotePause)
    socket.on('seek', applyRemoteSeek)

    socket.on('request-sync', ({ to }) => {
      // if this client is host, send exact state to 'to'
      if (!isHost) return
      const state = {
        isPlaying: !video.paused,
        currentTime: video.currentTime,
        timestamp: Date.now()
      }
      socket.emit('sync-response', { roomId, to, state })
    })

    socket.on('sync', (state) => {
      // precise sync from host
      if (!state) return
      ignoreRemote.current = true
      video.currentTime = state.currentTime + (Date.now() - (state.timestamp || Date.now())) / 1000
      if (state.isPlaying) video.play().catch(() => {})
      else video.pause()
      setTimeout(() => (ignoreRemote.current = false), 200)
    })

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('seeked', onSeeked)
      socket.off('play', applyRemotePlay)
      socket.off('pause', applyRemotePause)
      socket.off('seek', applyRemoteSeek)
      socket.off('request-sync')
      socket.off('sync')
    }
  }, [socket, roomId, isHost])

  return (
    <div className="video-wrap">
      <video
        ref={videoRef}
        controls
        width="800"
        src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
      />
      <p style={{ fontSize: 12 }}>Note: first user becomes host; host controls playback.</p>
    </div>
  )
}
