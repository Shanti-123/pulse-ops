import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TopbarComponent } from './components/topbar/topbar.component';

@NgModule({
  declarations: [SidebarComponent, TopbarComponent],
  imports: [CommonModule, RouterModule],
  exports: [SidebarComponent, TopbarComponent, RouterModule],
})
export class SharedModule {}