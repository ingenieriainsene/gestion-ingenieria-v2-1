import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ComprasService, CompraDocumentoDTO } from '../../services/compras.service';
import { TramiteService, TramiteDetalleResponse } from '../../services/domain.services';
import { ApiService } from '../../services/api.service';

interface VentaResumen {
  id: number;
  tipo: 'ALBARAN' | 'FACTURA';
  numero: string;
  fecha: string;
  cliente: string;
  contratoId?: number | null;
  total: number;
}

@Component({
  selector: 'app-contabilidad',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Contabilidad</h1>
        <p class="subtitle">Resumen global de ventas y compras.</p>
      </div>

      <div class="tabs-header">
        <button class="tab-btn" [class.active]="activeTab === 'VENTAS'" (click)="activeTab = 'VENTAS'">
          Ventas
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'COMPRAS'" (click)="activeTab = 'COMPRAS'">
          Compras
        </button>
      </div>

      <div *ngIf="activeTab === 'VENTAS'" class="tab-content fade-in">
        <div *ngIf="loadingVentas" class="empty-state">Cargando ventas...</div>
        <div *ngIf="!loadingVentas">
          <table class="modern-table table-card">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Documento</th>
                <th>Cliente</th>
                <th class="right">Total</th>
                <th class="right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let v of ventas">
                <td data-label="Fecha">{{ v.fecha | date:'dd/MM/yyyy' }}</td>
                <td data-label="Documento">
                  <span class="badge-tipo">{{ v.tipo }}</span>
                  <span class="muted">{{ v.numero }}</span>
                </td>
                <td data-label="Cliente">{{ v.cliente || '—' }}</td>
                <td data-label="Total" class="right">{{ v.total | currency:'EUR' }}</td>
                <td data-label="Acciones" class="right">
                  <a *ngIf="v.contratoId" [routerLink]="['/contratos', v.contratoId]" class="btn-link">
                    Ver contrato
                  </a>
                </td>
              </tr>
              <tr *ngIf="ventas.length === 0">
                <td colspan="5" class="empty-state">No hay ventas registradas.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="activeTab === 'COMPRAS'" class="tab-content fade-in">
        <div *ngIf="loadingCompras" class="empty-state">Cargando compras...</div>
        <div *ngIf="!loadingCompras">
          <table class="modern-table table-card">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Proveedor</th>
                <th>Nº documento</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of compras">
                <td data-label="Fecha">{{ c.fecha | date:'dd/MM/yyyy' }}</td>
                <td data-label="Tipo">
                  <span class="badge-tipo">{{ c.tipo }}</span>
                </td>
                <td data-label="Proveedor">{{ c.proveedorNombre || '—' }}</td>
                <td data-label="Documento">{{ c.numeroDocumento }}</td>
                <td data-label="Total" class="right">{{ c.total | currency:'EUR' }}</td>
              </tr>
              <tr *ngIf="compras.length === 0">
                <td colspan="5" class="empty-state">No hay compras registradas.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1100px; margin: 0 auto; padding: 24px; }
    .page-header { margin-bottom: 16px; }
    .page-header h1 { margin: 0 0 4px 0; color: #1e293b; font-size: 1.6rem; }
    .subtitle { margin: 0; color: #64748b; font-size: 0.9rem; }
    .tabs-header { display: flex; gap: 8px; margin-bottom: 16px; }
    .tab-btn {
      border: 1px solid #e2e8f0; background: #f8fafc; color: #334155;
      padding: 8px 14px; border-radius: 8px; font-weight: 700; cursor: pointer;
    }
    .tab-btn.active { background: #1e293b; color: #fff; border-color: #1e293b; }
    .empty-state { text-align: center; color: #94a3b8; padding: 32px 16px; }
    .badge-tipo { background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 0.75rem; margin-right: 6px; }
    .muted { color: #64748b; font-size: 0.85rem; }
    .right { text-align: right; }
    .btn-link { font-size: 0.85rem; color: #1d4ed8; text-decoration: underline; }
  `]
})
export class ContabilidadComponent implements OnInit {
  activeTab: 'VENTAS' | 'COMPRAS' = 'VENTAS';
  ventas: VentaResumen[] = [];
  compras: CompraDocumentoDTO[] = [];
  loadingVentas = false;
  loadingCompras = false;

  constructor(
    private api: ApiService,
    private comprasService: ComprasService
  ) { }

  ngOnInit(): void {
    this.cargarVentas();
    this.cargarCompras();
  }

  private cargarVentas() {
    this.loadingVentas = true;
    this.api.get<any[]>('contabilidad/ventas').subscribe({
      next: (list) => {
        this.ventas = (list || []).map(v => ({
          id: v.id,
          tipo: v.tipo,
          numero: v.numero,
          fecha: v.fecha,
          cliente: v.cliente,
          contratoId: v.contratoId,
          total: v.total
        }));
        this.loadingVentas = false;
      },
      error: () => {
        this.ventas = [];
        this.loadingVentas = false;
      }
    });
  }

  private cargarCompras() {
    this.loadingCompras = true;
    this.api.get<CompraDocumentoDTO[]>('contabilidad/compras').subscribe({
      next: (list) => {
        this.compras = list || [];
        this.loadingCompras = false;
      },
      error: () => {
        this.compras = [];
        this.loadingCompras = false;
      }
    });
  }
}

