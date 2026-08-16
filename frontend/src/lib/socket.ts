import { io, type Socket } from 'socket.io-client'

// Same origin/port as the REST API — the backend's Socket.IO gateway
// attaches to the existing HTTP(S) server, no separate port needed.
export function createTransactionSocket(): Socket {
  return io(import.meta.env.VITE_API_BASE_URL, { autoConnect: false })
}
