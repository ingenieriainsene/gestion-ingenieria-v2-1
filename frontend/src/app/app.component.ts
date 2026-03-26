import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { SidebarComponent } from './layout/sidebar.component';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  template: `
    <div *ngIf="auth.isLoggedIn$ | async; else authless">
      <app-sidebar (collapsedChange)="sidebarCollapsed = $event"></app-sidebar>

      <div class="main-content" [class.expanded]="sidebarCollapsed">
        <div class="main-container">
          <div class="global-back-bar">
            <button type="button" class="global-back-button" (click)="goBack()">
              ← Volver atrás
            </button>
          </div>

          <router-outlet></router-outlet>
        </div>
      </div>
    </div>

    <ng-template #authless>
      <router-outlet></router-outlet>
    </ng-template>
  `,
  styles: [`
    .main-container {
      position: relative;
      padding-top: 0.75rem;
    }

    .global-back-bar {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 0.75rem;
    }

    .global-back-button {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.9rem;
      border-radius: 999px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #64748b;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(15,23,42,0.06);
      transition: all 0.16s ease;
    }

    .global-back-button:hover {
      color: #1e293b;
      border-color: #cbd5e1;
      box-shadow: 0 4px 10px rgba(15,23,42,0.1);
      transform: translateY(-1px);
    }

    @media (max-width: 768px) {
      .main-container {
        padding-top: 0.5rem;
      }

      .global-back-bar {
        margin-bottom: 0.5rem;
      }

      .global-back-button {
        font-size: 0.8rem;
        padding: 0.3rem 0.8rem;
      }
    }
  `]
})
export class AppComponent {
  title = 'gestion-frontend';
  sidebarCollapsed = false;
  constructor(public auth: AuthService, private location: Location) {}

  goBack() {
    this.location.back();
  }
}
