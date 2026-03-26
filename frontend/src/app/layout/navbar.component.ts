import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4" *ngIf="auth.isLoggedIn()">
      <div class="container-fluid">
        <a class="navbar-brand" routerLink="/">Gestión Ingeniería</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
             <li class="nav-item"><a class="nav-link" routerLink="/clientes">Clientes</a></li>
             <li class="nav-item"><a class="nav-link" routerLink="/proveedores">Proveedores</a></li>
             <li class="nav-item"><a class="nav-link" routerLink="/contratos">Contratos</a></li>
             <li class="nav-item"><a class="nav-link" routerLink="/locales">Locales</a></li>
          </ul>
          <div class="d-flex align-items-center gap-3">
             <button class="btn btn-outline-danger" (click)="auth.logout()">Salir</button>
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
    constructor(public auth: AuthService) { }
}
