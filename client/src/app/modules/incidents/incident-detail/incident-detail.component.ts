import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { WebSocketService } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-incident-detail',
  templateUrl: './incident-detail.component.html',
  styleUrls: ['./incident-detail.component.scss'],
})
export class IncidentDetailComponent implements OnInit, OnDestroy {
  incident: any = null;
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  isResolving = false;
  isAssigning = false;
  isClosing = false;
  showResolveForm = false;
  showAssignForm = false;
  activeTab = 'overview';

  resolveForm = { rootCause: '', notes: '' };
  assignForm = { assignedTo: '' };

  agentSteps: any[] = [];

  private subs = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private ws: WebSocketService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadIncident(id);
    this.subscribeToWS();
  }

  loadIncident(id: string): void {
    this.isLoading = true;
    this.api.getIncidentById(id).subscribe({
      next: (res) => {
        if (res.success) this.incident = res.data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Incident not found';
        this.isLoading = false;
      }
    });
  }

  resolve(): void {
    if (!this.resolveForm.rootCause.trim()) {
      this.errorMessage = 'Root cause is required to resolve';
      return;
    }

    this.isResolving = true;
    this.errorMessage = '';

    this.api.resolveIncident(this.incident._id, this.resolveForm).subscribe({
      next: (res) => {
        if (res.success) {
          this.incident = res.data;
          this.showResolveForm = false;
          this.resolveForm = { rootCause: '', notes: '' };
          this.successMessage = 'Incident resolved successfully';
          setTimeout(() => this.successMessage = '', 4000);
        }
        this.isResolving = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to resolve incident';
        this.isResolving = false;
      }
    });
  }

  assign(): void {
    if (!this.assignForm.assignedTo.trim()) {
      this.errorMessage = 'Please enter an assignee';
      return;
    }

    this.isAssigning = true;
    this.errorMessage = '';

    this.api.assignIncident(this.incident._id, this.assignForm.assignedTo).subscribe({
      next: (res) => {
        if (res.success) {
          this.incident = res.data;
          this.showAssignForm = false;
          this.assignForm = { assignedTo: '' };
          this.successMessage = `Assigned to ${res.data.assignedTo}`;
          setTimeout(() => this.successMessage = '', 4000);
        }
        this.isAssigning = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to assign incident';
        this.isAssigning = false;
      }
    });
  }

  subscribeToWS(): void {
    const sub = this.ws.messages$.subscribe(msg => {
      if (msg.event === 'agent:step' &&
        msg.data.incidentId === this.incident?.incidentId) {
        this.agentSteps.push(msg.data);
      }
      if (msg.event === 'incident:updated' &&
        msg.data._id === this.incident?._id) {
        this.incident = msg.data;
      }
    });
    this.subs.add(sub);
  }

  goBack(): void {
    this.router.navigate(['/incidents']);
  }

  setTab(tab: string): void {
    this.activeTab = tab;
  }

  canResolve(): boolean {
    return this.incident?.status === 'open' ||
      this.incident?.status === 'investigating';
  }

  canAssign(): boolean {
    return this.incident?.status !== 'closed';
  }

  formatDate(date: string): string {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
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

  canClose(): boolean {
    return this.incident?.status === 'resolved';
  }

  close(): void {
    if (!confirm('Are you sure you want to close this incident?')) return;

    this.isClosing = true;
    this.errorMessage = '';

    this.api.closeIncident(this.incident._id).subscribe({
      next: (res) => {
        if (res.success) {
          this.incident = res.data;
          this.successMessage = 'Incident closed successfully';
          setTimeout(() => this.successMessage = '', 4000);
        }
        this.isClosing = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to close incident';
        this.isClosing = false;
      }
    });
  }


  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}