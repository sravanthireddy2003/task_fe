import io from 'socket.io-client';
import { fetchQueue } from '../redux/slices/approvalSlice';
import { fetchTemplates } from '../redux/slices/workflowSlice';

let socket = null;

export function initWorkflowSocket(store) {
  if (socket) return socket;
  const base = import.meta.env.VITE_WS_URL || import.meta.env.VITE_SERVERURL;
  const url = base ? `${base.replace(/\/$/, '')}` : undefined;
  socket = io(url || '/', { transports: ['websocket'] });

  socket.on('connect', () => {
    // console.log('workflow socket connected', socket.id);
  });

  socket.on('workflow:created', () => {
    store.dispatch(fetchTemplates());
    store.dispatch(fetchQueue());
  });

  socket.on('workflow:updated', (payload) => {
    store.dispatch(fetchQueue());
    if (payload && payload.templateId) store.dispatch(fetchTemplates());
  });

  socket.on('workflow:escalated', () => {
    store.dispatch(fetchQueue());
  });

  socket.on('disconnect', () => {
    // console.log('workflow socket disconnected');
  });

  return socket;
}

export function getWorkflowSocket() {
  return socket;
}
