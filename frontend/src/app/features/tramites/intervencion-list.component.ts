import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TramiteService, TramiteListResponse } from '../../services/domain.services';
import { UsuarioService, Usuario } from '../../services/usuario.service';
import { ApiService } from '../../services/api.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-intervencion-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="header-section">
      <h1>Intervenciones <span class="badge-contador" *ngIf="filtrados">{{ filtrados.length }} registros</span></h1>
      <button type="button" class="btn-export" (click)="exportarPDF()">📄 Exportar PDF</button>
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
    </div>

    <table class="table-card">
      <thead>
        <tr>
          <th>FECHA</th>
          <th>CONTRATO / CLIENTE</th>
          <th>INTERVENCIÓN</th>
          <th>DETALLE / TAREA</th>
          <th>TÉCNICO</th>
          <th>FACTURADA</th>
          <th style="text-align:center;">URG</th>
          <th>ESTADO</th>
          <th style="text-align:right;">ACCIONES</th>
        </tr>
        <tr *ngIf="mostrarFiltrosAvanzados" class="filter-row">
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
          <th>
            <input
              type="text"
              [(ngModel)]="filtroContratoCliente"
              (ngModelChange)="aplicarFiltro()"
              class="header-input"
              placeholder="Contrato / cliente"
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
            <select
              [(ngModel)]="filtroTecnico"
              (change)="aplicarFiltro()"
              class="header-input"
            >
              <option [ngValue]="null">Todos</option>
              <option *ngFor="let t of tecnicos" [ngValue]="t.idUsuario">
                {{ t.nombreUsuario }}
              </option>
            </select>
          </th>
          <th>
            <select
              [(ngModel)]="filtroFacturada"
              (change)="aplicarFiltro()"
              class="header-input"
            >
              <option [ngValue]="null">Todas</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </th>
          <th style="text-align:center;">
            <label class="urg-filter-label">
              <input
                type="checkbox"
                [(ngModel)]="soloUrgentes"
                (change)="aplicarFiltro()"
              />
              URG
            </label>
          </th>
          <th>
            <select
              [(ngModel)]="filtroEstado"
              (change)="aplicarFiltro()"
              class="header-input"
            >
              <option [ngValue]="null">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En proceso">En proceso</option>
              <option value="Terminado">Terminado</option>
            </select>
          </th>
          <th style="text-align:right;">
            <button class="btn-clear small" type="button" (click)="limpiarFiltros()">
              Limpiar
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let t of filtrados" class="row-card" (click)="verTramite(t)" style="cursor:pointer;">
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
            {{ t.descripcion || '—' }}
          </td>
          <td data-label="Técnico">{{ t.tecnicoAsignado || '—' }}</td>
          <td data-label="Facturada">
            <span class="status-badge" [class.terminado]="t.facturado" [class.pendiente]="!t.facturado">
              {{ t.facturado ? 'Sí' : 'No' }}
            </span>
          </td>
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
        </tr>
        <tr *ngIf="filtrados.length === 0">
          <td colspan="9" style="text-align:center; padding:40px; color:#64748b;">
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
      background-color: #ffffff;
    }
    .header-date-range {
      display: flex;
      gap: 4px;
    }
    .urg-filter-label {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: #334155;
      cursor: pointer;
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

    .btn-export {
      background: #f8fafc;
      color: #1e293b;
      padding: 0.75rem 1.25rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn-export:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }
    
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

      .header-date-range {
        flex-direction: column;
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
  filtroContratoCliente: string = '';
  filtroTipo: string = '';
  filtroDetalle: string = '';
  filtroEstado: string | null = null;
  filtroFacturada: string | null = null;

  constructor(
    private tramiteService: TramiteService,
    private usuarioService: UsuarioService,
    private api: ApiService,
    private router: Router
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

    // Filter by State (tabs tienen prioridad; si no hay tab seleccionada, usa filtroEstado de cabecera)
    const estadoActivo = this.estadoFiltro || this.filtroEstado;
    if (estadoActivo) {
      temp = temp.filter(t => t.estado === estadoActivo);
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

    if (this.filtroFacturada === 'SI') {
      temp = temp.filter(t => !!t.facturado);
    } else if (this.filtroFacturada === 'NO') {
      temp = temp.filter(t => !t.facturado);
    }

    // Filtros específicos por columna
    const contratoClienteTerm = this.filtroContratoCliente.trim().toLowerCase();
    if (contratoClienteTerm) {
      temp = temp.filter(t => {
        const contrato = t.idContrato ? String(t.idContrato) : '';
        const cliente = t.nombreCliente?.toLowerCase() ?? '';
        return contrato.includes(contratoClienteTerm) || cliente.includes(contratoClienteTerm);
      });
    }

    const tipoTerm = this.filtroTipo.trim().toLowerCase();
    if (tipoTerm) {
      temp = temp.filter(t => (t.tipoTramite || '').toLowerCase().includes(tipoTerm));
    }

    const detalleTerm = this.filtroDetalle.trim().toLowerCase();
    if (detalleTerm) {
      temp = temp.filter(t => (t.descripcion || '').toLowerCase().includes(detalleTerm));
    }

    // Filter by general Search Term
    const term = this.busqueda.trim().toLowerCase();
    if (term) {
      temp = temp.filter((t) => {
        const cliente = t.nombreCliente?.toLowerCase() ?? '';
        const direccion = t.direccionLocal?.toLowerCase() ?? '';
        const tipo = t.tipoTramite?.toLowerCase() ?? '';
        const tecnico = t.tecnicoAsignado?.toLowerCase() ?? '';
        const detalle = t.descripcion?.toLowerCase() ?? '';
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
    this.filtroContratoCliente = '';
    this.filtroTipo = '';
    this.filtroDetalle = '';
    this.filtroEstado = null;
    this.filtroFacturada = null;
    this.aplicarFiltro();
  }

  verTramite(t: TramiteListResponse): void {
    if (!t.idTramite) {
      return;
    }
    this.router.navigate(['/tramite-detalle', t.idTramite]);
  }

  exportarPDF() {
    Swal.fire({
      title: 'Generando PDF',
      text: 'Espere un momento...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    this.api.getBlob('export/intervenciones').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `listado-intervenciones-${new Date().getTime()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        Swal.close();
      },
      error: () => {
        Swal.fire('Error', 'No se pudo generar el PDF.', 'error');
      }
    });
  }
}
