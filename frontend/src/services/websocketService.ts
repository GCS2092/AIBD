import { io, Socket } from 'socket.io-client';
import { authService } from './authService';
import { API_URL } from '../config/api';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect() {
    if (this.socket?.connected) {
      return; // Déjà connecté
    }

    const token = authService.getToken();
    if (!token) {
      console.warn('Pas de token, connexion WebSocket impossible');
      return;
    }

    const apiUrl = API_URL;

    this.socket = io(apiUrl, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connecté');
    });

    this.socket.on('connected', (data) => {
      console.log('✅ Connexion WebSocket confirmée:', data);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket déconnecté');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur connexion WebSocket:', error);
    });

    // Écouter tous les événements enregistrés
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, callback);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
      if (this.socket) {
        this.socket.off(event, callback);
      }
    } else {
      this.listeners.delete(event);
      if (this.socket) {
        this.socket.off(event);
      }
    }
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket non connecté, impossible d\'émettre:', event);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  reconnect() {
    this.disconnect();
    this.connect();
  }
}

export const websocketService = new WebSocketService();

