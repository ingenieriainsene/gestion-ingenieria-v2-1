import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="sidebar" [class.collapsed]="collapsed" *ngIf="auth.isLoggedIn()">
      <div class="toggle-btn" (click)="toggleSidebar()">
        &#9776;
      </div>

      <div class="nav-brand-container">
        <a class="nav-brand" routerLink="/">Insene Solar</a>
      </div>

      <nav class="side-links">
        <a
          class="side-item"
          routerLink="/clientes"
          routerLinkActive="active"
        >
          <span>Clientes</span>
        </a>

        <a
          class="side-item"
          routerLink="/proveedores"
          routerLinkActive="active"
        >
          <span>Proveedores</span>
        </a>

        <a
          class="side-item"
          routerLink="/productos"
          routerLinkActive="active"
        >
          <span>Almacén</span>
        </a>

        <a
          class="side-item"
          routerLink="/contratos"
          routerLinkActive="active"
        >
          <span>Contratos</span>
        </a>

        <a
          class="side-item"
          routerLink="/agendar-citas"
          routerLinkActive="active"
        >
          <span>Agendar citas</span>
        </a>

        <a
          class="side-item"
          routerLink="/chat"
          routerLinkActive="active"
        >
          <span>Chat</span>
        </a>


        <a
          class="side-item"
          routerLink="/seguimientos"
          routerLinkActive="active"
        >
          <span>Seguimientos</span>
        </a>

        <a
          class="side-item"
          routerLink="/presupuestos"
          routerLinkActive="active"
        >
          <span>Presupuestos</span>
        </a>

        <a
          class="side-item"
          routerLink="/locales"
          routerLinkActive="active"
        >
          <span>Locales</span>
        </a>

        <a
          class="side-item"
          routerLink="/usuarios"
          routerLinkActive="active"
        >
          <span>Usuarios</span>
        </a>

        <a
          class="side-item"
          routerLink="/auditoria"
          routerLinkActive="active"
        >
          <span>Auditoría</span>
        </a>
      </nav>

      <div class="logout-item" style="padding: 20px;">
        <button class="btn-primary" (click)="logout()">
          Salir
        </button>
      </div>
    </div>
  `
})
export class SidebarComponent {
  collapsed = false;

  @Output() collapsedChange = new EventEmitter<boolean>();

  constructor(public auth: AuthService) {}

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  logout(): void {
    this.auth.logout();
  }
}

