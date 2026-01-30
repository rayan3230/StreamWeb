import React, { useEffect, useRef } from 'react'

function tryPostMessage(win, msg) {
  try {
    win.postMessage(msg, '*')
  } catch (e) {
    // ignore
  }
}

function sendControlCommands(iframeEl, cmd, value) {
  if (!iframeEl || !iframeEl.contentWindow) return
  const w = iframeEl.contentWindow
  // candidate message formats observed in various players
  const candidates = [
    { event: 'command', func: cmd, args: value !== undefined ? [value] : [] },
    { event: 'command', func: cmd },
    { type: 'command', name: cmd, value },
    { method: cmd, params: value !== undefined ? [value] : [] },
    { action: cmd, value },
    { command: cmd, value }
  ]

  candidates.forEach((m) => tryPostMessage(w, m))
}

export default function MediaPlayer({ media }) {
  const iframeRef = useRef(null)
  const lastMediaRef = useRef(null)

  useEffect(() => {
    function onMessage(e) {
      // For debugging: log messages from iframe
      // console.debug('iframe->host', e.origin, e.data)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])
  // effect that attempts to control iframe when media changes
  useEffect(() => {
    if (!media) return
    const { type, id, season, episode, startAt, _autoPlay } = media
    const iframe = iframeRef.current
    const last = lastMediaRef.current
    // If same content (same id/season/episode), attempt to control via postMessage instead of reloading
    const sameContent = last && last.id === id && last.type === type && (type === 'movie' || (last.season === season && last.episode === episode))
    if (sameContent && iframe) {
      // attempt to play/pause/seek via postMessage
      if (_autoPlay === true) {
        sendControlCommands(iframe, 'play')
        if (startAt !== undefined) sendControlCommands(iframe, 'seek', Number(startAt))
      } else if (_autoPlay === false) {
        sendControlCommands(iframe, 'pause')
        if (startAt !== undefined) sendControlCommands(iframe, 'seek', Number(startAt))
      } else if (startAt !== undefined) {
        sendControlCommands(iframe, 'seek', Number(startAt))
      }
      // don't reload iframe
    }
    // update lastMediaRef
    lastMediaRef.current = { ...media }
  }, [media])

  if (!media) {
    return (
      <div className="video-wrap panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 360 }}>
        <div style={{ color: '#93b3d9' }}>No media set. Admin can set a movie or series.</div>
      </div>
    )
  }

  const { type, id, season, episode, startAt, theme, _autoPlay } = media
  const autoPlayParam = _autoPlay === false ? 'false' : 'true'
  const src = type === 'movie'
    ? `https://vidfast.pro/movie/${encodeURIComponent(id)}?autoPlay=${autoPlayParam}${startAt ? `&startAt=${startAt}` : ''}${theme ? `&theme=${encodeURIComponent(theme)}` : ''}`
    : `https://vidfast.pro/tv/${encodeURIComponent(id)}/${season || 1}/${episode || 1}?autoPlay=${autoPlayParam}${startAt ? `&startAt=${startAt}` : ''}${theme ? `&theme=${encodeURIComponent(theme)}` : ''}`

  return (
    <div className="video-wrap">
      <iframe
        ref={iframeRef}
        title="VidFast Player"
        src={src}
        className="video-iframe"
        allow="autoplay; fullscreen"
        allowFullScreen
      ></iframe>
    </div>
  )
}
