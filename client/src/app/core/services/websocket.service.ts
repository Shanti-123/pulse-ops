import { Injectable, OnDestroy } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface WSMessage {
  event: string;
  data: any;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private ws: WebSocket | null = null;
  private reconnectTimer: any;
  private reconnectDelay = 3000;

  public messages$ = new Subject<WSMessage>();
  public connected$ = new BehaviorSubject<boolean>(false);

  constructor(private authService: AuthService) {}

  connect(): void {
    const token = this.authService.accessToken;
    if (!token) return;

    this.ws = new WebSocket(`${environment.wsUrl}?token=${token}`);

    this.ws.onopen = () => {
      console.log('🔌 WebSocket connected');
      this.connected$.next(true);
      this.reconnectDelay = 3000;
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        this.messages$.next(msg);
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    this.ws.onclose = (event) => {
      this.connected$.next(false);
      console.log('🔌 WebSocket disconnected — code:', event.code);
      if (event.code !== 1008 && this.authService.isLoggedIn) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (err) => {
      console.error('WS error:', err);
      this.connected$.next(false);
    };
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected$.next(false);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      console.log('🔄 Reconnecting WebSocket...');
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 30000);
      this.connect();
    }, this.reconnectDelay);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}