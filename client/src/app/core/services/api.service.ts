import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ─── Metrics ─────────────────────────────────────────
  getMetrics(serviceId: string, params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(k => {
        if (params[k]) httpParams = httpParams.set(k, params[k]);
      });
    }
    return this.http.get(`${this.baseUrl}/metrics/${serviceId}`, { params: httpParams });
  }

  getLatestMetric(serviceId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/metrics/${serviceId}/latest`);
  }

  ingestMetric(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/metrics`, payload);
  }

  // ─── Incidents ───────────────────────────────────────
  getIncidents(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(k => {
        if (params[k] !== undefined && params[k] !== '') {
          httpParams = httpParams.set(k, params[k]);
        }
      });
    }
    return this.http.get(`${this.baseUrl}/incidents`, { params: httpParams });
  }

  getIncidentById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/incidents/${id}`);
  }

  getIncidentStats(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(k => {
        if (params[k]) httpParams = httpParams.set(k, params[k]);
      });
    }
    return this.http.get(`${this.baseUrl}/incidents/stats`, { params: httpParams });
  }

  resolveIncident(id: string, payload: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/incidents/${id}/resolve`, payload);
  }

  assignIncident(id: string, assignedTo: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/incidents/${id}/assign`, { assignedTo });
  }

  // ─── Services ────────────────────────────────────────
  getServices(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(k => {
        if (params[k]) httpParams = httpParams.set(k, params[k]);
      });
    }
    return this.http.get(`${this.baseUrl}/services`, { params: httpParams });
  }

  getServiceById(serviceId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/services/${serviceId}`);
  }

  registerService(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/services`, payload);
  }

  updateServiceStatus(serviceId: string, status: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/services/${serviceId}/status`, { status });
  }

  // ─── Deployments ─────────────────────────────────────
  getDeployments(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(k => {
        if (params[k]) httpParams = httpParams.set(k, params[k]);
      });
    }
    return this.http.get(`${this.baseUrl}/deployments`, { params: httpParams });
  }

  getDeploymentsByService(serviceId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/deployments/${serviceId}`);
  }

  // ─── Logs ────────────────────────────────────────────
  getLogs(serviceId: string, params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(k => {
        if (params[k]) httpParams = httpParams.set(k, params[k]);
      });
    }
    return this.http.get(`${this.baseUrl}/logs/${serviceId}`, { params: httpParams });
  }

  // ─── NLQ ─────────────────────────────────────────────
  naturalLanguageQuery(question: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/nlq/query`, { question });
  }

  deleteService(serviceId: string): Observable<any> {
  return this.http.delete(`${this.baseUrl}/services/${serviceId}`);
}
closeIncident(id: string): Observable<any> {
  return this.http.patch(`${this.baseUrl}/incidents/${id}/close`, {});
}
}