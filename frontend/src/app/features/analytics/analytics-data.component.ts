import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil, switchMap } from 'rxjs';
import {
    AnalyticsService,
    AnalyticsTramite,
    AnalyticsFilter,
    PageResponse
} from '../../services/analytics.service';

@Component({
    selector: 'app-analytics-data',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="analytics-container">

      <div class="header-section">
        <h1>Análisis de Datos <span class="badge-contador" *ngIf="page">{{ page.totalElements }} registros</span></h1>
        <p class="analytics-subtitle">Ciclo de vida de intervenciones · Solo lectura</p>
      </div>

      <!-- ───── Filtros ───── -->
      <div class="filters-card">
        <div class="filters-grid">

          <div class="filter-group">
            <label class="filter-label">Tipo de Intervención</label>
            <input
              class="filter-input"
              type="text"
              placeholder="Ej. Legalización, Mantenimiento…"
              [(ngModel)]="filter.tipoTramite"
              (ngModelChange)="onFilterChange()"
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">Estado</label>
            <select class="filter-input" [(ngModel)]="filter.estado" (ngModelChange)="onFilterChange()">
              <option value="">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En proceso">En proceso</option>
              <option value="Terminado">Terminado</option>
              <option value="Anulado">Anulado</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Técnico Asignado</label>
            <input
              class="filter-input"
              type="text"
              placeholder="Nombre del técnico…"
              [(ngModel)]="filter.tecnico"
              (ngModelChange)="onFilterChange()"
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">Fecha Desde</label>
            <input
              class="filter-input"
              type="date"
              [(ngModel)]="filter.fechaDesde"
              (ngModelChange)="onFilterChange()"
            />
          </div>

          <div class="filter-group">
            <label class="filter-label">Fecha Hasta</label>
            <input
              class="filter-input"
              type="date"
              [(ngModel)]="filter.fechaHasta"
              (ngModelChange)="onFilterChange()"
            />
          </div>

          <div class="filter-group filter-actions">
            <label class="filter-label">&nbsp;</label>
            <button class="btn-reset" (click)="resetFilters()">✖ Limpiar filtros</button>
          </div>

        </div>
      </div>

      <!-- ───── Estado de carga / error ───── -->
      <div class="state-message loading" *ngIf="loading">
        <span class="spinner"></span> Cargando datos…
      </div>

      <div class="state-message error" *ngIf="error && !loading">
        ⚠️ {{ error }}
      </div>

      <!-- ───── Data Grid ───── -->
      <div class="grid-card" *ngIf="!loading && !error">

        <div class="table-wrapper">
          <table class="data-table table-card">
            <thead>
              <tr>
                <th class="sortable" (click)="setSort('idTramite')">
                  # <span class="sort-arrow">{{ getSortArrow('idTramite') }}</span>
                </th>
                <th class="sortable" (click)="setSort('tipoTramite')">
                  Tipo <span class="sort-arrow">{{ getSortArrow('tipoTramite') }}</span>
                </th>
                <th class="sortable" (click)="setSort('estado')">
                  Estado <span class="sort-arrow">{{ getSortArrow('estado') }}</span>
                </th>
                <th>Cliente</th>
                <th>Local / Dirección</th>
                <th class="sortable" (click)="setSort('tecnicoAsignado')">
                  Técnico <span class="sort-arrow">{{ getSortArrow('tecnicoAsignado') }}</span>
                </th>
                <th class="sortable" (click)="setSort('fechaCreacion')">
                  Inicio <span class="sort-arrow">{{ getSortArrow('fechaCreacion') }}</span>
                </th>
                <th class="sortable" (click)="setSort('fechaEjecucion')">
                  Fin <span class="sort-arrow">{{ getSortArrow('fechaEjecucion') }}</span>
                </th>
                <th>Duración (días)</th>
                <th>Urgente</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="rows.length === 0">
                <td colspan="10" class="empty-row">No hay registros para los filtros seleccionados.</td>
              </tr>
              <tr *ngFor="let row of rows" [class.row-urgente]="row.esUrgente">
                <td data-label="ID" class="cell-id">{{ row.idTramite }}</td>
                <td data-label="Tipo">
                  <span class="tipo-badge">{{ row.tipoTramite }}</span>
                </td>
                <td data-label="Estado">
                  <span class="estado-badge" [ngClass]="estadoClass(row.estado)">
                    {{ row.estado }}
                  </span>
                </td>
                <td data-label="Cliente">
                  <span *ngIf="row.nombreCliente">
                    {{ row.nombreCliente }} {{ row.apellido1Cliente }}
                  </span>
                  <span class="text-muted" *ngIf="!row.nombreCliente">—</span>
                </td>
                <td data-label="Local/Dirección" class="cell-dir">
                  <span *ngIf="row.direccionLocal">{{ row.direccionLocal }}</span>
                  <span class="text-muted" *ngIf="!row.direccionLocal">—</span>
                </td>
                <td data-label="Técnico">
                  <span *ngIf="row.tecnicoAsignado">{{ row.tecnicoAsignado }}</span>
                  <span class="text-muted" *ngIf="!row.tecnicoAsignado">—</span>
                </td>
                <td data-label="Inicio" class="cell-date">{{ formatDate(row.fechaCreacion) }}</td>
                <td data-label="Fin" class="cell-date">{{ formatDate(row.fechaEjecucion) }}</td>
                <td data-label="Duración" class="cell-duracion">
                  <span *ngIf="row.duracionDias !== null && row.duracionDias !== undefined"
                        [ngClass]="duracionClass(row.duracionDias)">
                    {{ row.duracionDias }}d
                  </span>
                  <span class="text-muted" *ngIf="row.duracionDias === null || row.duracionDias === undefined">
                    En curso
                  </span>
                </td>
                <td data-label="Urgente" class="cell-urgente">
                  <span *ngIf="row.esUrgente" class="urgente-dot" title="Urgente">🔴</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ───── Paginación ───── -->
        <div class="pagination" *ngIf="page && page.totalPages > 1">
          <button
            class="page-btn"
            [disabled]="currentPage === 0"
            (click)="goToPage(0)"
            title="Primera"
          >«</button>
          <button
            class="page-btn"
            [disabled]="currentPage === 0"
            (click)="goToPage(currentPage - 1)"
            title="Anterior"
          >‹</button>

          <span class="page-info">
            Página {{ currentPage + 1 }} de {{ page.totalPages }}
          </span>

          <button
            class="page-btn"
            [disabled]="currentPage >= page.totalPages - 1"
            (click)="goToPage(currentPage + 1)"
            title="Siguiente"
          >›</button>
          <button
            class="page-btn"
            [disabled]="currentPage >= page.totalPages - 1"
            (click)="goToPage(page.totalPages - 1)"
            title="Última"
          >»</button>

          <select class="page-size-select" [(ngModel)]="pageSize" (ngModelChange)="onPageSizeChange()">
            <option [value]="10">10 / pág.</option>
            <option [value]="20">20 / pág.</option>
            <option [value]="50">50 / pág.</option>
            <option [value]="100">100 / pág.</option>
          </select>
        </div>
      </div>

    </div>
  `,
    styles: [`
    /* Container */
    .analytics-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    }

    /* Header */
    .analytics-header { display: none; }

    .total-badge {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: #fff;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    /* Filters */
    .filters-card {
      background: #fff;
      border-radius: 12px;
      padding: 20px 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.04);
      margin-bottom: 20px;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      align-items: end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .filter-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .filter-input {
      padding: 8px 12px;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #1e293b;
      background: #f8fafc;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }

    .filter-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
      background: #fff;
    }

    .filter-actions { }

    .btn-reset {
      padding: 8px 16px;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      background: #fff;
      color: #64748b;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-reset:hover {
      background: #fee2e2;
      border-color: #fca5a5;
      color: #dc2626;
    }

    /* State messages */
    .state-message {
      text-align: center;
      padding: 48px;
      border-radius: 12px;
      font-size: 1rem;
    }

    .state-message.loading {
      background: #f0f9ff;
      color: #0369a1;
    }

    .state-message.error {
      background: #fef2f2;
      color: #dc2626;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #bae6fd;
      border-top-color: #0369a1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 8px;
      vertical-align: middle;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Grid card */
    .grid-card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.04);
      overflow: hidden;
    }

    /* Table */
    .table-wrapper {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .data-table thead tr {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    }

    .data-table th {
      padding: 12px 14px;
      text-align: left;
      color: #94a3b8;
      font-weight: 600;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
      user-select: none;
    }

    .data-table th.sortable {
      cursor: pointer;
      transition: color 0.2s;
    }

    .data-table th.sortable:hover { color: #e2e8f0; }

    .sort-arrow { font-style: normal; }

    .data-table tbody tr {
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.15s;
    }

    .data-table tbody tr:hover { background: #f8fafc; }
    .data-table tbody tr.row-urgente { background: #fff7ed; }
    .data-table tbody tr.row-urgente:hover { background: #ffedd5; }

    .data-table td {
      padding: 11px 14px;
      color: #334155;
      vertical-align: middle;
    }

    .empty-row {
      text-align: center;
      color: #94a3b8;
      padding: 48px !important;
      font-style: italic;
    }

    /* Cell specific */
    .cell-id { color: #94a3b8; font-size: 0.8rem; }
    .cell-date { white-space: nowrap; color: #475569; }
    .cell-dir { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cell-urgente { text-align: center; }
    .cell-duracion { text-align: center; font-weight: 600; }

    .text-muted { color: #94a3b8; font-style: italic; }

    /* Badges */
    .tipo-badge {
      background: #eff6ff;
      color: #1d4ed8;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .estado-badge {
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .estado-pendiente  { background: #fef9c3; color: #a16207; }
    .estado-enproceso  { background: #dbeafe; color: #1d4ed8; }
    .estado-terminado  { background: #dcfce7; color: #166534; }
    .estado-anulado    { background: #fee2e2; color: #991b1b; }
    .estado-default    { background: #f1f5f9; color: #475569; }

    .duracion-ok      { color: #16a34a; }
    .duracion-warning { color: #d97706; }
    .duracion-danger  { color: #dc2626; }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      border-top: 1px solid #f1f5f9;
      flex-wrap: wrap;
    }

    .page-btn {
      padding: 6px 12px;
      border: 1.5px solid #e2e8f0;
      border-radius: 6px;
      background: #fff;
      color: #475569;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.15s;
    }

    .page-btn:hover:not([disabled]) {
      background: #3b82f6;
      border-color: #3b82f6;
      color: #fff;
    }

    .page-btn[disabled] {
      opacity: 0.35;
      cursor: not-allowed;
    }

    .page-info {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0 8px;
    }

    .page-size-select {
      padding: 6px 10px;
      border: 1.5px solid #e2e8f0;
      border-radius: 6px;
      font-size: 0.875rem;
      color: #475569;
      background: #fff;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .analytics-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }

      .filter-grid {
        grid-template-columns: 1fr;
      }

      .filter-group,
      .filter-actions {
        width: 100%;
      }

      .pagination {
        flex-direction: column;
        align-items: stretch;
      }

      .page-btn,
      .page-size-select {
        width: 100%;
      }
    }
  `]
})
export class AnalyticsDataComponent implements OnInit, OnDestroy {

    rows: AnalyticsTramite[] = [];
    page: PageResponse<AnalyticsTramite> | null = null;
    loading = false;
    error: string | null = null;

    currentPage = 0;
    pageSize = 20;
    sortField = 'fechaCreacion';
    sortDir = 'desc';

    filter: AnalyticsFilter = {};

    private filterChange$ = new Subject<void>();
    private destroy$ = new Subject<void>();

    constructor(private analyticsService: AnalyticsService) { }

    ngOnInit(): void {
        // Debounce text input changes by 400ms, then reload
        this.filterChange$
            .pipe(
                debounceTime(400),
                takeUntil(this.destroy$),
                switchMap(() => {
                    this.loading = true;
                    this.error = null;
                    this.currentPage = 0;
                    return this.analyticsService.getTramites(this.buildFilter());
                })
            )
            .subscribe({
                next: (data) => { this.page = data; this.rows = data.content; this.loading = false; },
                error: (err) => { this.error = 'Error al cargar los datos. ' + (err?.message ?? ''); this.loading = false; }
            });

        // Initial load
        this.load();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ── Actions ────────────────────────────────────────────────────────────────

    onFilterChange(): void {
        this.filterChange$.next();
    }

    resetFilters(): void {
        this.filter = {};
        this.currentPage = 0;
        this.filterChange$.next();
    }

    goToPage(p: number): void {
        this.currentPage = p;
        this.load();
    }

    onPageSizeChange(): void {
        this.currentPage = 0;
        this.load();
    }

    setSort(field: string): void {
        if (this.sortField === field) {
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortDir = 'desc';
        }
        this.currentPage = 0;
        this.load();
    }

    getSortArrow(field: string): string {
        if (this.sortField !== field) return '⇅';
        return this.sortDir === 'asc' ? '↑' : '↓';
    }

    // ── Template helpers ────────────────────────────────────────────────────────

    estadoClass(estado?: string): string {
        if (!estado) return 'estado-default';
        const e = estado.toLowerCase().replace(/\s/g, '');
        if (e === 'pendiente') return 'estado-pendiente';
        if (e === 'enproceso') return 'estado-enproceso';
        if (e === 'terminado') return 'estado-terminado';
        if (e === 'anulado') return 'estado-anulado';
        return 'estado-default';
    }

    duracionClass(dias: number): string {
        if (dias <= 7) return 'duracion-ok';
        if (dias <= 30) return 'duracion-warning';
        return 'duracion-danger';
    }

    formatDate(iso?: string): string {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch { return iso; }
    }

    // ── Private ─────────────────────────────────────────────────────────────────

    private load(): void {
        this.loading = true;
        this.error = null;
        this.analyticsService.getTramites(this.buildFilter())
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => { this.page = data; this.rows = data.content; this.loading = false; },
                error: (err) => { this.error = 'Error al cargar los datos. ' + (err?.message ?? ''); this.loading = false; }
            });
    }

    private buildFilter(): AnalyticsFilter {
        return {
            ...this.filter,
            page: this.currentPage,
            size: this.pageSize,
            sort: this.sortField,
            dir: this.sortDir,
        };
    }
}
