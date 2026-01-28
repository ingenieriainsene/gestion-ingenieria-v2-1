import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './layout/navbar.component';
import { SidebarComponent } from './layout/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, SidebarComponent],
  template: `
    <app-sidebar (collapsedChange)="sidebarCollapsed = $event"></app-sidebar>

    <div class="main-content" [class.expanded]="sidebarCollapsed">
      <div class="main-container">
        <app-navbar></app-navbar>
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class AppComponent {
  title = 'gestion-frontend';
  sidebarCollapsed = false;
}
