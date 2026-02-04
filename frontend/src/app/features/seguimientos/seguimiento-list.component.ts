import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SeguimientoService, Seguimiento } from '../../services/domain.services';

@Component({
  selector: 'app-seguimiento-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3" style="margin-bottom: 25px;">
      <h1>Seguimientos</h1>
    </div>

    <div class="filters-bar">
      <div class="tabs">
        <button class="tab-btn" [class.active]="estadoFiltro === 'Pendiente'" (click)="setEstado('Pendiente')">Pendientes</button>
        <button class="tab-btn" [class.active]="estadoFiltro === 'Terminado'" (click)="setEstado('Terminado')">Terminados</button>
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
    </div>

    <table>
      <thead>
        <tr>
          <th>FECHA REGISTRO</th>
          <th>TRÁMITE</th>
          <th>COMENTARIO</th>
          <th>TÉCNICO</th>
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
          <td>{{ s.nombreAsignado || '—' }}</td>
          <td>{{ s.nombreProveedor || '—' }}</td>
          <td>{{ s.fechaSeguimiento | date:'dd/MM/yyyy' }}</td>
          <td style="text-align:center;">
            <span *ngIf="s.esUrgente" class="urg-badge">URG</span>
          </td>
          <td>
            <span class="status-badge" [class.ok]="s.estado === 'Terminado'">{{ s.estado || '—' }}</span>
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
    .filters-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 18px;
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
    .status-badge.ok {
      background: #dcfce7;
      color: #15803d;
    }
  `],
})
export class SeguimientoListComponent implements OnInit {
  seguimientos: Seguimiento[] = [];
  filtrados: Seguimiento[] = [];
  estadoFiltro: string | null = 'Pendiente';
  busqueda = '';

  constructor(private seguimientoService: SeguimientoService) {}

  ngOnInit(): void {
    this.cargar();
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
    const term = this.busqueda.trim().toLowerCase();
    if (!term) {
      this.filtrados = [...this.seguimientos];
      return;
    }
    this.filtrados = this.seguimientos.filter((s) => {
      const comentario = s.comentario?.toLowerCase() ?? '';
      const tecnico = s.nombreAsignado?.toLowerCase() ?? '';
      const proveedor = s.nombreProveedor?.toLowerCase() ?? '';
      const tramite = s.idTramite ? String(s.idTramite) : '';
      return comentario.includes(term) || tecnico.includes(term) || proveedor.includes(term) || tramite.includes(term);
    });
  }
}
