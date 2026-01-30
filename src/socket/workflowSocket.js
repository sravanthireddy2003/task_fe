import { io } from 'socket.io-client';
import { WS_BASE_URL } from '../utils/envConfig';

let socket = null;

export function initWorkflowSocket(store) {
  if (socket) return socket;
  const base = WS_BASE_URL || '';
  const url = base.replace(/^http/, 'ws').replace(/\/+$/, '');
  try {
    socket = io(url, { transports: ['websocket', 'polling'] });
  } catch (e) {
    console.warn('socket.io client init failed', e);
    return null;
  }

  socket.on('connect', () => {
    console.info('workflow socket connected');
  });

  socket.on('workflow:created', (data) => {
    try {
      // refresh both manager and admin queues when a workflow is created
      store.dispatch({ type: 'approval/fetchQueue', payload: 'MANAGER' });
      store.dispatch({ type: 'approval/fetchQueue', payload: 'ADMIN' });
    } catch (e) {}
  });

  socket.on('workflow:updated', (payload) => {
    try {
      store.dispatch({ type: 'approval/fetchQueue', payload: 'MANAGER' });
      store.dispatch({ type: 'approval/fetchQueue', payload: 'ADMIN' });
    } catch (e) {}
  });

  socket.on('workflow:escalated', (data) => {
    try {
      store.dispatch({ type: 'approval/fetchQueue', payload: 'MANAGER' });
      store.dispatch({ type: 'approval/fetchQueue', payload: 'ADMIN' });
    } catch (e) {}
  });

  socket.on('disconnect', () => console.info('workflow socket disconnected'));

  return socket;
}

export function getWorkflowSocket() { return socket; }
