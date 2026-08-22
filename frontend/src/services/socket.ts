import { io, Socket } from 'socket.io-client';

const getSocketUrl = (): string => {
  let apiUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }
  return 'http://localhost:5000';
};

const SOCKET_URL = getSocketUrl();
const initialToken = localStorage.getItem('cafe_auth_token') || undefined;

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 15,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
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
  if (!orderId) return;
  if (socket.connected) {
    socket.emit('joinOrderTrack', orderId);
  } else {
    socket.once('connect', () => {
      socket.emit('joinOrderTrack', orderId);
    });
  }
};
