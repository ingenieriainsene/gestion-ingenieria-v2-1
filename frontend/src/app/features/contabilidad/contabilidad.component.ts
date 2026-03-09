import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule, RouterLink],
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
        <!-- Filtros Ventas -->
        <div class="filters-container">
          <div class="filters-bar">
            <input
              type="text"
              class="filter-input"
              [(ngModel)]="filtroVentasTerm"
              (ngModelChange)="aplicarFiltrosVentas()"
              placeholder="Buscar por cliente, nº documento o contrato..."
            />
            <button class="btn-toggle-filters" (click)="mostrarFiltrosVentas = !mostrarFiltrosVentas">
              {{ mostrarFiltrosVentas ? 'Ocultar filtros' : 'Filtros avanzados' }}
            </button>
          </div>
          <div class="filters-row" *ngIf="mostrarFiltrosVentas">
            <div class="filter-group">
              <label>Desde</label>
              <input type="date" [(ngModel)]="ventasDesde" (change)="aplicarFiltrosVentas()" />
            </div>
            <div class="filter-group">
              <label>Hasta</label>
              <input type="date" [(ngModel)]="ventasHasta" (change)="aplicarFiltrosVentas()" />
            </div>
            <div class="filter-group">
              <label>Tipo</label>
              <select [(ngModel)]="ventasTipo" (change)="aplicarFiltrosVentas()">
                <option value="">Todos</option>
                <option value="ALBARAN">Albarán</option>
                <option value="FACTURA">Factura</option>
              </select>
            </div>
            <div class="filter-actions">
              <button class="btn-clear" type="button" (click)="limpiarFiltrosVentas()">Limpiar</button>
            </div>
          </div>
        </div>

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
              <tr *ngFor="let v of ventasFiltradas">
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
        <!-- Filtros Compras -->
        <div class="filters-container">
          <div class="filters-bar">
            <input
              type="text"
              class="filter-input"
              [(ngModel)]="filtroComprasTerm"
              (ngModelChange)="aplicarFiltrosCompras()"
              placeholder="Buscar por proveedor, nº documento o tipo..."
            />
            <button class="btn-toggle-filters" (click)="mostrarFiltrosCompras = !mostrarFiltrosCompras">
              {{ mostrarFiltrosCompras ? 'Ocultar filtros' : 'Filtros avanzados' }}
            </button>
          </div>
          <div class="filters-row" *ngIf="mostrarFiltrosCompras">
            <div class="filter-group">
              <label>Desde</label>
              <input type="date" [(ngModel)]="comprasDesde" (change)="aplicarFiltrosCompras()" />
            </div>
            <div class="filter-group">
              <label>Hasta</label>
              <input type="date" [(ngModel)]="comprasHasta" (change)="aplicarFiltrosCompras()" />
            </div>
            <div class="filter-group">
              <label>Tipo</label>
              <select [(ngModel)]="comprasTipo" (change)="aplicarFiltrosCompras()">
                <option value="">Todos</option>
                <option value="ALBARAN">Albarán</option>
                <option value="FACTURA">Factura</option>
              </select>
            </div>
            <div class="filter-actions">
              <button class="btn-clear" type="button" (click)="limpiarFiltrosCompras()">Limpiar</button>
            </div>
          </div>
        </div>

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
              <tr *ngFor="let c of comprasFiltradas">
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

    .filters-container {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 16px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03);
    }
    .filters-bar {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
    }
    .filter-input {
      flex: 1;
      min-width: 260px;
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      font-size: 0.9rem;
    }
    .btn-toggle-filters {
      background: none;
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
      color: #475569;
    }
    .filters-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 10px;
      align-items: flex-end;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .filter-group label {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
    }
    .filter-group input,
    .filter-group select {
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      font-size: 0.85rem;
    }
    .filter-actions {
      margin-left: auto;
    }
    .btn-clear {
      background: #ef4444;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }
  `]
})
export class ContabilidadComponent implements OnInit {
  activeTab: 'VENTAS' | 'COMPRAS' = 'VENTAS';
  ventas: VentaResumen[] = [];
  ventasFiltradas: VentaResumen[] = [];
  compras: CompraDocumentoDTO[] = [];
  comprasFiltradas: CompraDocumentoDTO[] = [];
  loadingVentas = false;
  loadingCompras = false;

  // Filtros ventas
  filtroVentasTerm = '';
  mostrarFiltrosVentas = false;
  ventasDesde = '';
  ventasHasta = '';
  ventasTipo: '' | 'ALBARAN' | 'FACTURA' = '';

  // Filtros compras
  filtroComprasTerm = '';
  mostrarFiltrosCompras = false;
  comprasDesde = '';
  comprasHasta = '';
  comprasTipo: '' | 'ALBARAN' | 'FACTURA' = '';

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
        this.aplicarFiltrosVentas();
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
        this.aplicarFiltrosCompras();
        this.loadingCompras = false;
      },
      error: () => {
        this.compras = [];
        this.loadingCompras = false;
      }
    });
  }

  aplicarFiltrosVentas() {
    let tmp = [...this.ventas];

    if (this.ventasDesde) {
      const d = new Date(this.ventasDesde);
      d.setHours(0, 0, 0, 0);
      tmp = tmp.filter(v => {
        const fv = new Date(v.fecha);
        fv.setHours(0, 0, 0, 0);
        return fv >= d;
      });
    }
    if (this.ventasHasta) {
      const d = new Date(this.ventasHasta);
      d.setHours(23, 59, 59, 999);
      tmp = tmp.filter(v => {
        const fv = new Date(v.fecha);
        fv.setHours(0, 0, 0, 0);
        return fv <= d;
      });
    }
    if (this.ventasTipo) {
      tmp = tmp.filter(v => v.tipo === this.ventasTipo);
    }

    const term = (this.filtroVentasTerm || '').toLowerCase().trim();
    if (term) {
      tmp = tmp.filter(v => {
        const cliente = (v.cliente || '').toLowerCase();
        const numero = (v.numero || '').toLowerCase();
        const contrato = v.contratoId ? String(v.contratoId) : '';
        return cliente.includes(term) || numero.includes(term) || contrato.includes(term);
      });
    }

    this.ventasFiltradas = tmp;
  }

  limpiarFiltrosVentas() {
    this.filtroVentasTerm = '';
    this.ventasDesde = '';
    this.ventasHasta = '';
    this.ventasTipo = '';
    this.aplicarFiltrosVentas();
  }

  aplicarFiltrosCompras() {
    let tmp = [...this.compras];

    if (this.comprasDesde) {
      const d = new Date(this.comprasDesde);
      d.setHours(0, 0, 0, 0);
      tmp = tmp.filter(c => {
        const fc = new Date(c.fecha);
        fc.setHours(0, 0, 0, 0);
        return fc >= d;
      });
    }
    if (this.comprasHasta) {
      const d = new Date(this.comprasHasta);
      d.setHours(23, 59, 59, 999);
      tmp = tmp.filter(c => {
        const fc = new Date(c.fecha);
        fc.setHours(0, 0, 0, 0);
        return fc <= d;
      });
    }
    if (this.comprasTipo) {
      tmp = tmp.filter(c => c.tipo === this.comprasTipo);
    }

    const term = (this.filtroComprasTerm || '').toLowerCase().trim();
    if (term) {
      tmp = tmp.filter(c => {
        const prov = (c.proveedorNombre || '').toLowerCase();
        const num = (c.numeroDocumento || '').toLowerCase();
        const tipo = (c.tipo || '').toLowerCase();
        return prov.includes(term) || num.includes(term) || tipo.includes(term);
      });
    }

    this.comprasFiltradas = tmp;
  }

  limpiarFiltrosCompras() {
    this.filtroComprasTerm = '';
    this.comprasDesde = '';
    this.comprasHasta = '';
    this.comprasTipo = '';
    this.aplicarFiltrosCompras();
  }
}

