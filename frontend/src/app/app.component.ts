import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './layout/sidebar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  template: `
    <ng-container *ngIf="auth.isLoggedIn(); else authless">
      <app-sidebar (collapsedChange)="sidebarCollapsed = $event"></app-sidebar>

      <div class="main-content" [class.expanded]="sidebarCollapsed">
        <div class="main-container">
          <router-outlet></router-outlet>
        </div>
      </div>
    </ng-container>

    <ng-template #authless>
      <router-outlet></router-outlet>
    </ng-template>
  `
})
export class AppComponent {
  title = 'gestion-frontend';
  sidebarCollapsed = false;
  constructor(public auth: AuthService) {}
}
