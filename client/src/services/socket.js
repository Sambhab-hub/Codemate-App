import { io } from 'socket.io-client';
import { store } from '../store/store';

/**
 * Socket.IO Client Service — connects browser to server real-time event system.
 */
let socket = null;

export const connectSocket = () => {
  const { accessToken } = store.getState().auth;

  if (!accessToken) return null;

  if (!socket) {
    socket = io('/', {
      auth: { token: accessToken },
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('🔌 [Socket.IO Client] Connected to server real-time gateway');
    });

    socket.on('disconnect', () => {
      console.log('🔌 [Socket.IO Client] Disconnected');
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
