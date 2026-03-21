import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { WebSocketService } from '../../../core/services/websocket.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  activeRoute = '';
  isConnected = false;
  userName = '';
  userRole = '';
  private subs = new Subscription();

  navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: '⬡' },
    { label: 'Services',  path: '/services',  icon: '◈' },
    { label: 'Incidents', path: '/incidents', icon: '◉' },
    { label: 'Query AI',  path: '/nlq',       icon: '◎' },
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    // Set immediately from browser URL on page load/refresh
    this.setActive(window.location.pathname);

    // Update on every navigation
    const routeSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.setActive(e.urlAfterRedirects || e.url);
      });
    this.subs.add(routeSub);

    // WebSocket status
    const wsSub = this.wsService.connected$.subscribe(v => {
      this.isConnected = v;
    });
    this.subs.add(wsSub);

    // User info
    const user = this.authService.currentUser;
    if (user) {
      this.userName = user.name;
      this.userRole = user.role;
    }
  }

  private setActive(url: string): void {
    // Strip query params
    const cleanUrl = url.split('?')[0].split('#')[0];

    // Find longest matching path
    let matched = '';
    for (const item of this.navItems) {
      if (cleanUrl === item.path || cleanUrl.startsWith(item.path + '/')) {
        if (item.path.length > matched.length) {
          matched = item.path;
        }
      }
    }

    this.activeRoute = matched || cleanUrl;
  }

  isActive(path: string): boolean {
    return this.activeRoute === path;
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    this.wsService.disconnect();
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}