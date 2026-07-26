import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';

let socket = null;
let adminToken = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1500,
    });
    socket.on('connect',    () => console.log('🟢 socket متصل'));
    socket.on('disconnect', () => console.log('🔴 socket قطع'));
  }
  return socket;
}

export const setAdminToken = (t) => { adminToken = t; };
export const getAdminToken = () => adminToken;
export const clearAdmin    = () => { adminToken = null; };
