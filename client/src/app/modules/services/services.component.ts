import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
})
export class ServicesComponent implements OnInit, OnDestroy {
  services: any[] = [];
  filteredServices: any[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  // Filters
  searchQuery = '';
  filterEnvironment = '';
  filterStatus = '';

  // Register form
  showRegisterForm = false;
  isRegistering = false;
  registerForm = {
    serviceId: '',
    name: '',
    description: '',
    environment: 'production',
    version: '1.0.0',
    host: '',
    region: 'us-east-1',
  };

  environments = ['production', 'staging', 'development'];
  statuses = ['healthy', 'degraded', 'down', 'unknown'];
  regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-south-1'];

  private subs = new Subscription();

  constructor(
    private api: ApiService,
    private ws: WebSocketService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadServices();
    this.subscribeToWS();
  }

  loadServices(): void {
    this.isLoading = true;
    this.api.getServices().subscribe({
      next: (res) => {
        if (res.success) {
          this.services = res.data;
          this.applyFilters();
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load services';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredServices = this.services.filter(s => {
      const matchSearch = !this.searchQuery ||
        s.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        s.serviceId.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchEnv = !this.filterEnvironment || s.environment === this.filterEnvironment;
      const matchStatus = !this.filterStatus || s.status === this.filterStatus;
      return matchSearch && matchEnv && matchStatus;
    });
  }

  onSearch(val: string): void {
    this.searchQuery = val;
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filterEnvironment = '';
    this.filterStatus = '';
    this.applyFilters();
  }

  toggleRegisterForm(): void {
    this.showRegisterForm = !this.showRegisterForm;
    this.errorMessage = '';
    this.successMessage = '';
    if (!this.showRegisterForm) {
      this.resetRegisterForm();
    }
  }

  resetRegisterForm(): void {
    this.registerForm = {
      serviceId: '',
      name: '',
      description: '',
      environment: 'production',
      version: '1.0.0',
      host: '',
      region: 'us-east-1',
    };
  }

  registerService(): void {
    if (!this.registerForm.serviceId || !this.registerForm.name) {
      this.errorMessage = 'Service ID and name are required';
      return;
    }

    this.isRegistering = true;
    this.errorMessage = '';

    this.api.registerService(this.registerForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.successMessage = `Service "${res.data.name}" registered successfully`;
          this.showRegisterForm = false;
          this.resetRegisterForm();
          this.loadServices();
          setTimeout(() => this.successMessage = '', 4000);
        }
        this.isRegistering = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to register service';
        this.isRegistering = false;
      }
    });
  }

  updateStatus(serviceId: string, status: string): void {
    this.api.updateServiceStatus(serviceId, status).subscribe({
      next: (res) => {
        if (res.success) {
          const idx = this.services.findIndex(s => s.serviceId === serviceId);
          if (idx > -1) {
            this.services[idx].status = status;
            this.applyFilters();
          }
          this.successMessage = 'Status updated';
          setTimeout(() => this.successMessage = '', 2000);
        }
      },
      error: () => {
        this.errorMessage = 'Failed to update status';
      }
    });
  }

  subscribeToWS(): void {
    const sub = this.ws.messages$.subscribe(msg => {
      if (msg.event === 'metrics:update') {
        msg.data.services?.forEach((m: any) => {
          const svc = this.services.find(s => s.serviceId === m.serviceId);
          if (svc) {
            svc.latestMetrics = m.metrics;
            svc.lastSeenAt = m.timestamp;
          }
        });
        this.applyFilters();
      }
    });
    this.subs.add(sub);
  }

  getStatusDotClass(status: string): string {
    const map: Record<string, string> = {
      healthy: 'dot-mint',
      degraded: 'dot-amber',
      down: 'dot-red',
      unknown: 'dot-gray',
    };
    return map[status] || 'dot-gray';
  }

  timeAgo(date: string): string {
    if (!date) return 'Never';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
  get isAdmin(): boolean {
    return this.authService.currentUser?.role === 'admin';
  }

  deleteService(serviceId: string, name: string): void {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    this.api.deleteService(serviceId).subscribe({
      next: (res) => {
        if (res.success) {
          this.services = this.services.filter(s => s.serviceId !== serviceId);
          this.applyFilters();
          this.successMessage = `Service "${name}" deleted`;
          setTimeout(() => this.successMessage = '', 4000);
        }
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to delete service';
      }
    });
  }
  ngOnDestroy(): void {
      this.subs.unsubscribe();
  }
}