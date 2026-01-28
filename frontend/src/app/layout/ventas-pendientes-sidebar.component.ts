import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Tramite } from '../services/domain.services';
import { VentasService } from '../services/ventas.service';

@Component({
  selector: 'app-ventas-pendientes-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <aside class="ventas-sidebar">
    <h3 class="ventas-title">⏳ Ventas Pendientes</h3>

    <ng-container *ngIf="ventas$ | async as ventas">
      <div *ngIf="ventas.length === 0" class="ventas-empty">
        No hay ventas pendientes.
      </div>

      <div *ngFor="let v of ventas" class="venta-card">
        <div class="venta-header">
          <span class="venta-tipo">{{ v.tipoTramite }}</span>
          <span class="venta-estado">Pendiente</span>
        </div>
        <div class="venta-body">
          <small>{{ v.detalleSeguimiento || 'Sin descripción' }}</small><br />
          <small>Contrato #{{ v.idContrato }}</small>
        </div>
        <div class="venta-actions">
          <a
            [routerLink]="['/contratos', v.idContrato, 'tramites', v.idTramite]"
            class="btn-link"
          >
            ⚙️ Gestionar
          </a>
        </div>
      </div>
    </ng-container>
  </aside>
  `,
  styles: [`
    .ventas-sidebar {
      width: 320px;
      background: #ffffff;
      border-left: 1px solid #e2e8f0;
      padding: 15px;
      box-shadow: -4px 0 10px rgba(15,23,42,0.06);
    }
    .ventas-title {
      font-size: 0.9rem;
      text-transform: uppercase;
      color: #1e293b;
      border-bottom: 2px solid #f1c40f;
      padding-bottom: 4px;
      margin-bottom: 10px;
    }
    .ventas-empty {
      font-size: 0.8rem;
      color: #94a3b8;
      text-align: center;
      padding: 15px 5px;
    }
    .venta-card {
      background: #f8fafc;
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 8px;
      border: 1px solid #e2e8f0;
      transition: transform .2s ease, box-shadow .2s ease;
    }
    .venta-card:hover {
      transform: translateX(-4px);
      box-shadow: 0 4px 12px rgba(15,23,42,0.12);
    }
    .venta-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .venta-tipo {
      font-weight: 700;
      color: #1e293b;
      font-size: 0.8rem;
    }
    .venta-estado {
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 999px;
      background: #ffedd5;
      color: #c2410c;
      border: 1px solid #fed7aa;
      text-transform: uppercase;
      font-weight: 800;
    }
    .venta-actions {
      margin-top: 6px;
      text-align: right;
    }
    .btn-link {
      font-size: 0.75rem;
      color: #1e293b;
      text-decoration: none;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 6px;
      background: #f1c40f;
    }
  `]
})
export class VentasPendientesSidebarComponent {
  ventas$: Observable<Tramite[]> = this.ventasService.ventas$;

  constructor(private ventasService: VentasService) { }
}

