import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SeguimientoService, Seguimiento } from '../../services/domain.services';
import { UsuarioService, Usuario } from '../../services/usuario.service';
import { ProveedorService } from '../../services/proveedor.service';

@Component({
  selector: 'app-seguimiento-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3" style="margin-bottom: 25px;">
      <h1>Seguimientos</h1>
    </div>

    <div class="filters-container">
      <!-- Filtros Superiores (Tabs + Buscador) -->
      <div class="filters-bar">
        <div class="tabs">
          <button class="tab-btn" [class.active]="estadoFiltro === 'Pendiente'" (click)="setEstado('Pendiente')">Pendientes</button>
          <button class="tab-btn" [class.active]="estadoFiltro === 'Terminado'" (click)="setEstado('Terminado')">Terminados</button>
          <button class="tab-btn" [class.active]="estadoFiltro === 'Anulado'" (click)="setEstado('Anulado')">Anulados</button>
          <button class="tab-btn" [class.active]="estadoFiltro === null" (click)="setEstado(null)">Todos</button>
        </div>
        <div class="search">
          <input
            type="text"
            [(ngModel)]="busqueda"
            (ngModelChange)="aplicarFiltro()"
            placeholder="Buscar por comentario, técnico, proveedor o trámite..."
          />
        </div>
        <button class="btn-toggle-filters" (click)="mostrarFiltrosAvanzados = !mostrarFiltrosAvanzados">
          {{ mostrarFiltrosAvanzados ? 'Ocultar Filtros' : 'Filtros Avanzados' }}
        </button>
      </div>

      <!-- Filtros Avanzados -->
      <div class="advanced-filters" *ngIf="mostrarFiltrosAvanzados">
        <div class="filter-group">
          <label>Técnico</label>
          <select [(ngModel)]="filtroTecnico" (change)="aplicarFiltro()" class="form-select">
            <option [ngValue]="null">-- Todos --</option>
            <option *ngFor="let t of tecnicos" [ngValue]="t.idUsuario">{{ t.nombreUsuario }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Proveedor</label>
          <select [(ngModel)]="filtroProveedor" (change)="aplicarFiltro()" class="form-select">
            <option [ngValue]="null">-- Todos --</option>
            <option *ngFor="let p of proveedores" [ngValue]="p.idProveedor ?? p.id">{{ p.nombreComercial }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Desde</label>
          <input type="date" [(ngModel)]="fechaInicio" (change)="aplicarFiltro()" class="form-input">
        </div>
        <div class="filter-group">
          <label>Hasta</label>
          <input type="date" [(ngModel)]="fechaFin" (change)="aplicarFiltro()" class="form-input">
        </div>
        <div class="filter-group checkbox-group">
          <label>
            <input type="checkbox" [(ngModel)]="soloUrgentes" (change)="aplicarFiltro()">
            Solo Urgentes
          </label>
        </div>
        <div class="filter-actions">
           <button class="btn-clear" (click)="limpiarFiltros()">Limpiar Filtros</button>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>FECHA REGISTRO</th>
          <th>TRÁMITE</th>
          <th>COMENTARIO</th>
          <th class="col-tecnico">TÉCNICO</th>
          <th>PROVEEDOR</th>
          <th>PRÓX. SEGUIMIENTO</th>
          <th style="text-align:center;">URG</th>
          <th>ESTADO</th>
          <th style="text-align:right;">ACCIONES</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let s of filtrados">
          <td>
            <strong>{{ s.fechaRegistro | date:'dd/MM/yyyy' }}</strong><br />
            <small>{{ s.fechaRegistro | date:'HH:mm' }}</small>
          </td>
          <td>
            <a *ngIf="s.idTramite" [routerLink]="['/tramite-detalle', s.idTramite]" class="maps-link" style="font-weight:700;">
              #{{ s.idTramite }}
            </a>
            <span *ngIf="!s.idTramite">—</span>
          </td>
          <td>{{ s.comentario || '—' }}</td>
          <td class="col-tecnico">{{ s.nombreAsignado || '—' }}</td>
          <td>{{ s.nombreProveedor || '—' }}</td>
          <td>{{ s.fechaSeguimiento | date:'dd/MM/yyyy' }}</td>
          <td style="text-align:center;">
            <span *ngIf="s.esUrgente" class="urg-badge">URG</span>
          </td>
          <td>
            <span class="status-badge" [ngClass]="s.estado?.toLowerCase()">{{ s.estado || '—' }}</span>
          </td>
          <td style="text-align:right; white-space: nowrap;">
            <a
              *ngIf="s.idTramite"
              [routerLink]="['/tramite-detalle', s.idTramite]"
              class="action-badge"
              style="background:#3498db;"
              title="Ver trámite"
            >👁️</a>
          </td>
        </tr>
        <tr *ngIf="filtrados.length === 0">
          <td colspan="9" style="text-align:center; padding:40px; color:#64748b;">
            No hay seguimientos para el filtro seleccionado.
          </td>
        </tr>
      </tbody>
    </table>
  `,
  styles: [`
    .filters-container {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 25px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .filters-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .tabs { display: flex; gap: 8px; }
    .tab-btn {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #334155;
      padding: 8px 14px;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn:hover { background: #e2e8f0; }
    .tab-btn.active {
      background: #1e293b;
      color: #fff;
      border-color: #1e293b;
    }
    .search input {
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      min-width: 320px;
      font-family: inherit;
    }
    .btn-toggle-filters {
      background: none;
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      color: #475569;
    }
    .btn-toggle-filters:hover { background: #f1f5f9; color: #1e293b; }

    /* Advanced filters */
    .advanced-filters {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: flex-end;
      animation: slideDown 0.2s ease-out;
    }
    @keyframes slideDown { from { opacity:0; transform:translateY(-5px); } to { opacity:1; transform:translateY(0); } }

    .filter-group { display: flex; flex-direction: column; gap: 4px; }
    .filter-group label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .form-select, .form-input {
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      min-width: 150px;
      font-size: 0.9rem;
    }
    .checkbox-group { flex-direction: row; align-items: center; padding-bottom: 8px; }
    .checkbox-group label { font-size: 0.9rem; text-transform: none; color: #1e293b; display: flex; align-items: center; gap: 6px; cursor: pointer; }
    
    .btn-clear {
      background: #ef4444;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .btn-clear:hover { background: #dc2626; }
    .filter-actions { margin-left: auto; }

    .col-tecnico { width: 140px; }

    .urg-badge {
      display: inline-block;
      background: #dc2626;
      color: #fff;
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 800;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      background: #f1f5f9;
      color: #1e293b;
    }
    .status-badge.terminado {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .status-badge.anulado {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }
    .status-badge.pendiente {
      background: #fff7ed;
      color: #c2410c;
      border: 1px solid #fed7aa;
    }
  `],
})
export class SeguimientoListComponent implements OnInit {
  seguimientos: Seguimiento[] = [];
  filtrados: Seguimiento[] = [];

  // Maestros
  tecnicos: Usuario[] = [];
  proveedores: any[] = [];

  // Filtros
  estadoFiltro: string | null = 'Pendiente';
  busqueda = '';
  mostrarFiltrosAvanzados = false;

  filtroTecnico: number | null = null;
  filtroProveedor: number | null = null;
  fechaInicio: string = '';
  fechaFin: string = '';
  soloUrgentes = false;

  constructor(
    private seguimientoService: SeguimientoService,
    private usuarioService: UsuarioService,
    private proveedorService: ProveedorService
  ) { }

  ngOnInit(): void {
    this.loadMaestros();
    this.cargar();
  }

  loadMaestros() {
    this.usuarioService.getTecnicos().subscribe(list => this.tecnicos = list || []);
    this.proveedorService.getAll().subscribe(list => this.proveedores = list || []);
  }

  setEstado(estado: string | null): void {
    if (this.estadoFiltro === estado) return;
    this.estadoFiltro = estado;
    this.cargar();
  }

  cargar(): void {
    const estado = this.estadoFiltro ?? undefined;
    this.seguimientoService.getAll(estado).subscribe({
      next: (list) => {
        this.seguimientos = list || [];
        this.aplicarFiltro();
      },
      error: () => {
        this.seguimientos = [];
        this.aplicarFiltro();
      },
    });
  }

  aplicarFiltro(): void {
    let res = [...this.seguimientos];

    // Texto
    const term = this.busqueda.trim().toLowerCase();
    if (term) {
      res = res.filter((s) => {
        const comentario = s.comentario?.toLowerCase() ?? '';
        const tecnico = s.nombreAsignado?.toLowerCase() ?? '';
        const proveedor = s.nombreProveedor?.toLowerCase() ?? '';
        const tramite = s.idTramite ? String(s.idTramite) : '';
        return comentario.includes(term) || tecnico.includes(term) || proveedor.includes(term) || tramite.includes(term);
      });
    }

    // Técnico
    if (this.filtroTecnico) {
      res = res.filter(s => s.idUsuarioAsignado === this.filtroTecnico);
    }

    // Proveedor
    if (this.filtroProveedor != null) {
      res = res.filter(s => s.idProveedor == this.filtroProveedor);
    }

    // Urgencia
    if (this.soloUrgentes) {
      res = res.filter(s => s.esUrgente);
    }

    // Fechas (Fecha Registro)
    if (this.fechaInicio) {
      const f1 = new Date(this.fechaInicio).setHours(0, 0, 0, 0);
      res = res.filter(s => s.fechaRegistro && new Date(s.fechaRegistro).setHours(0, 0, 0, 0) >= f1);
    }

    if (this.fechaFin) {
      const f2 = new Date(this.fechaFin).setHours(23, 59, 59, 999);
      res = res.filter(s => s.fechaRegistro && new Date(s.fechaRegistro).setHours(0, 0, 0, 0) <= f2);
    }

    this.filtrados = res;
  }

  limpiarFiltros() {
    this.busqueda = '';
    this.filtroTecnico = null;
    this.filtroProveedor = null;
    this.fechaInicio = '';
    this.fechaFin = '';
    this.soloUrgentes = false;
    this.aplicarFiltro();
  }
}
