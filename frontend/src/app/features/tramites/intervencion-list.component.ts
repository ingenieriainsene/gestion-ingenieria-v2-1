import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TramiteService, TramiteListResponse } from '../../services/domain.services';
import { UsuarioService, Usuario } from '../../services/usuario.service';

@Component({
  selector: 'app-intervencion-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3" style="margin-bottom: 25px;">
      <h1>Intervenciones</h1>
    </div>

    <div class="filters-container">
      <div class="filters-bar">
        <div class="tabs">
          <button class="tab-btn" [class.active]="estadoFiltro === 'Pendiente'" (click)="setEstado('Pendiente')">Pendientes</button>
          <button class="tab-btn" [class.active]="estadoFiltro === 'En proceso'" (click)="setEstado('En proceso')">En Proceso</button>
          <button class="tab-btn" [class.active]="estadoFiltro === 'Terminado'" (click)="setEstado('Terminado')">Terminadas</button>
          <button class="tab-btn" [class.active]="estadoFiltro === null" (click)="setEstado(null)">Todas</button>
        </div>

        <div class="search">
          <input
            type="text"
            [(ngModel)]="busqueda"
            (ngModelChange)="aplicarFiltro()"
            placeholder="Buscar por cliente, dirección, tipo, técnico..."
          />
        </div>

        <button class="btn-toggle-filters" (click)="mostrarFiltrosAvanzados = !mostrarFiltrosAvanzados">
          {{ mostrarFiltrosAvanzados ? 'Ocultar Filtros' : 'Filtros Avanzados' }}
        </button>
      </div>

      <div class="advanced-filters" *ngIf="mostrarFiltrosAvanzados">
        <div class="filter-group">
          <label>Técnico</label>
          <select [(ngModel)]="filtroTecnico" (change)="aplicarFiltro()" class="form-select">
            <option [ngValue]="null">-- Todos --</option>
            <option *ngFor="let t of tecnicos" [ngValue]="t.idUsuario">{{ t.nombreUsuario }}</option>
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

    <table class="table-card">
      <thead>
        <tr>
          <th>FECHA</th>
          <th>CONTRATO / CLIENTE</th>
          <th>INTERVENCIÓN</th>
          <th>DETALLE / TAREA</th>
          <th>TÉCNICO</th>
          <th style="text-align:center;">URG</th>
          <th>ESTADO</th>
          <th style="text-align:right;">ACCIONES</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let t of filtrados">
          <td data-label="Fecha">
            <strong>{{ t.fechaSeguimiento | date:'dd/MM/yyyy' }}</strong>
          </td>
          <td data-label="Contrato/Cliente">
            <a [routerLink]="['/contratos', t.idContrato]" class="maps-link" style="font-weight:700; display:block;">
              #{{ t.idContrato }} - {{ t.nombreCliente || 'N/A' }}
            </a>
            <small class="text-muted">{{ t.direccionLocal || '—' }}</small>
          </td>
          <td data-label="Intervención">
            <span class="badge-tipo">{{ t.tipoTramite }}</span>
          </td>
          <td data-label="Detalle">
            {{ t.detalleSeguimiento || '—' }}
          </td>
          <td data-label="Técnico">{{ t.tecnicoAsignado || '—' }}</td>
          <td data-label="Urg." style="text-align:center;">
            <span *ngIf="t.esUrgente" class="urg-badge">URG</span>
          </td>
          <td data-label="Estado">
            <span class="status-badge" 
                  [class.pendiente]="t.estado === 'Pendiente'"
                  [class.proceso]="t.estado === 'En proceso'"
                  [class.terminado]="t.estado === 'Terminado'">
              {{ t.estado || '—' }}
            </span>
          </td>
          <td data-label="Acciones" class="actions-cell" style="text-align:right; white-space: nowrap;">
            <a
              [routerLink]="['/tramite-detalle', t.idTramite]"
              class="action-badge"
              style="background:#3498db;"
              title="Ver detalle"
            >👁️</a>
          </td>
        </tr>
        <tr *ngIf="filtrados.length === 0">
          <td colspan="8" style="text-align:center; padding:40px; color:#64748b;">
            No hay intervenciones para el filtro seleccionado.
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
    }
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
    .status-badge.pendiente { background: #fee2e2; color: #b91c1c; }
    .status-badge.proceso { background: #ffedd5; color: #c2410c; }
    .status-badge.terminado { background: #dcfce7; color: #15803d; }
    
    .badge-tipo {
      background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 0.8rem;
    }
    .text-muted { color: #64748b; font-size: 0.85rem; }

    @media (max-width: 768px) {
      .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .tabs {
        flex-wrap: wrap;
      }

      .advanced-filters {
        grid-template-columns: 1fr;
      }

      .filter-actions {
        margin-left: 0;
      }

      .filter-actions .btn-clear {
        width: 100%;
      }
    }
  `]
})
export class IntervencionListComponent implements OnInit {
  tramites: TramiteListResponse[] = [];
  filtrados: TramiteListResponse[] = [];
  tecnicos: Usuario[] = [];
  estadoFiltro: string | null = null; // Default to ALL to ensure users see data
  busqueda = '';
  mostrarFiltrosAvanzados = false;
  filtroTecnico: number | null = null;
  fechaInicio: string = '';
  fechaFin: string = '';
  soloUrgentes = false;

  constructor(
    private tramiteService: TramiteService,
    private usuarioService: UsuarioService
  ) { }

  ngOnInit(): void {
    this.loadMaestros();
    this.cargar();
  }

  loadMaestros() {
    this.usuarioService.getTecnicos().subscribe(list => this.tecnicos = list || []);
  }

  setEstado(estado: string | null): void {
    if (this.estadoFiltro === estado) return;
    this.estadoFiltro = estado;
    this.aplicarFiltro();
  }

  cargar(): void {
    this.tramiteService.getList().subscribe({
      next: (list) => {
        this.tramites = list || [];
        this.aplicarFiltro();
      },
      error: () => {
        this.tramites = [];
        this.aplicarFiltro();
      },
    });
  }

  aplicarFiltro(): void {
    let temp = [...this.tramites];

    // Filter by State
    if (this.estadoFiltro) {
      temp = temp.filter(t => t.estado === this.estadoFiltro);
    }

    // Filter by Date Range
    if (this.fechaInicio) {
      const inicio = new Date(this.fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      temp = temp.filter(t => {
        if (!t.fechaSeguimiento) return false;
        const fecha = new Date(t.fechaSeguimiento);
        return fecha >= inicio;
      });
    }

    if (this.fechaFin) {
      const fin = new Date(this.fechaFin);
      fin.setHours(23, 59, 59, 999);
      temp = temp.filter(t => {
        if (!t.fechaSeguimiento) return false;
        const fecha = new Date(t.fechaSeguimiento);
        return fecha <= fin;
      });
    }

    if (this.filtroTecnico) {
      const tecnicoNombre = this.tecnicos.find(t => t.idUsuario === this.filtroTecnico)?.nombreUsuario?.toLowerCase() ?? '';
      if (tecnicoNombre) {
        temp = temp.filter(t => (t.tecnicoAsignado || '').toLowerCase() === tecnicoNombre);
      }
    }

    if (this.soloUrgentes) {
      temp = temp.filter(t => !!t.esUrgente);
    }

    // Filter by Search Term
    const term = this.busqueda.trim().toLowerCase();
    if (term) {
      temp = temp.filter((t) => {
        const cliente = t.nombreCliente?.toLowerCase() ?? '';
        const direccion = t.direccionLocal?.toLowerCase() ?? '';
        const tipo = t.tipoTramite?.toLowerCase() ?? '';
        const tecnico = t.tecnicoAsignado?.toLowerCase() ?? '';
        const detalle = t.detalleSeguimiento?.toLowerCase() ?? '';
        return cliente.includes(term) || direccion.includes(term) || tipo.includes(term) || tecnico.includes(term) || detalle.includes(term);
      });
    }

    this.filtrados = temp;
  }

  limpiarFiltros() {
    this.busqueda = '';
    this.filtroTecnico = null;
    this.fechaInicio = '';
    this.fechaFin = '';
    this.soloUrgentes = false;
    this.aplicarFiltro();
  }
}
