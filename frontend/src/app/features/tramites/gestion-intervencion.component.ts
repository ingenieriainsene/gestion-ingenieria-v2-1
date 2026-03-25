import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { TramiteService, SeguimientoService, Tramite, Seguimiento } from '../../services/domain.services';
import { UsuarioService } from '../../services/usuario.service';
import { TecnicoInstalador, TecnicoInstaladorService } from '../../services/tecnico-instalador.service';
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
      <button type="button"
              (click)="goBack()"
              style="background:transparent; border:none; color:white; text-decoration:none; font-weight:bold; cursor:pointer;">
        ← Volver atrás
      </button>
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
            <textarea class="form-control" formControlName="descripcion" rows="2"
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
    <div class="content-section" style="padding:25px;">
      
      <!-- Timeline Header -->
      <div class="section-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 class="section-title">📜 HISTORIAL DE SEGUIMIENTO</h3>
          <p class="section-subtitle">Línea de tiempo de acciones y objetivos</p>
        </div>
        <button type="button" class="btn-primary-premium" (click)="toggleNuevoHito()">
          <span class="icon">{{ showNuevoHito ? '✕' : '+' }}</span>
          {{ showNuevoHito ? 'Cerrar' : 'Nuevo Seguimiento' }}
        </button>
      </div>

      <!-- Formulario Nuevo Hito (Premium) -->
      <div *ngIf="showNuevoHito" class="form-card-premium mb-5">
        <form [formGroup]="form" (ngSubmit)="addHito()">
          <div class="form-grid">
            <div class="form-field full-width">
              <label>Comentario / Avance</label>
              <textarea formControlName="comentario" placeholder="Describe la acción realizada..." rows="2"></textarea>
            </div>
            
            <div class="form-field">
              <label>Próximo Seguimiento</label>
              <input type="date" formControlName="fechaSeguimiento">
            </div>

            <div class="form-field">
              <label>Estado</label>
              <select formControlName="estado">
                <option value="Pendiente">🔴 Pendiente</option>
                <option value="Terminado">🟢 Terminado</option>
              </select>
            </div>

            <div class="form-field">
              <label class="checkbox-label">
                <input type="checkbox" formControlName="esUrgente">
                <span class="urgent-text">¿MARCAR COMO URGENTE?</span>
              </label>
            </div>

            <!-- Selector de Usuarios (Desplegable Premium) -->
            <div class="form-field full-width">
               <label>Usuario Asignado</label>
               <div class="user-selector-container">
                 <div class="search-and-select">
                   <select class="form-select user-dropdown" (change)="addUser($event)">
                     <option value="">-- Seleccionar usuario para asignar --</option>
                     <option *ngFor="let u of usuariosFiltrados" [value]="u.idUsuario">
                       {{ u.nombreUsuario }} ({{ u.rol }})
                     </option>
                   </select>
                 </div>
                 
                 <div class="assigned-chips mt-2" *ngIf="form.get('idsUsuariosAsignados')?.value.length">
                    <div *ngFor="let id of form.get('idsUsuariosAsignados')?.value" class="user-chip">
                      <span>{{ getNombreUsuario(id) }}</span>
                      <button type="button" class="btn-remove-chip" (click)="removeUser(id)">✕</button>
                    </div>
                 </div>
               </div>
            </div>

            <div class="form-field full-width">
               <label>Instaladores Externos (Asignar)</label>
               <div class="multi-select-box">
                  <div *ngFor="let t of instaladoresDisponibles" class="select-item">
                    <input type="checkbox" (change)="toggleSelection('idsTecnicosInstaladores', t.idTecnicoInstalador!)"
                           [checked]="form.get('idsTecnicosInstaladores')?.value.includes(t.idTecnicoInstalador)">
                    <span>{{ t.nombre }}</span>
                  </div>
               </div>
            </div>
          </div>
          <div class="form-actions mt-3">
            <button type="submit" class="btn-save-premium" [disabled]="form.invalid">💾 Guardar Seguimiento</button>
          </div>
        </form>
      </div>

      <!-- Timeline View -->
      <div class="timeline-container">
        <div class="timeline-line"></div>
        
        <div *ngFor="let s of seguimientos; let i = index" class="timeline-item" [class.urgent]="s.esUrgente">
          <div class="timeline-dot" [class.done]="s.estado === 'Terminado'"></div>
          
          <div class="timeline-card">
            <div class="card-header-flex">
              <div class="date-badge">
                <span class="day">{{ s.fechaSeguimiento | date:'dd' }}</span>
                <span class="month">{{ s.fechaSeguimiento | date:'MMM' | uppercase }}</span>
              </div>
              <div class="card-title-area">
                <div class="card-meta">
                  <span class="badge-status" [class.status-pending]="s.estado === 'Pendiente'" [class.status-done]="s.estado === 'Terminado'">
                    {{ s.estado | uppercase }}
                  </span>
                  <span *ngIf="s.esUrgente" class="badge-urgent">🔥 URGENTE</span>
                  <span class="reg-date">Registrado: {{ s.fechaRegistro | date:'short' }}</span>
                </div>
                <p class="comment-text">{{ s.comentario }}</p>
              </div>
              <div class="card-actions-top">
                <button (click)="eliminarHito(s, i)" class="btn-delete-icon" title="Eliminar">🗑️</button>
              </div>
            </div>

            <div class="card-footer-info">
              <div class="assignment-group" *ngIf="s.nombresUsuariosAsignados?.length || s.nombresTecnicosInstaladores?.length">
                <div class="assign-col" *ngIf="s.nombresUsuariosAsignados?.length">
                   <span class="assign-label">👤 Técnicos:</span>
                   <span class="assign-names">{{ s.nombresUsuariosAsignados?.join(', ') }}</span>
                </div>
                <div class="assign-col" *ngIf="s.nombresTecnicosInstaladores?.length">
                   <span class="assign-label">🛠️ Instaladores:</span>
                   <span class="assign-names">{{ s.nombresTecnicosInstaladores?.join(', ') }}</span>
                </div>
              </div>
              <div class="creator-info">
                Por: <strong>{{ s.nombreCreador || 'Sistema' }}</strong>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="seguimientos.length === 0" class="empty-timeline">
          <div class="empty-icon">📂</div>
          <p>No hay hitos registrados en la línea de tiempo.</p>
        </div>
      </div>

      <!-- Documentación Section (Modernized) -->
      <div class="docs-section mt-5">
        <h3 class="section-title">📁 DOCUMENTACIÓN ADJUNTA</h3>
        <div class="upload-zone-premium">
          <form (ngSubmit)="subirArchivos()" #uploadForm="ngForm" class="upload-form">
            <input type="text" placeholder="Etiqueta para los archivos..." [(ngModel)]="nombreVisibleUpload" name="nombreVisible" required>
            <div class="file-input-wrapper">
              <input type="file" (change)="onFileChange($event)" multiple id="fileUpload">
              <label for="fileUpload">📁 Seleccionar archivos</label>
              <span class="file-count" *ngIf="filesToUpload.length">{{ filesToUpload.length }} seleccionados</span>
            </div>
            <button type="submit" class="btn-upload" [disabled]="!filesToUpload.length || !uploadForm.form.valid">
              ⬆️ Subir documentos
            </button>
          </form>
        </div>

        <div class="files-grid-premium mt-4">
          <div *ngFor="let f of archivos" class="file-card-premium">
            <div class="file-icon-bg">
              <span class="file-icon-large">{{ getIconoArchivo(f) }}</span>
            </div>
            <div class="file-info-premium">
              <span class="file-name">{{ f.nombreVisible }}</span>
              <span class="file-date">{{ f.fechaSubida | date:'shortDate' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="footer-nav mt-5"></div>
    </div>
  </div>
  `,
  styles: [`
    .master-container { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    
    .section-title { font-size: 1.1rem; font-weight: 800; color: #334155; margin: 0; }
    .section-subtitle { font-size: 0.85rem; color: #64748b; margin: 0; }

    /* Forms */
    .form-card-premium { 
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 25px;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); animation: slideDown 0.3s ease-out;
    }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .full-width { grid-column: 1 / -1; }
    .form-field label { display: block; font-size: 0.75rem; font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase; }
    .form-field input, .form-field select, .form-field textarea {
      width: 100%; padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 0.95rem;
      transition: all 0.2s; background: white;
    }
    .form-field input:focus { border-color: #3b82f6; outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
    
    /* User Selector & Chips */
    .user-selector-container { display: flex; flex-direction: column; gap: 8px; }
    .user-dropdown { 
      border-color: #3b82f6 !important; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e");
      background-repeat: no-repeat; background-position: right 0.75rem center; background-size: 16px 12px;
    }
    .assigned-chips { display: flex; flex-wrap: wrap; gap: 8px; min-height: 40px; padding: 10px; background: #fff; border: 1px dashed #cbd5e1; border-radius: 12px; }
    .user-chip { 
      display: flex; align-items: center; gap: 6px; background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;
      padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;
      animation: fadeIn 0.2s ease-out;
    }
    .btn-remove-chip { background: none; border: none; font-size: 1rem; color: #1e40af; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .btn-remove-chip:hover { color: #ef4444; }

    @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }

    .btn-primary-premium {
      background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 10px;
      font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 10px;
    }
    .btn-primary-premium:hover { background: #1d4ed8; transform: translateY(-1px); }

    .btn-save-premium {
       background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 10px;
       font-weight: 700; cursor: pointer; transition: all 0.2s; width: 100%;
    }
    .btn-save-premium:hover { background: #059669; }

    /* Timeline */
    .timeline-container { position: relative; padding-left: 60px; margin-top: 40px; }
    .timeline-line { 
      position: absolute; left: 25px; top: 0; bottom: 0; width: 4px; 
      background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%); border-radius: 2px;
    }
    .timeline-item { position: relative; margin-bottom: 40px; }
    .timeline-dot {
      position: absolute; left: -42px; top: 12px; width: 18px; height: 18px;
      border-radius: 50%; background: white; border: 4px solid #cbd5e1; z-index: 2;
    }
    .timeline-dot.done { border-color: #10b981; background: #dcfce7; }
    
    .timeline-card {
      background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); transition: all 0.3s;
    }
    .timeline-card:hover { transform: translateX(8px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-color: #cbd5e1; }
    .timeline-item.urgent .timeline-card { border-left: 6px solid #ef4444; }
    
    .card-header-flex { display: flex; gap: 20px; align-items: flex-start; }
    
    .date-badge {
      flex-shrink: 0; width: 55px; height: 55px; background: #f1f5f9; border-radius: 12px;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .date-badge .day { font-size: 1.2rem; font-weight: 800; color: #1e293b; line-height: 1; }
    .date-badge .month { font-size: 0.7rem; font-weight: 700; color: #64748b; }

    .card-title-area { flex: 1; }
    .card-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }
    .badge-status { font-size: 0.65rem; font-weight: 800; padding: 3px 10px; border-radius: 20px; }
    .status-pending { background: #fee2e2; color: #991b1b; }
    .status-done { background: #dcfce7; color: #166534; }
    .badge-urgent { background: #ef4444; color: white; font-size: 0.65rem; font-weight: 800; padding: 3px 10px; border-radius: 20px; animation: pulse 2s infinite; }
    .reg-date { font-size: 0.75rem; color: #94a3b8; }
    
    .comment-text { font-size: 1rem; color: #334155; margin: 0; line-height: 1.5; font-weight: 500; }

    .card-footer-info {
      margin-top: 15px; padding-top: 15px; border-top: 1px solid #f1f5f9;
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;
    }
    .assignment-group { display: flex; flex-direction: column; gap: 5px; }
    .assign-col { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; }
    .assign-label { font-weight: 700; color: #64748b; }
    .assign-names { color: #0f172a; font-weight: 600; }
    .creator-info { font-size: 0.75rem; color: #94a3b8; }

    .btn-delete-icon { background: none; border: none; cursor: pointer; font-size: 1.1rem; opacity: 0.3; transition: 0.2s; }
    .btn-delete-icon:hover { opacity: 1; transform: scale(1.2); }

    /* Docs */
    .upload-zone-premium { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; padding: 25px; }
    .upload-form { display: flex; gap: 15px; align-items: center; flex-wrap: wrap; }
    .upload-form input[type="text"] { flex: 1; min-width: 250px; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1; }
    
    .file-input-wrapper { position: relative; }
    .file-input-wrapper input { position: absolute; opacity: 0; width: 0; }
    .file-input-wrapper label {
      display: inline-block; padding: 12px 20px; background: white; border: 1px solid #cbd5e1;
      border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 0.9rem;
    }
    .file-count { margin-left: 10px; font-size: 0.8rem; font-weight: 700; color: #3b82f6; }

    .btn-upload { background: #1e293b; color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; cursor: pointer; }
    .btn-upload:disabled { opacity: 0.5; cursor: not-allowed; }

    .files-grid-premium { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px; }
    .file-card-premium {
      background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px;
      text-align: center; transition: all 0.2s;
    }
    .file-card-premium:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-3px); }
    .file-icon-bg { 
      height: 60px; background: #f1f5f9; border-radius: 8px; display: flex; 
      align-items: center; justify-content: center; margin-bottom: 10px;
    }
    .file-icon-large { font-size: 1.8rem; }
    .file-info-premium { display: flex; flex-direction: column; gap: 2px; }
    .file-name { font-size: 0.8rem; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .file-date { font-size: 0.7rem; color: #94a3b8; }

    .btn-link-back { text-decoration: none; color: #64748b; font-weight: 700; font-size: 0.9rem; transition: color 0.2s; }
    .btn-link-back:hover { color: #1e293b; }

    @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
  `]
})
export class GestionIntervencionComponent implements OnInit {
  tramite: Tramite | null = null;
  seguimientos: Seguimiento[] = [];
  archivos: ArchivoTramite[] = [];

  form: FormGroup;
  estadoForm: FormGroup;
  showNuevoHito = false;
  idTramite: number | null = null;

  tecnicosDisponibles: any[] = [];
  usuariosDisponibles: any[] = [];
  usuariosFiltrados: any[] = [];
  instaladoresDisponibles: TecnicoInstalador[] = [];

  filesToUpload: File[] = [];
  nombreVisibleUpload = '';

  private archivosBaseUrl = `${environment.apiUrl}/archivos`;

  constructor(
    private tramiteService: TramiteService,
    private seguimientoService: SeguimientoService,
    private usuarioService: UsuarioService,
    private instaladorService: TecnicoInstaladorService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private http: HttpClient,
    private location: Location
  ) {
    this.form = this.fb.group({
      comentario: ['', Validators.required],
      fechaSeguimiento: [''],
      esUrgente: [false],
      estado: ['Pendiente'],
      idsUsuariosAsignados: [[]],
      idsTecnicosInstaladores: [[]],
      idUsuarioAsignado: [null]
    });

    this.estadoForm = this.fb.group({
      estado: ['Pendiente', Validators.required],
      esUrgente: [false],
      descripcion: [''],
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

  goBack() {
    this.location.back();
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
        descripcion: t.descripcion || '',
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

    // Fetch technicians and installers
    // Fetch all application users
    this.usuarioService.getAll().subscribe(users => {
      this.usuariosDisponibles = users;
      this.usuariosFiltrados = users; // Or adjust filters if needed
    });
    this.instaladorService.getActivos().subscribe(inst => {
      this.instaladoresDisponibles = inst;
    });
  }

  toggleNuevoHito() {
    this.showNuevoHito = !this.showNuevoHito;
    if (this.showNuevoHito) {
      this.form.patchValue({
        idsUsuariosAsignados: [],
        idsTecnicosInstaladores: []
      });
    }
  }

  addUser(event: any) {
    const id = Number(event.target.value);
    if (!id) return;
    
    // Establecemos tanto el idUsuarioAsignado (principal) como la lista (compatibilidad)
    this.form.patchValue({
      idUsuarioAsignado: id,
      idsUsuariosAsignados: [id]
    });
    
    // Reset dropdown
    event.target.value = '';
  }

  removeUser(id: number) {
    this.form.patchValue({
      idUsuarioAsignado: null,
      idsUsuariosAsignados: []
    });
  }

  getNombreUsuario(id: number): string {
    const u = this.usuariosDisponibles.find(user => user.idUsuario === id);
    return u ? u.nombreUsuario : 'Usuario';
  }

  toggleSelection(controlName: string, id: number) {
    const control = this.form.get(controlName);
    const current = control?.value as number[];
    const index = current.indexOf(id);
    if (index === -1) {
      current.push(id);
    } else {
      current.splice(index, 1);
    }
    control?.setValue(current);
  }

  addHito() {
    if (this.form.invalid || !this.idTramite) return;

    const payload: Seguimiento = {
      ...this.form.value,
      idTramite: this.idTramite
    };

    this.seguimientoService.create(payload).subscribe({
      next: (newHito) => {
        this.seguimientos.unshift(newHito);
        this.form.reset({ estado: 'Pendiente' });
        this.showNuevoHito = false;
        Swal.fire('Registrado', 'Hito de seguimiento agregado', 'success');
      },
      error: (e) => {
        const msg = (e?.error && (e.error['message'] ?? e.error['error'])) || 'No se pudo guardar el hito.';
        Swal.fire('Error', msg, 'error');
      },
    });
  }

  guardarEstado() {
    if (!this.tramite || !this.idTramite) return;
    const { estado, esUrgente, descripcion, fechaSeguimiento } = this.estadoForm.value;
    const payload: Partial<Tramite> = {
      estado,
      esUrgente,
      descripcion: descripcion || null,
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
    this.seguimientoService.create(payload).subscribe({
      next: (newHito) => {
        this.seguimientos.unshift(newHito);
      },
      error: () => { },
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

