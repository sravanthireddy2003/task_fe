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
    return null;
  }

  socket.on('connect', () => {});

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

  socket.on('disconnect', () => undefined);

  return socket;
}

export function getWorkflowSocket() { return socket; }
