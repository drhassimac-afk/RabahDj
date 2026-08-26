import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';
import { addNotification } from './notifications';

let socket = null;
let adminToken = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1500,
    });
    socket.on('connect',    () => console.log('🟢 socket متصل'));
    socket.on('disconnect', () => console.log('🔴 socket قطع'));
    socket.on('postAdded', (post) => addNotification('post', `منشور جديد من ${post?.author?.name || post?.authorName || 'مستخدم'}`));
    socket.on('radio_state_change', (data) => { if (data?.active) addNotification('radio', `بدأ ${data.broadcaster || 'أحد'} بثاً صوتياً`); });
    socket.on('walkie_audio_received', () => addNotification('walkie', 'رسالة صوتية جديدة عبر التخاطب اللاسلكي'));
    socket.on('viewer-joined', () => addNotification('live', 'انضم مشاهد جديد للبث المباشر'));
  }
  return socket;
}

export function resetSocket() {
  if (socket) {
    try {
      socket.removeAllListeners();
      socket.disconnect();
    } catch (err) {
      // تجاهل
    }
  }
  socket = null;
}

export const setAdminToken = (t) => { adminToken = t; };
export const getAdminToken = () => adminToken;
export const clearAdmin    = () => { adminToken = null; };
