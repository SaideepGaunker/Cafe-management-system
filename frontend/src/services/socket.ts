import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://https://cafe-management-system11-production.up.railway.app';

const initialToken = localStorage.getItem('cafe_auth_token') || undefined;

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  auth: {
    token: initialToken,
  },
});

export const updateSocketAuthToken = (token?: string | null) => {
  socket.auth = { token: token || undefined };
  if (socket.connected) {
    socket.disconnect().connect();
  } else {
    socket.connect();
  }
};

export const joinOrderTrackingRoom = (orderId: string) => {
  if (socket.connected) {
    socket.emit('joinOrderTrack', orderId);
  }
};
