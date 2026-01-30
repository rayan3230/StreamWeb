import { io } from 'socket.io-client'

function normalizeUrl(url) {
	if (!url) return null
	// allow protocol-relative URLs
	if (/^\/\//.test(url)) return window.location.protocol + url
	// prepend current protocol if missing
	if (!/^https?:\/\//.test(url)) return window.location.protocol + '//' + url
	return url
}

const envUrl = import.meta.env.VITE_SERVER_URL || window.__SERVER_URL || null
const serverUrl = normalizeUrl(envUrl) || `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`

console.debug('socket connecting to', serverUrl)

export const socket = io(serverUrl, { transports: ['websocket'] })
