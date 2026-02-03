import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TramiteService, SeguimientoService, Tramite, Seguimiento } from '../../services/domain.services';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environments';

interface ArchivoTramite {
  idArchivoT?: number;
  nombreVisible: string;
  nombreFisico: string;
  tipoArchivo?: string;
  fechaSubida?: string;
}

@Component({
  selector: 'app-gestion-intervencion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
  <div *ngIf="tramite" class="master-container"
       style="background:white; max-width:1400px; margin:auto; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1); border-top:8px solid #1e293b; overflow:hidden;">
    <!-- Header -->
    <div class="tech-header d-flex justify-content-between align-items-center"
         style="background:#1e293b; color:white; padding:15px 25px;">
      <div>
        <h2 style="margin:0; color:#f1c40f;">
          INTERVENCIÓN: {{ tramite.tipoTramite | uppercase }}
        </h2>
        <small>
          ID Contrato #{{ tramite.idContrato }}
        </small><br>
        <small style="opacity:0.7;">Estado actual: {{ tramite.estado || 'Pendiente' }}</small>
      </div>
      <a [routerLink]="['/contratos', tramite.idContrato]"
         style="color:white; text-decoration:none; font-weight:bold;">← Volver al contrato</a>
    </div>

    <!-- Panel superior: Estado, Urgente, Observaciones, Fecha (replica detalle_tramite.php) -->
    <div class="top-panel"
         style="display:grid; grid-template-columns:1.2fr 1fr; gap:30px; padding:25px; background:#f8fafc; border-bottom:1px solid #e2e8f0;">
      <form [formGroup]="estadoForm" (ngSubmit)="guardarEstado()" style="width:100%;">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label" style="font-size:0.7rem; font-weight:800; color:#64748b;">
              ESTADO DE LA INTERVENCIÓN
            </label>
            <select class="form-select" formControlName="estado">
              <option value="Pendiente">🔴 Pendiente</option>
              <option value="En proceso">🟠 En proceso</option>
              <option value="Terminado">🟢 Terminado</option>
            </select>
          </div>
          <div class="col-md-4 d-flex align-items-end">
            <label style="font-size:0.85rem; font-weight:700; color:#e11d48; text-transform:uppercase;">
              <input type="checkbox" formControlName="esUrgente" style="margin-right:6px;" />
              ¿URGENTE?
            </label>
          </div>
          <div class="col-md-2 d-flex align-items-end justify-content-end gap-2">
            <button type="submit" class="btn btn-dark btn-sm">💾 Guardar</button>
            <button type="button" class="btn btn-outline-primary btn-sm" (click)="avanzarEstado()">⏩ Avanzar estado</button>
          </div>
        </div>
        <div class="row g-3" style="margin-top:0.5rem;">
          <div class="col-md-6">
            <label class="form-label" style="font-size:0.7rem; font-weight:800; color:#64748b;">📝 OBSERVACIONES TÉCNICAS</label>
            <textarea class="form-control" formControlName="detalleSeguimiento" rows="2"
                      placeholder="Notas del trámite..." style="border:1px solid #cbd5e1; border-radius:8px;"></textarea>
          </div>
          <div class="col-md-4">
            <label class="form-label" style="font-size:0.7rem; font-weight:800; color:#64748b;">📅 FECHA DE SEGUIMIENTO</label>
            <input type="date" class="form-control" formControlName="fechaSeguimiento" style="border:1px solid #cbd5e1; border-radius:8px;" />
          </div>
        </div>
      </form>
    </div>

    <!-- CUERPO: Seguimientos + Archivos -->
    <div class="table-section" style="padding:25px;">
      <!-- Historial de seguimientos -->
      <div
        style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <h3
          style="font-size:0.9rem; text-transform:uppercase; color:#64748b; margin:0; font-weight:bold;">
          📜 Historial de Seguimientos
        </h3>
        <button type="button" class="btn btn-success btn-sm" (click)="toggleNuevoHito()">
          + Nuevo seguimiento
        </button>
      </div>

      <!-- Nuevo hito -->
      <div *ngIf="showNuevoHito"
           style="background:#f8fafc; padding:20px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:20px;">
        <form [formGroup]="form" (ngSubmit)="addHito()">
          <div class="row g-3">
            <div class="col-md-6">
              <label style="font-size:0.7rem; font-weight:bold;">COMENTARIO / AVANCE:</label>
              <textarea class="form-control" rows="2" formControlName="comentario"
                        placeholder="Describe la acción realizada..."></textarea>
            </div>
            <div class="col-md-3">
              <label style="font-size:0.7rem; font-weight:bold;">PRÓXIMO SEG.:</label>
              <input type="date" class="form-control" formControlName="fechaSeguimiento" />
            </div>
            <div class="col-md-2">
              <label style="font-size:0.7rem; font-weight:bold;">ESTADO:</label>
              <select class="form-select" formControlName="estado">
                <option value="Pendiente">🔴 Pendiente</option>
                <option value="Terminado">🟢 Terminado</option>
              </select>
            </div>
            <div class="col-md-1 d-flex flex-column justify-content-end gap-1">
              <button type="submit" class="btn btn-success btn-sm" [disabled]="form.invalid">
                Guardar
              </button>
              <button type="button" class="btn btn-secondary btn-sm" (click)="toggleNuevoHito()">
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Tabla de hitos -->
      <div class="table-scroll-container"
           style="max-height:350px; overflow-y:auto; border:1px solid #cbd5e1; border-radius:8px; background:#fff;">
        <table class="table table-sm align-middle mb-0" style="font-size:0.85rem;">
          <thead style="background:#ebf2f7; position:sticky; top:0; z-index:10;">
            <tr>
              <th style="width:140px;">Fecha Registro</th>
              <th>Comentario</th>
              <th style="width:130px;">Próximo Seg.</th>
              <th style="width:60px; text-align:center;">Urg.</th>
              <th style="width:120px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of seguimientos; let i = index">
              <td style="padding:10px; background:#f8fafc; vertical-align:top;">
                <strong>{{ s.fechaSeguimiento | date:'dd/MM/yyyy' }}</strong>
              </td>
              <td>{{ s.comentario }}</td>
              <td>{{ s.fechaSeguimiento | date:'dd/MM/yyyy' }}</td>
              <td style="text-align:center;">
                <span *ngIf="s.esUrgente" class="badge bg-danger">URG</span>
              </td>
              <td>
                <span class="badge me-2"
                      [ngClass]="{
                        'bg-danger': s.estado === 'Pendiente',
                        'bg-success': s.estado === 'Terminado'
                      }">
                  {{ s.estado }}
                </span>
                <button type="button"
                        class="btn btn-sm btn-outline-danger"
                        title="Eliminar hito"
                        (click)="eliminarHito(s, i)">
                  🗑️
                </button>
              </td>
            </tr>
            <tr *ngIf="seguimientos.length === 0">
              <td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">
                No hay hitos registrados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Documentación de la intervención -->
      <div style="margin-top:30px; border-top:2px solid #f1c40f; padding-top:20px;">
        <h3
          style="color:#1e293b; font-size:0.85rem; text-transform:uppercase; margin-bottom:15px; border-bottom:2px solid #3498db; display:inline-block;">
          📁 Documentación de la intervención
        </h3>

        <!-- Subida -->
        <div
          style="background:#f8fafc; padding:20px; border-radius:12px; border:1px dashed #cbd5e1; margin-bottom:25px;">
          <form (ngSubmit)="subirArchivos()" #uploadForm="ngForm">
            <div class="d-flex flex-wrap gap-2 align-items-center">
              <input type="text" class="form-control"
                     placeholder="Nombre descriptivo (se usará para todos los ficheros seleccionados)"
                     [(ngModel)]="nombreVisibleUpload" name="nombreVisible" required
                     style="flex:1; min-width:220px;">
              <input type="file" (change)="onFileChange($event)" multiple>
              <button type="submit" class="btn btn-primary btn-sm" [disabled]="!filesToUpload.length || !uploadForm.form.valid">
                ⬆️ Subir
              </button>
            </div>
          </form>
        </div>

        <!-- Grid de archivos -->
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:15px;">
          <div *ngFor="let f of archivos"
               style="background:white; border:1px solid #e2e8f0; padding:12px; border-radius:10px;">
            <div
              style="height:100px; display:flex; align-items:center; justify-content:center; background:#f1f5f9; border-radius:8px; margin-bottom:8px;">
              <span style="font-size:2rem;">
                {{ getIconoArchivo(f) }}
              </span>
            </div>
            <strong style="font-size:0.75rem; display:block; text-align:center;">
              {{ f.nombreVisible }}
            </strong>
          </div>
        </div>
      </div>

      <div style="margin-top:20px; text-align:right;">
        <a [routerLink]="['/contratos', tramite.idContrato]"
           style="text-decoration:none; color:#64748b; font-weight:700;">
          ← Volver al contrato
        </a>
      </div>
    </div>
  </div>
  `
})
export class GestionIntervencionComponent implements OnInit {
  tramite: Tramite | null = null;
  seguimientos: Seguimiento[] = [];
  archivos: ArchivoTramite[] = [];

  form: FormGroup;
  estadoForm: FormGroup;
  showNuevoHito = false;
  idTramite: number | null = null;

  filesToUpload: File[] = [];
  nombreVisibleUpload = '';

  private archivosBaseUrl = `${environment.apiUrl}/archivos`;

  constructor(
    private tramiteService: TramiteService,
    private seguimientoService: SeguimientoService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      comentario: ['', Validators.required],
      fechaSeguimiento: [''],
      esUrgente: [false],
      estado: ['Pendiente']
    });

    this.estadoForm = this.fb.group({
      estado: ['Pendiente', Validators.required],
      esUrgente: [false],
      detalleSeguimiento: [''],
      fechaSeguimiento: ['']
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.idTramite = Number(params.get('idTramite'));
      if (this.idTramite) {
        this.loadData();
      }
    });
  }

  loadData() {
    if (!this.idTramite) return;

    // Trámite
    this.tramiteService.getById(this.idTramite).subscribe(t => {
      this.tramite = t;
      const fs = t.fechaSeguimiento;
      let fStr = '';
      if (typeof fs === 'string') fStr = fs.slice(0, 10);
      else if (fs instanceof Date) fStr = fs.toISOString().slice(0, 10);
      this.estadoForm.patchValue({
        estado: t.estado || 'Pendiente',
        esUrgente: !!t.esUrgente,
        detalleSeguimiento: t.detalleSeguimiento || '',
        fechaSeguimiento: fStr || ''
      });
    });

    // Seguimientos
    this.seguimientoService.getByTramite(this.idTramite).subscribe(data => {
      this.seguimientos = data;
      if (this.seguimientos.length === 0) {
        this.crearHitoInicial();
      }
    });

    // Archivos
    this.http.get<ArchivoTramite[]>(`${this.archivosBaseUrl}/tramite/${this.idTramite}`)
      .subscribe(data => this.archivos = data);
  }

  toggleNuevoHito() {
    this.showNuevoHito = !this.showNuevoHito;
  }

  addHito() {
    if (this.form.invalid || !this.idTramite) return;

    const payload: Seguimiento = {
      ...this.form.value,
      idTramite: this.idTramite
    };

    this.seguimientoService.create(payload).subscribe(newHito => {
      this.seguimientos.unshift(newHito);
      this.form.reset({ estado: 'Pendiente' });
      this.showNuevoHito = false;
      Swal.fire('Registrado', 'Hito de seguimiento agregado', 'success');
    });
  }

  guardarEstado() {
    if (!this.tramite || !this.idTramite) return;
    const { estado, esUrgente, detalleSeguimiento, fechaSeguimiento } = this.estadoForm.value;
    const payload: Partial<Tramite> = {
      estado,
      esUrgente,
      detalleSeguimiento: detalleSeguimiento || null,
      fechaSeguimiento: fechaSeguimiento || null
    };
    this.tramiteService.update(this.idTramite, payload).subscribe(t => {
      this.tramite = { ...this.tramite!, ...t };
      Swal.fire('Actualizado', 'Datos técnicos de la intervención guardados.', 'success');
    });
  }

  avanzarEstado() {
    if (!this.idTramite) return;
    this.tramiteService.avanzarEstado(this.idTramite).subscribe(t => {
      this.tramite = t;
      this.estadoForm.patchValue({
        estado: t.estado || 'Pendiente',
        esUrgente: !!t.esUrgente
      });
      Swal.fire('Actualizado', `Estado avanzado a "${t.estado}"`, 'success');
    });
  }

  eliminarHito(s: Seguimiento, index: number) {
    if (!s.idSeguimiento) return;
    if (!confirm('¿Borrar este hito permanentemente?')) return;
    this.seguimientoService.delete(s.idSeguimiento).subscribe(() => {
      this.seguimientos.splice(index, 1);
    });
  }

  private crearHitoInicial() {
    if (!this.idTramite) return;
    const hoy = new Date().toISOString().substring(0, 10);
    const payload: Seguimiento = {
      idTramite: this.idTramite,
      comentario: 'Iniciar Actividad',
      fechaSeguimiento: hoy,
      esUrgente: false,
      estado: 'Pendiente'
    };
    this.seguimientoService.create(payload).subscribe(newHito => {
      this.seguimientos.unshift(newHito);
    });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.filesToUpload = input.files ? Array.from(input.files) : [];
  }

  subirArchivos() {
    if (!this.idTramite || !this.filesToUpload.length || !this.nombreVisibleUpload) {
      return;
    }

    const requests = this.filesToUpload.map(file => {
      const formData = new FormData();
      formData.append('file', file);
      return this.http.post<ArchivoTramite>(
        `${this.archivosBaseUrl}/tramite/${this.idTramite}`,
        formData
      );
    });

    Promise.all(requests.map(r => r.toPromise()))
      .then(result => {
        this.archivos = [...(result as ArchivoTramite[]), ...this.archivos];
        this.filesToUpload = [];
        this.nombreVisibleUpload = '';
        Swal.fire('Correcto', 'Archivos subidos', 'success');
      })
      .catch(() => Swal.fire('Error', 'No se pudieron subir los archivos', 'error'));
  }

  getIconoArchivo(f: ArchivoTramite): string {
    const nombre = f.nombreVisible || f.nombreFisico || '';
    const ext = nombre.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png'].includes(ext)) return '🖼️';
    if (ext === 'pdf') return '📄';
    return '📁';
  }
}

