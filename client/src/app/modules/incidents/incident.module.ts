import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IncidentsListComponent } from './incident-list/incidents-list.component';
import { IncidentDetailComponent } from './incident-detail/incident-detail.component';

const routes: Routes = [
  { path: '', component: IncidentsListComponent },
  { path: ':id', component: IncidentDetailComponent },
];

@NgModule({
  declarations: [IncidentsListComponent, IncidentDetailComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
  ],
})
export class IncidentsModule {}