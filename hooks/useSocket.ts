import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'

export function useSocket(eventName?: string, callback?: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Connect to the unified backend/frontend server
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[SocketClient] Connected to server with ID:', socket.id)
    })

    return () => {
      if (socket) {
        socket.disconnect()
        console.log('[SocketClient] Disconnected socket')
      }
    }
  }, [])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !eventName || !callback) return

    socket.on(eventName, callback)

    return () => {
      socket.off(eventName, callback)
    }
  }, [eventName, callback])

  return socketRef.current
}
export default useSocket
