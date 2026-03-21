import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { WebSocketService } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-incidents-list',
  templateUrl: './incidents-list.component.html',
  styleUrls: ['./incidents-list.component.scss'],
})
export class IncidentsListComponent implements OnInit, OnDestroy {
  incidents: any[] = [];
  stats: any = {};
  isLoading = true;

  // Filters
  filterStatus = '';
  filterSeverity = '';
  filterServiceId = '';

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalCount = 0;
  limit = 10;

  private subs = new Subscription();

  constructor(
    private api: ApiService,
    private ws: WebSocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadIncidents();
    this.subscribeToWS();
  }

  loadStats(): void {
    this.api.getIncidentStats({ hoursBack: '24' }).subscribe({
      next: (res) => {
        if (res.success) this.stats = res.data;
      }
    });
  }

  loadIncidents(): void {
    this.isLoading = true;
    this.api.getIncidents({
      status: this.filterStatus,
      severity: this.filterSeverity,
      serviceId: this.filterServiceId,
      page: this.currentPage,
      limit: this.limit,
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.incidents = res.data;
          this.totalPages = res.pagination?.totalPages || 1;
          this.totalCount = res.pagination?.totalCount || 0;
        }
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadIncidents();
  }

  clearFilters(): void {
    this.filterStatus = '';
    this.filterSeverity = '';
    this.filterServiceId = '';
    this.currentPage = 1;
    this.loadIncidents();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadIncidents();
  }

  viewIncident(id: string): void {
    this.router.navigate(['/incidents', id]);
  }

  subscribeToWS(): void {
    const sub = this.ws.messages$.subscribe(msg => {
      if (msg.event === 'incident:created') {
        this.incidents.unshift(msg.data);
        if (this.incidents.length > this.limit) this.incidents.pop();
        this.totalCount++;
        this.loadStats();
      }
      if (msg.event === 'incident:updated') {
        const idx = this.incidents.findIndex(i => i._id === msg.data._id);
        if (idx > -1) this.incidents[idx] = msg.data;
      }
    });
    this.subs.add(sub);
  }

  getPages(): number[] {
    const pages = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
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

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}