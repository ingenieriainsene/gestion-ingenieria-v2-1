import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TramiteService } from '../../services/domain.services';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-ventas-pendientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3" style="margin-bottom: 25px;">
      <h1>Ventas Pendientes</h1>
    </div>

    <div class="filters-container">
      <div class="filters-bar">
        <div class="search">
          <input
            type="text"
            [(ngModel)]="busqueda"
            (ngModelChange)="aplicarFiltro()"
            placeholder="Buscar por cliente, dirección, tipo o contrato..."
          />
        </div>

        <button class="btn-toggle-filters" (click)="mostrarFiltrosAvanzados = !mostrarFiltrosAvanzados">
          {{ mostrarFiltrosAvanzados ? 'Ocultar Filtros' : 'Filtros Avanzados' }}
        </button>
      </div>
    </div>

    <table class="table-card">
      <thead>
        <tr>
          <th>CONTRATO</th>
          <th>INTERVENCIÓN</th>
          <th>DETALLE / TAREA</th>
          <th>FECHA</th>
          <th style="text-align:right;">ACCIÓN</th>
        </tr>
        <tr *ngIf="mostrarFiltrosAvanzados" class="filter-row">
          <th>
            <input
              type="number"
              [(ngModel)]="filtroContrato"
              (ngModelChange)="aplicarFiltro()"
              class="header-input"
              placeholder="#"
            />
          </th>
          <th>
            <input
              type="text"
              [(ngModel)]="filtroTipo"
              (ngModelChange)="aplicarFiltro()"
              class="header-input"
              placeholder="Tipo"
            />
          </th>
          <th>
            <input
              type="text"
              [(ngModel)]="filtroDetalle"
              (ngModelChange)="aplicarFiltro()"
              class="header-input"
              placeholder="Detalle"
            />
          </th>
          <th>
            <div class="header-date-range">
              <input
                type="date"
                [(ngModel)]="fechaInicio"
                (change)="aplicarFiltro()"
                class="header-input"
              />
              <input
                type="date"
                [(ngModel)]="fechaFin"
                (change)="aplicarFiltro()"
                class="header-input"
              />
            </div>
          </th>
          <th style="text-align:right;">
            <button class="btn-clear small" type="button" (click)="limpiarFiltros()">Limpiar</button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          *ngFor="let t of filtrados"
          class="row-card"
          (click)="irADetalle(t)"
          style="cursor:pointer;"
        >
          <td data-label="Contrato">
            <span class="badge-contrato">#{{ t.idContrato }}</span>
          </td>
          <td data-label="Intervención">
            <span class="badge-tipo">{{ t.tipoTramite }}</span>
          </td>
          <td data-label="Detalle">
            {{ t.detalleSeguimiento || '—' }}
          </td>
          <td data-label="Fecha">
            <strong>{{ (t.fechaSeguimiento || t.fechaCreacion) | date:'dd/MM/yyyy' }}</strong>
          </td>
          <td data-label="Acción" style="text-align:right;">
            <button
              type="button"
              class="btn-generar"
              (click)="generar(t, $event)"
            >
              Generar
            </button>
          </td>
        </tr>
        <tr *ngIf="filtrados.length === 0">
          <td colspan="8" style="text-align:center; padding:40px; color:#64748b;">
            No hay ventas pendientes con los filtros aplicados.
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
    .filter-row th {
      padding: 6px 8px;
      background-color: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .header-input {
      width: 100%;
      padding: 4px 6px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      font-size: 0.8rem;
      font-family: inherit;
    }
    .header-date-range {
      display: flex;
      gap: 4px;
    }
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
    .btn-clear.small {
      padding: 4px 8px;
      font-size: 0.75rem;
    }
    .btn-clear:hover { background: #dc2626; }
    .badge-contrato {
      display: inline-block;
      background: #eef2ff;
      color: #1d4ed8;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      border: 1px solid #e2e8f0;
    }
    .badge-tipo {
      background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 0.8rem;
    }
    .text-main { font-weight: 600; color: #1e293b; }
    .btn-generar {
      background: #f1c40f;
      color: #1e293b;
      border: none;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-generar:hover {
      background: #d97706;
      color: #fff;
    }
    @media (max-width: 768px) {
      .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }
      .search input {
        min-width: 100%;
        width: 100%;
      }
      .header-date-range {
        flex-direction: column;
      }
    }
  `]
})
export class VentasPendientesComponent implements OnInit {
  tramites: any[] = [];
  filtrados: any[] = [];

  busqueda = '';
  mostrarFiltrosAvanzados = false;
  filtroContrato: number | null = null;
  fechaInicio: string = '';
  fechaFin: string = '';
  filtroTipo: string = '';
  filtroDetalle: string = '';
  constructor(
    private tramiteService: TramiteService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.tramiteService.getVentasPendientes().subscribe({
      next: (list) => {
        // Defensa extra: solo trámites en estado Pendiente
        this.tramites = (list || []).filter(t => t.estado === 'Pendiente');
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

    if (this.filtroContrato) {
      temp = temp.filter(t => t.idContrato === this.filtroContrato);
    }

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

    const term = this.busqueda.trim().toLowerCase();
    if (term) {
      temp = temp.filter((t) => {
        const cliente = (t.nombreCliente || '').toLowerCase?.() ?? '';
        const direccion = (t.direccionLocal || '').toLowerCase?.() ?? '';
        const tipo = t.tipoTramite?.toLowerCase() ?? '';
        const detalle = t.detalleSeguimiento?.toLowerCase() ?? '';
        const contrato = t.idContrato ? String(t.idContrato) : '';
        return (
          cliente.includes(term) ||
          direccion.includes(term) ||
          tipo.includes(term) ||
          detalle.includes(term) ||
          contrato.includes(term)
        );
      });
    }

    const tipoTerm = this.filtroTipo.trim().toLowerCase();
    if (tipoTerm) {
      temp = temp.filter(t => (t.tipoTramite || '').toLowerCase().includes(tipoTerm));
    }

    const detalleTerm = this.filtroDetalle.trim().toLowerCase();
    if (detalleTerm) {
      temp = temp.filter(t => (t.detalleSeguimiento || '').toLowerCase().includes(detalleTerm));
    }

    this.filtrados = temp;
  }

  limpiarFiltros() {
    this.busqueda = '';
    this.filtroContrato = null;
    this.fechaInicio = '';
    this.fechaFin = '';
    this.filtroTipo = '';
    this.filtroDetalle = '';
    this.aplicarFiltro();
  }

  irADetalle(t: any): void {
    if (!t.idTramite) {
      return;
    }
    this.router.navigate(['/tramite-detalle', t.idTramite]);
  }

  generar(t: any, event: Event): void {
    event.stopPropagation();
    if (!t.idTramite) {
      return;
    }

    const contratoLabel = t.idContrato ? `#${t.idContrato}` : '—';
    const fechaLabel = (t.fechaSeguimiento || t.fechaCreacion) ? new Date(t.fechaSeguimiento || t.fechaCreacion).toLocaleDateString() : '—';

    Swal.fire({
      title: 'Generar intervención',
      html: `
        <div style="text-align:left; font-size:0.9rem;">
          <p><b>Contrato:</b> ${contratoLabel}</p>
          <p><b>Intervención:</b> ${t.tipoTramite || '—'}</p>
          <p><b>Detalle / tarea:</b> ${t.detalleSeguimiento || '—'}</p>
          <p><b>Fecha venta:</b> ${fechaLabel}</p>
        </div>
        <p style="margin-top:10px; font-size:0.85rem; color:#64748b;">
          Se creará la intervención en el contrato indicado y dejará de aparecer en Ventas Pendientes.
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar y generar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1e293b'
    }).then(res => {
      if (!res.isConfirmed) {
        return;
      }

      this.tramiteService.generar(t.idTramite).subscribe({
        next: () => {
          Swal.fire('Generado', 'La intervención se ha generado correctamente.', 'success');
          this.cargar();
        },
        error: (err) => {
          Swal.fire('Error', err?.error || 'No se pudo generar la intervención.', 'error');
          this.cargar();
        }
      });
    });
  }
}

