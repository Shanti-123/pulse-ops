import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { WebSocketService } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit, OnDestroy {
  pageTitle = 'Dashboard';
  currentTime = '';
  isConnected = false;
  private timeInterval: any;

  pageTitles: Record<string, string> = {
    '/dashboard':  'Command Center',
    '/services':   'Service Registry',
    '/incidents':  'Incident Command',
    '/nlq':        'AI Query Engine',
  };

  constructor(
    private router: Router,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const match = Object.keys(this.pageTitles).find(k => e.url.startsWith(k));
        this.pageTitle = match ? this.pageTitles[match] : 'PulseOps';
      });

    const match = Object.keys(this.pageTitles).find(k => this.router.url.startsWith(k));
    this.pageTitle = match ? this.pageTitles[match] : 'PulseOps';

    this.wsService.connected$.subscribe(v => this.isConnected = v);

    this.updateTime();
    this.timeInterval = setInterval(() => this.updateTime(), 1000);
  }

  private updateTime(): void {
    this.currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
  }

  ngOnDestroy(): void {
    if (this.timeInterval) clearInterval(this.timeInterval);
  }
}