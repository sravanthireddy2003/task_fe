import io from 'socket.io-client';
import { fetchQueue } from '../redux/slices/approvalSlice';
import { fetchHistoryByInstance } from '../redux/slices/historySlice';
import { WS_BASE_URL } from '../utils/envConfig';

let socket = null;

export function initWorkflowSocket(store) {
  if (socket) return socket;
  const base = WS_BASE_URL;
  const url = base ? `${base.replace(/\/$/, '')}` : undefined;
  socket = io(url || '/', { transports: ['websocket'] });

  socket.on('connect', () => {
    // console.log('workflow socket connected', socket.id);
  });

  socket.on('workflow:created', () => {
    // New workflow template or instance created – refresh core views
    store.dispatch(fetchQueue('MANAGER'));
  });

  // Transition event for instance moving between steps/states
  socket.on('workflow:transition', (payload) => {
    store.dispatch(fetchQueue('MANAGER'));
    if (payload && payload.instanceId) {
      store.dispatch(fetchHistoryByInstance(payload.instanceId));
    }
  });

  // Backwards compatibility: some servers may still emit `workflow:updated`
  socket.on('workflow:updated', (payload) => {
    store.dispatch(fetchQueue('MANAGER'));
    if (payload && payload.instanceId) {
      store.dispatch(fetchHistoryByInstance(payload.instanceId));
    }
  });

  socket.on('workflow:escalated', (payload) => {
    store.dispatch(fetchQueue('MANAGER'));
    if (payload && payload.instanceId) {
      store.dispatch(fetchHistoryByInstance(payload.instanceId));
    }
  });

  socket.on('workflow:closed', (payload) => {
    // Closed instances should disappear from manager queue but remain in history
    store.dispatch(fetchQueue('MANAGER'));
    if (payload && payload.instanceId) {
      store.dispatch(fetchHistoryByInstance(payload.instanceId));
    }
  });

  socket.on('disconnect', () => {
    // console.log('workflow socket disconnected');
  });

  return socket;
}

export function getWorkflowSocket() {
  return socket;
}
