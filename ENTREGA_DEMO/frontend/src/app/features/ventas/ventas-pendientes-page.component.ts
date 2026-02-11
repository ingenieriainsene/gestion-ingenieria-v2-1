import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VentasService } from '../../services/ventas.service';
import { Tramite } from '../../services/domain.services';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ventas-pendientes-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Ventas Pendientes</h1>
        <p class="subtitle">Intervenciones con estado Pendiente. Gestiona desde la ficha del contrato.</p>
      </div>
      <div class="ventas-grid">
        <div *ngIf="ventas.length === 0" class="empty-state">
          No hay ventas pendientes.
        </div>
        <div *ngFor="let v of ventas" class="venta-card">
          <div class="venta-info">
            <span class="venta-tipo">{{ v.tipoTramite }}</span>
            <small>Contrato #{{ v.idContrato }}</small>
            <span class="badge-pendiente">Pendiente</span>
          </div>
          <a [routerLink]="['/contratos', v.idContrato]" class="btn-ir">Ir al contrato</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 900px; margin: 0 auto; padding: 24px; }
    .page-header { margin-bottom: 24px; }
    .page-header h1 { margin: 0 0 8px 0; color: #1e293b; font-size: 1.5rem; }
    .subtitle { margin: 0; color: #64748b; font-size: 0.9rem; }
    .ventas-grid { display: flex; flex-direction: column; gap: 12px; }
    .empty-state { text-align: center; color: #94a3b8; padding: 48px 24px; background: #f8fafc; border-radius: 12px; border: 1px dashed #e2e8f0; }
    .venta-card {
      display: flex; justify-content: space-between; align-items: center;
      background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .venta-info { display: flex; flex-direction: column; gap: 4px; }
    .venta-tipo { font-weight: 700; color: #1e293b; font-size: 1rem; }
    .venta-info small { color: #64748b; font-size: 0.85rem; }
    .badge-pendiente {
      display: inline-block; margin-top: 6px; padding: 4px 10px; border-radius: 6px;
      background: #fee2e2; color: #b91c1c; font-size: 0.75rem; font-weight: 700; width: fit-content;
    }
    .btn-ir {
      background: #f1c40f; color: #1e293b; padding: 8px 16px; border-radius: 8px;
      text-decoration: none; font-weight: 700; font-size: 0.85rem;
    }
    .btn-ir:hover { background: #e6b800; color: #1e293b; }
  `]
})
export class VentasPendientesPageComponent implements OnInit, OnDestroy {
  ventas: Tramite[] = [];
  private sub: Subscription | null = null;

  constructor(private ventasService: VentasService) {}

  ngOnInit() {
    this.ventasService.cargarTodasVentasPendientes();
    this.sub = this.ventasService.ventas$.subscribe(v => this.ventas = v);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
