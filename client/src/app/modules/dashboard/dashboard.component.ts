import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats = {
    totalIncidents: 0,
    openIncidents: 0,
    criticalIncidents: 0,
    resolvedToday: 0,
    avgResolutionTime: 0,
    totalServices: 0,
    healthyServices: 0,
    degradedServices: 0,
  };
  recentIncidents: any[] = [];
  services: any[] = [];
  liveMetrics: any[] = [];
  agentSteps: any[] = [];
  notifications: any[] = [];

  isLoading = true;
  userName = '';

  private subs = new Subscription();

  constructor(
    private api: ApiService,
    private ws: WebSocketService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userName = this.authService.currentUser?.name?.split(' ')[0] || 'Engineer';
    this.loadData();
    this.subscribeToWebSocket();
  }

  loadData(): void {
    this.isLoading = true;

    // Load stats
    this.api.getIncidentStats({ hoursBack: '24' }).subscribe({
      next: (res) => {
        if (res.success) {
          this.stats.totalIncidents = res.data.total;
          this.stats.openIncidents = res.data.byStatus.open;
          this.stats.criticalIncidents = res.data.bySeverity.critical;
          this.stats.avgResolutionTime = res.data.avgResolutionTimeMinutes;
          const resolved = res.data.byStatus.resolved + res.data.byStatus.closed;
          this.stats.resolvedToday = resolved;
        }
      }
    });

    // Load recent incidents
    this.api.getIncidents({ limit: '5', page: '1' }).subscribe({
      next: (res) => {
        if (res.success) this.recentIncidents = res.data;
      }
    });

    // Load services
    this.api.getServices().subscribe({
      next: (res) => {
        if (res.success) {
          this.services = res.data.slice(0, 6);
          this.stats.totalServices = res.count;
          this.stats.healthyServices = res.data.filter((s: any) => s.status === 'healthy').length;
          this.stats.degradedServices = res.data.filter((s: any) => s.status === 'degraded' || s.status === 'down').length;
          this.isLoading = false;
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  subscribeToWebSocket(): void {
    const sub = this.ws.messages$.subscribe(msg => {
      switch (msg.event) {
        case 'incident:created':
          this.stats.openIncidents++;
          this.stats.totalIncidents++;
          this.recentIncidents.unshift(msg.data);
          if (this.recentIncidents.length > 5) this.recentIncidents.pop();
          this.addNotification('🚨 New incident: ' + msg.data.title, 'critical');
          break;

        case 'anomaly:detected':
          this.addNotification('⚠ Anomaly detected in ' + msg.data.serviceId, 'warning');
          break;

        case 'metrics:update':
          this.liveMetrics = msg.data.services || [];
          break;

        case 'agent:step':
          this.agentSteps.unshift(msg.data);
          if (this.agentSteps.length > 5) this.agentSteps.pop();
          break;

        case 'agent:complete':
          this.addNotification('✓ AI investigation complete', 'success');
          this.stats.openIncidents = Math.max(0, this.stats.openIncidents - 1);
          break;

        case 'incident:updated':
          const idx = this.recentIncidents.findIndex(i => i._id === msg.data._id);
          if (idx > -1) this.recentIncidents[idx] = msg.data;
          break;
      }
    });
    this.subs.add(sub);
  }

  addNotification(message: string, type: string): void {
    const notif = { message, type, id: Date.now() };
    this.notifications.unshift(notif);
    if (this.notifications.length > 4) this.notifications.pop();
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== notif.id);
    }, 5000);
  }

  getSeverityClass(severity: string): string {
    return `badge badge-${severity}`;
  }

  getStatusClass(status: string): string {
    return `badge badge-${status}`;
  }

  getMetricColor(value: number, type: string): string {
    if (type === 'cpu' || type === 'memory') {
      if (value >= 90) return 'var(--accent-crimson)';
      if (value >= 75) return 'var(--accent-amber)';
      return 'var(--accent-mint)';
    }
    if (type === 'errorRate') {
      if (value >= 10) return 'var(--accent-crimson)';
      if (value >= 5) return 'var(--accent-amber)';
      return 'var(--accent-mint)';
    }
    return 'var(--accent-cyan)';
  }

  timeAgo(date: string): string {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
  }
  
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }


}