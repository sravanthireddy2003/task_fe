import { io } from 'socket.io-client';

let socket = null;

export function initWorkflowSocket(store) {
  if (socket) return socket;
  const base = import.meta.env.VITE_WS_URL || import.meta.env.VITE_SERVERURL || '';
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
    try { store.dispatch({ type: 'workflow/fetchTemplates/pending' }); store.dispatch({ type: 'workflow/fetchTemplates' }); } catch (e) {}
    try { store.dispatch({ type: 'approval/fetchQueue' }); } catch (e) {}
  });

  socket.on('workflow:updated', (payload) => {
    try { store.dispatch({ type: 'approval/fetchQueue' }); } catch (e) {}
    if (payload && payload.instanceId) {
      try { store.dispatch({ type: 'workflow/getHistory', payload: payload.instanceId }); } catch (e) {}
    }
  });

  socket.on('workflow:escalated', (data) => {
    try { store.dispatch({ type: 'approval/fetchQueue' }); } catch (e) {}
  });

  socket.on('disconnect', () => console.info('workflow socket disconnected'));

  return socket;
}

export function getWorkflowSocket() { return socket; }
