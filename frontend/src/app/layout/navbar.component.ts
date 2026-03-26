import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificacionService, Notificacion } from '../services/notificacion.service';
import { Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    template: `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark mb-4" *ngIf="auth.isLoggedIn()">
      <div class="container-fluid px-4">
        <a class="navbar-brand d-flex align-items-center" routerLink="/">
          <span class="fs-4 fw-bold tracking-tight">Gestión <span class="text-primary">Ingeniería</span></span>
        </a>
        
        <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
             <li class="nav-item"><a class="nav-link px-3" routerLink="/clientes" routerLinkActive="active">Clientes</a></li>
             <li class="nav-item"><a class="nav-link px-3" routerLink="/proveedores" routerLinkActive="active">Proveedores</a></li>
             <li class="nav-item"><a class="nav-link px-3" routerLink="/contratos" routerLinkActive="active">Contratos</a></li>
             <li class="nav-item"><a class="nav-link px-3" routerLink="/locales" routerLinkActive="active">Locales</a></li>
          </ul>

          <div class="d-flex align-items-center gap-4">
            <!-- Campana de Notificaciones -->
            <div class="dropdown notification-dropdown">
              <button class="btn btn-link link-light position-relative p-2 border-0 dropdown-toggle no-caret" 
                      type="button" id="notifDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                <span class="fs-5">🔔</span>
                <span *ngIf="noLeidas.length > 0" 
                      class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                      style="font-size: 0.65rem; padding: 0.35em 0.65em;">
                  {{ noLeidas.length }}
                </span>
              </button>
              
              <ul class="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2 p-0" 
                  aria-labelledby="notifDropdown" 
                  style="width: 320px; max-height: 450px; overflow-y: auto; border-radius: 12px;">
                <li class="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
                  <h6 class="mb-0 fw-bold">Notificaciones</h6>
                  <button *ngIf="noLeidas.length > 0" 
                          class="btn btn-sm btn-link text-decoration-none p-0" 
                          (click)="marcarTodasComoLeidas($event)">
                    Marcar todo como leído
                  </button>
                </li>
                
                <li *ngIf="noLeidas.length === 0" class="p-4 text-center text-muted">
                  <span class="d-block fs-2 mb-2">🎈</span>
                  <p class="small mb-0">No tienes notificaciones pendientes</p>
                </li>

                <li *ngFor="let n of noLeidas" class="notification-item p-3 border-bottom position-relative">
                  <div class="d-flex justify-content-between">
                    <p class="small mb-1 pe-3">{{ n.mensaje }}</p>
                    <button class="btn-close" style="font-size: 0.6rem;" (click)="marcarComoLeida(n, $event)"></button>
                  </div>
                  <div class="d-flex justify-content-between align-items-center mt-1">
                    <span class="text-muted" style="font-size: 0.7rem;">{{ n.fechaCreacion | date:'dd/MM HH:mm' }}</span>
                    <a *ngIf="n.link" [routerLink]="n.link" class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size: 0.7rem;" (click)="marcarComoLeida(n, $event)">Ver</a>
                  </div>
                </li>
              </ul>
            </div>

            <button class="btn btn-sm btn-outline-light rounded-pill px-3" (click)="auth.logout()">
              <span class="me-1">🚪</span> Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  `,
    styles: [`
    .no-caret::after { display: none; }
    .notification-item:hover { background-color: #f8fafc; }
    .nav-link.active { border-bottom: 2px solid #3b82f6; color: #fff !important; }
    .navbar-brand { letter-spacing: -0.5px; }
    .notification-dropdown .dropdown-menu { animation: slideIn 0.2s ease-out; }
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class NavbarComponent implements OnInit, OnDestroy {
    noLeidas: Notificacion[] = [];
    private sub?: Subscription;

    constructor(
        public auth: AuthService,
        private notifService: NotificacionService
    ) { }

    ngOnInit() {
        if (this.auth.isLoggedIn()) {
            this.sub = interval(30000).pipe(
                startWith(0),
                switchMap(() => this.notifService.getNoLeidas())
            ).subscribe(data => this.noLeidas = data);
        }
    }

    ngOnDestroy() {
        if (this.sub) this.sub.unsubscribe();
    }

    marcarComoLeida(n: Notificacion, event: Event) {
        event.stopPropagation();
        this.notifService.marcarComoLeida(n.idNotificacion).subscribe(() => {
            this.noLeidas = this.noLeidas.filter(x => x.idNotificacion !== n.idNotificacion);
        });
    }

    marcarTodasComoLeidas(event: Event) {
        event.stopPropagation();
        this.notifService.marcarTodasComoLeidas().subscribe(() => {
            this.noLeidas = [];
        });
    }
}
