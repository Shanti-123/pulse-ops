import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () =>
      import('./modules/auth/auth.module').then(m => m.AuthModule),
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/dashboard/dashboard.module').then(m => m.DashboardModule),
  },
  {
    path: 'services',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/services/services.module').then(m => m.ServicesModule),
  },
  {
    path: 'incidents',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/incidents/incident.module').then(m => m.IncidentsModule),
  },
  {
    path: 'nlq',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./modules/nlq/nlq.module').then(m => m.NlqModule),
  },
  { path: '**', redirectTo: 'dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}