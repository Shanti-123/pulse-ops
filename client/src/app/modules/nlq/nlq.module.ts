import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NlqComponent } from './nlq.component';

const routes: Routes = [
  { path: '', component: NlqComponent },
];

@NgModule({
  declarations: [NlqComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
  ],
})
export class NlqModule {}