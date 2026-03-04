import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
    </div>

    <table class="table-card">
      <thead>
        <tr>
          <th>FECHA REGISTRO</th>
          <th>INTERVENCIÓN</th>
          <th>COMENTARIO</th>
          <th class="col-tecnico">TÉCNICO</th>
          <th>PROVEEDOR</th>
          <th>PRÓX. SEGUIMIENTO</th>
          <th style="text-align:center;">URG</th>
          <th>ESTADO</th>
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
              [(ngModel)]="filtroTramite"
              (ngModelChange)="aplicarFiltro()"
              class="header-input"
              placeholder="# intervención"
            />
          </th>
          <th>
            <input
              type="text"
              [(ngModel)]="filtroComentario"
              (ngModelChange)="aplicarFiltro()"
              class="header-input"
              placeholder="Comentario"
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
              [(ngModel)]="filtroProveedor"
              (change)="aplicarFiltro()"
              class="header-input"
            >
              <option [ngValue]="null">Todos</option>
              <option *ngFor="let p of proveedores" [ngValue]="p.idProveedor ?? p.id">
                {{ p.nombreComercial }}
              </option>
            </select>
          </th>
          <th>
            <input
              type="date"
              [(ngModel)]="filtroFechaProx"
              (change)="aplicarFiltro()"
              class="header-input"
            />
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
          <th style="text-align:right;">
            <button class="btn-clear small" type="button" (click)="limpiarFiltros()">
              Limpiar
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let s of filtrados" class="row-card" (click)="verTramite(s)" style="cursor:pointer;">
          <td data-label="Fecha registro">
            <strong>{{ s.fechaRegistro | date:'dd/MM/yyyy' }}</strong><br />
            <small>{{ s.fechaRegistro | date:'HH:mm' }}</small>
          </td>
          <td data-label="Intervención">
            <a *ngIf="s.idTramite" [routerLink]="['/tramite-detalle', s.idTramite]" class="maps-link" style="font-weight:700;">
              #{{ s.idTramite }}
            </a>
            <span *ngIf="!s.idTramite">—</span>
          </td>
          <td data-label="Comentario">{{ s.comentario || '—' }}</td>
          <td data-label="Técnico" class="col-tecnico">{{ s.nombreAsignado || '—' }}</td>
          <td data-label="Proveedor">{{ s.nombreProveedor || '—' }}</td>
          <td data-label="Próx. seguimiento">{{ s.fechaSeguimiento | date:'dd/MM/yyyy' }}</td>
          <td data-label="Urg." style="text-align:center;">
            <span *ngIf="s.esUrgente" class="urg-badge">URG</span>
          </td>
          <td data-label="Estado">
            <span class="status-badge" [ngClass]="s.estado?.toLowerCase()">{{ s.estado || '—' }}</span>
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

    @media (max-width: 768px) {
      .filters-bar {
        flex-direction: column;
        align-items: stretch;
      }

      .tabs {
        flex-wrap: wrap;
      }

      .search input {
        min-width: 100%;
        width: 100%;
      }

      .header-date-range {
        flex-direction: column;
      }
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
  filtroTramite: string = '';
  filtroComentario: string = '';
  filtroFechaProx: string = '';

  constructor(
    private seguimientoService: SeguimientoService,
    private usuarioService: UsuarioService,
    private proveedorService: ProveedorService,
    private router: Router
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

    // Filtro por intervención (idTramite)
    const tramTerm = this.filtroTramite.trim();
    if (tramTerm) {
      res = res.filter(s => (s.idTramite ? String(s.idTramite) : '').includes(tramTerm));
    }

    // Filtro por comentario
    const comentarioTerm = this.filtroComentario.trim().toLowerCase();
    if (comentarioTerm) {
      res = res.filter(s => (s.comentario || '').toLowerCase().includes(comentarioTerm));
    }

    // Filtro por próxima fecha de seguimiento exacta
    if (this.filtroFechaProx) {
      const fProx = new Date(this.filtroFechaProx).setHours(0, 0, 0, 0);
      res = res.filter(s => s.fechaSeguimiento && new Date(s.fechaSeguimiento).setHours(0, 0, 0, 0) === fProx);
    }

    // Texto global (buscador superior)
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

    this.filtrados = res;
  }

  limpiarFiltros() {
    this.busqueda = '';
    this.filtroTecnico = null;
    this.filtroProveedor = null;
    this.fechaInicio = '';
    this.fechaFin = '';
    this.soloUrgentes = false;
    this.filtroTramite = '';
    this.filtroComentario = '';
    this.filtroFechaProx = '';
    this.aplicarFiltro();
  }

  verTramite(s: Seguimiento): void {
    if (!s.idTramite) {
      return;
    }
    this.router.navigate(['/tramite-detalle', s.idTramite]);
  }
}
