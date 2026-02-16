import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TramiteService, TramiteListResponse } from '../../services/domain.services';

@Component({
  selector: 'app-intervencion-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3" style="margin-bottom: 25px;">
      <h1>Intervenciones</h1>
    </div>

    <div class="filters-bar">
      <div class="tabs">
        <button class="tab-btn" [class.active]="estadoFiltro === 'Pendiente'" (click)="setEstado('Pendiente')">Pendientes</button>
        <button class="tab-btn" [class.active]="estadoFiltro === 'En proceso'" (click)="setEstado('En proceso')">En Proceso</button>
        <button class="tab-btn" [class.active]="estadoFiltro === 'Terminado'" (click)="setEstado('Terminado')">Terminadas</button>
        <button class="tab-btn" [class.active]="estadoFiltro === null" (click)="setEstado(null)">Todas</button>
      </div>
      
      <div class="filters-secondary">
          <div class="date-filter">
            <label>Desde:</label>
            <input type="date" [(ngModel)]="fechaInicio" (ngModelChange)="aplicarFiltro()">
          </div>
          <div class="date-filter">
            <label>Hasta:</label>
            <input type="date" [(ngModel)]="fechaFin" (ngModelChange)="aplicarFiltro()">
          </div>
          <div class="search">
            <input
              type="text"
              [(ngModel)]="busqueda"
              (ngModelChange)="aplicarFiltro()"
              placeholder="Buscar por cliente, dirección, tipo, técnico..."
            />
          </div>
      </div>
    </div>

    <table>
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
          <td>
            <strong>{{ t.fechaSeguimiento | date:'dd/MM/yyyy' }}</strong>
          </td>
          <td>
            <a [routerLink]="['/contratos', t.idContrato]" class="maps-link" style="font-weight:700; display:block;">
              #{{ t.idContrato }} - {{ t.nombreCliente || 'N/A' }}
            </a>
            <small class="text-muted">{{ t.direccionLocal || '—' }}</small>
          </td>
          <td>
            <span class="badge-tipo">{{ t.tipoTramite }}</span>
          </td>
          <td>
            {{ t.detalleSeguimiento || '—' }}
          </td>
          <td>{{ t.tecnicoAsignado || '—' }}</td>
          <td style="text-align:center;">
            <span *ngIf="t.esUrgente" class="urg-badge">URG</span>
          </td>
          <td>
            <span class="status-badge" 
                  [class.pendiente]="t.estado === 'Pendiente'"
                  [class.proceso]="t.estado === 'En proceso'"
                  [class.terminado]="t.estado === 'Terminado'">
              {{ t.estado || '—' }}
            </span>
          </td>
          <td style="text-align:right; white-space: nowrap;">
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
    .filters-bar {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 18px;
    }
    .filters-secondary {
        display: flex;
        gap: 16px;
        align-items: center;
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
    .date-filter {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #475569;
    }
    .date-filter input {
        padding: 8px 10px;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
        font-family: inherit;
    }
    .search input {
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      min-width: 320px;
      font-family: inherit;
    }
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
  `]
})
export class IntervencionListComponent implements OnInit {
  tramites: TramiteListResponse[] = [];
  filtrados: TramiteListResponse[] = [];
  estadoFiltro: string | null = null; // Default to ALL to ensure users see data
  busqueda = '';
  fechaInicio: string = '';
  fechaFin: string = '';

  constructor(private tramiteService: TramiteService) { }

  ngOnInit(): void {
    this.cargar();
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
}
