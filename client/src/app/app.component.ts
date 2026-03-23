import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { WebSocketService } from './core/services/websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  isAuthPage = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private wsService: WebSocketService
  ) {
    this.isAuthPage = window.location.pathname.includes('/auth');
  }

  ngOnInit(): void {
    this.isAuthPage = window.location.pathname.includes('/auth');

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.isAuthPage = e.url.includes('/auth');
        if (!this.isAuthPage && this.authService.isLoggedIn) {
          if (!this.wsService.connected$.value) {
            this.wsService.connect();
          }
        }
      });

    // Connect WS if already logged in on page load
    if (this.authService.isLoggedIn && !this.isAuthPage) {
      this.wsService.connect();
    }
  }

  ngOnDestroy(): void {
    this.wsService.disconnect();
  }
}