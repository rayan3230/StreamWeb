import { useState } from 'react'

export default function MediaForm({ media, setMedia, roomId, socket }) {
  const [type, setType] = useState(media?.type || 'movie')
  const [id, setId] = useState(media?.id || '')
  const [season, setSeason] = useState(media?.season || 1)
  const [episode, setEpisode] = useState(media?.episode || 1)
  const [startAt, setStartAt] = useState(media?.startAt || 0)
  const [theme, setTheme] = useState(media?.theme || '')

  function apply() {
    const m = { type, id, season: Number(season), episode: Number(episode), startAt: Number(startAt), theme }
    setMedia(m)
    socket.emit('set-media', { roomId, media: m })
  }

  function play() {
    // update media with autoplay true and broadcast — clients will reload iframe with autoPlay=true
    const m = { type, id, season: Number(season), episode: Number(episode), startAt: Number(startAt), theme, _autoPlay: true }
    setMedia(m)
    socket.emit('set-media', { roomId, media: m })
  }

  function pause() {
    // update media with autoplay false so clients load paused state
    const m = { type, id, season: Number(season), episode: Number(episode), startAt: Number(startAt), theme, _autoPlay: false }
    setMedia(m)
    socket.emit('set-media', { roomId, media: m })
  }

  function seekTo(v) {
    // update media startAt and broadcast
    setStartAt(v)
    const m = { type, id, season: Number(season), episode: Number(episode), startAt: Number(v), theme }
    setMedia(m)
    socket.emit('set-media', { roomId, media: m })
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      <div style={{display:'flex',gap:8}}>
        <label style={{display:'flex',gap:6,alignItems:'center'}}>
          <input type="radio" checked={type==='movie'} onChange={()=>setType('movie')} /> Movie
        </label>
        <label style={{display:'flex',gap:6,alignItems:'center'}}>
          <input type="radio" checked={type==='tv'} onChange={()=>setType('tv')} /> Series
        </label>
      </div>
      <input placeholder="IMDB/TMDB id (eg. tt6263850 or 533535)" value={id} onChange={e=>setId(e.target.value)} />
      {type==='tv' && (
        <div className="flex-wrap">
          <input style={{width:80}} type="number" min={1} value={season} onChange={e=>setSeason(e.target.value)} placeholder="Season" />
          <input style={{width:80}} type="number" min={1} value={episode} onChange={e=>setEpisode(e.target.value)} placeholder="Episode" />
        </div>
      )}
      <div className="flex-wrap">
        <input style={{width:120}} type="number" min={0} value={startAt} onChange={e=>setStartAt(e.target.value)} placeholder="startAt (sec)" />
        <input style={{width:'100%', flex: 1}} placeholder="theme hex (e.g. 16A085)" value={theme} onChange={e=>setTheme(e.target.value)} />
      </div>
      <div className="flex-wrap">
        <button className="btn btn-primary" onClick={apply}>Set Media</button>
        <button className="btn btn-success" onClick={play}>Play</button>
        <button className="btn btn-danger" onClick={pause}>Pause</button>
        <button className="btn btn-accent" onClick={()=>seekTo(startAt)}>Seek</button>
        <button className="btn btn-warning" onClick={() => {
          // force sync all clients to this startAt and autoPlay state
          const m = { type, id, season: Number(season), episode: Number(episode), startAt: Number(startAt), theme }
          setMedia(m)
          // include the media in the payload so clients can proactively clear local progress for that media
          socket.emit('force-sync', { roomId, currentTime: Number(startAt), isPlaying: (media?._autoPlay !== false), media: m })
        }}>Sync All</button>
      </div>
    </div>
  )
}
