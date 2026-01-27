// Simple WebSocket client with auto-reconnect for real-time updates
class WSClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectMs = 2000;
    this.listeners = new Set();
    this._shouldReconnect = true;
  }

  connect() {
    if (!this.url) return;
    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => {
        console.info('WS connected', this.url);
      };
      this.ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          this.listeners.forEach((fn) => fn(data));
        } catch (err) {
          console.warn('ws parse error', err);
        }
      };
      this.ws.onclose = () => {
        console.info('WS closed, reconnecting...');
        if (this._shouldReconnect) setTimeout(() => this.connect(), this.reconnectMs);
      };
      this.ws.onerror = (e) => { console.warn('WS error', e); this.ws.close(); };
    } catch (err) {
      console.error('WS connect failed', err);
      setTimeout(() => this.connect(), this.reconnectMs);
    }
  }

  disconnect() {
    this._shouldReconnect = false;
    try { this.ws && this.ws.close(); } catch (e) {}
  }

  send(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  onMessage(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
}

export default WSClient;
