import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  MantenimientoPreventivoService,
  ContratoMantenimiento,
  AvisoMantenimiento,
  GenerarAvisosRequest,
  GenerarAvisosResponse,
} from '../../services/mantenimiento-preventivo.service';

interface TareaPlan {
  tareaContratoId: number;
  nombre: string;
  descripcion?: string;
  frecuenciaMeses: number;
  fechaInicio: string;
}

@Component({
  selector: 'app-planificacion-intervenciones',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="ficha-top">
      <a routerLink="/contratos" class="direct-link">&larr; Volver a contratos</a>
    </div>

    <div *ngIf="loading" class="ficha-loading">Cargando…</div>

    <div *ngIf="!loading && contrato" class="ficha-container">
      <div class="ficha-header clearfix">
        <div class="ficha-title-wrap">
          <h1 class="ficha-title">PLANIFICACIÓN DE INTERVENCIONES</h1>
          <small>Contrato #{{ contrato.idContratoMant }}</small>
        </div>
      </div>

      <div class="info-card-grid">
        <div class="info-card">
          <h3>Fecha inicio contrato</h3>
          <p>{{ contrato.fechaInicio | date:'dd/MM/yyyy' }}</p>
        </div>
        <div class="info-card">
          <h3>Estado</h3>
          <p>{{ contrato.estado || '—' }}</p>
        </div>
      </div>

      <section class="ficha-section">
        <div class="section-header">
          <h2>🧰 Tareas a programar</h2>
        </div>
        <div class="table-wrap">
          <table class="ficha-table">
            <thead>
              <tr>
                <th>TAREA</th>
                <th>DESCRIPCIÓN</th>
                <th style="text-align:right;">FRECUENCIA (MESES)</th>
                <th style="text-align:right;">FECHA INICIO</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of tareas">
                <td>{{ t.nombre }}</td>
                <td>{{ t.descripcion || '—' }}</td>
                <td style="text-align:right;">{{ t.frecuenciaMeses }}</td>
                <td style="text-align:right;">
                  <input type="date" [(ngModel)]="t.fechaInicio" />
                </td>
              </tr>
              <tr *ngIf="tareas.length === 0">
                <td colspan="4" class="empty-cell">No hay tareas en el contrato.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="info-card-grid" *ngIf="!yaGenerado">
        <div class="info-card info-card-wide">
          <h3>Generar contrato e intervenciones</h3>
          <p>Se creará el contrato y se generarán las intervenciones con sus seguimientos agrupados por fecha.</p>
          <div class="cta-actions">
            <label>Generar hasta:</label>
            <input type="date" [(ngModel)]="generarHasta" />
            <button type="button" class="btn-primary" (click)="generarIntervenciones()" [disabled]="generando">
              Generar contrato e intervenciones
            </button>
          </div>
        </div>
      </div>

      <div class="info-card-grid" *ngIf="yaGenerado">
        <div class="info-card info-card-wide">
          <h3>Contrato e intervenciones generados</h3>
          <p>Las intervenciones y sus seguimientos ya están creados. Puedes gestionarlos dentro del contrato.</p>
          <div class="cta-actions">
            <button type="button" class="btn-primary" (click)="verContrato()">Ver contrato</button>
          </div>
        </div>
      </div>

      <section class="ficha-section" *ngIf="avisos.length">
        <div class="section-header">
          <h2>📆 Intervenciones generadas</h2>
        </div>
        <div class="table-wrap">
          <table class="ficha-table">
            <thead>
              <tr>
                <th>FECHA</th>
                <th>ESTADO</th>
                <th>DETALLE</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let a of avisos">
                <td>{{ a.fechaProgramada | date:'dd/MM/yyyy' }}</td>
                <td>{{ a.estado || 'Pendiente' }}</td>
                <td>
                  <div *ngIf="a.detalles?.length; else sinDetalles">
                    <span *ngFor="let d of a.detalles; let last = last">
                      {{ d.tareaNombre || ('Tarea ' + d.tareaContratoId) }}<span *ngIf="!last">, </span>
                    </span>
                  </div>
                  <ng-template #sinDetalles>—</ng-template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styleUrls: ['../clientes/cliente-ficha-view.component.css'],
})
export class PlanificacionIntervencionesComponent implements OnInit {
  contrato: ContratoMantenimiento | null = null;
  tareas: TareaPlan[] = [];
  avisos: AvisoMantenimiento[] = [];
  loading = true;
  generando = false;
  generarHasta = '';
  yaGenerado = false;
  contratoBaseId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: MantenimientoPreventivoService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!id || isNaN(id)) {
        this.router.navigate(['/contratos']);
        return;
      }
      this.cargarContrato(id);
    });
  }

  private cargarContrato(id: number): void {
    this.loading = true;
    this.service.getContratoById(id).subscribe({
      next: (c) => {
        this.contrato = c;
        this.contratoBaseId = c.contratoId ?? null;
        this.yaGenerado = !!this.contratoBaseId;
        const inicio = c.fechaInicio || new Date().toISOString().slice(0, 10);
        this.tareas = (c.tareas || []).map((t) => ({
          tareaContratoId: t.idTareaContrato!,
          nombre: t.nombre,
          descripcion: t.descripcion,
          frecuenciaMeses: t.frecuenciaMeses,
          fechaInicio: inicio,
        }));
        this.generarHasta = this.addMonths(new Date(inicio), 12);
        this.cargarAvisos(id);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.contrato = null;
      },
    });
  }

  private cargarAvisos(id: number): void {
    this.service.getAvisosByContrato(id).subscribe({
      next: (list) => {
        this.avisos = list || [];
        if (this.avisos.length > 0) {
          this.yaGenerado = true;
        }
      },
      error: () => (this.avisos = []),
    });
  }

  generarIntervenciones(): void {
    if (!this.contrato?.idContratoMant) return;
    this.generando = true;
    const payload: GenerarAvisosRequest = {
      hasta: this.generarHasta || undefined,
      tareas: this.tareas.map((t) => ({
        tareaContratoId: t.tareaContratoId,
        fechaInicio: t.fechaInicio,
      })),
    };
    this.service.generarAvisos(this.contrato.idContratoMant, payload).subscribe({
      next: (res: GenerarAvisosResponse | AvisoMantenimiento[]) => {
        this.generando = false;
        const avisos = Array.isArray(res) ? res : (res?.avisos || []);
        const contratoId = Array.isArray(res) ? undefined : res?.contratoId;
        this.avisos = avisos;
        if (contratoId) {
          this.contratoBaseId = contratoId;
          this.yaGenerado = true;
        }
        Swal.fire('Contrato generado', 'Se han creado las intervenciones y sus seguimientos.', 'success')
          .then(() => {
            const id = contratoId || this.contratoBaseId || this.contrato?.contratoId;
            if (id) {
              this.router.navigate(['/contratos', id]);
              return;
            }
            if (!this.contrato?.idContratoMant) {
              Swal.fire('Aviso', 'Intervenciones generadas, pero no se pudo abrir el contrato.', 'warning');
              return;
            }
            this.service.getContratoById(this.contrato.idContratoMant).subscribe({
              next: (c) => {
                if (c?.contratoId) {
                  this.contratoBaseId = c.contratoId;
                  this.yaGenerado = true;
                  this.router.navigate(['/contratos', c.contratoId]);
                } else {
                  Swal.fire('Aviso', 'Intervenciones generadas, pero no se pudo abrir el contrato.', 'warning');
                }
              },
              error: () => {
                Swal.fire('Aviso', 'Intervenciones generadas, pero no se pudo abrir el contrato.', 'warning');
              },
            });
          });
      },
      error: (e) => {
        this.generando = false;
        const msg = e?.error?.message || e?.error || 'No se pudieron generar los avisos.';
        Swal.fire('Error', msg, 'error');
      },
    });
  }

  private addMonths(date: Date, months: number): string {
    const d = new Date(date.getTime());
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
  }

  verContrato(): void {
    const id = this.contratoBaseId || this.contrato?.contratoId;
    if (id) {
      this.router.navigate(['/contratos', id]);
    }
  }
}
