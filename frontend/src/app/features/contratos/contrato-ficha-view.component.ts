import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContratoService, TramiteService, Contrato, Tramite } from '../../services/domain.services';
import { AuditStampComponent } from '../../layout/audit-stamp.component';
import { FileUploaderComponent } from '../../shared/file-uploader.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contrato-ficha-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuditStampComponent, FileUploaderComponent],
  template: `
    <div *ngIf="contrato" class="main-container">
      <app-audit-stamp [data]="contrato"></app-audit-stamp>

      <div class="gestion-container">
        <div class="header-section">
          <div>
            <h1>CONTRATO #{{ contrato.idContrato }}</h1>
            <p>Seguimiento Tecnico y Expediente</p>
            <p class="contract-dates">
              <span><strong>Inicio:</strong> {{ contrato.fechaInicio | date:'dd/MM/yyyy' }}</span>
              <span><strong>Vencimiento:</strong> {{ contrato.fechaVencimiento | date:'dd/MM/yyyy' }}</span>
            </p>
          </div>
          <div class="header-badge-wrap">
            <span class="header-label">SERVICIO:</span>
            <span class="badge-tipo">{{ contrato.tipoContrato }}</span>
            <span class="status-badge" [ngClass]="contrato.estado?.toLowerCase() || 'activo'" style="margin-left: 10px; vertical-align: middle;">
              {{ contrato.estado || 'Activo' }}
            </span>
          </div>
        </div>

        <div class="filter-bar">
          <span class="filter-label">Filtrar intervenciones:</span>
          <button type="button" class="filter-chip" [class.active]="filtroTipo === 'todos'" (click)="setFiltro('todos')">Todas</button>
          <button type="button" class="filter-chip" [class.active]="filtroTipo === 'mantenimiento'" (click)="setFiltro('mantenimiento')">Mantenimiento</button>
          <button type="button" class="filter-chip" [class.active]="filtroTipo === 'otros'" (click)="setFiltro('otros')">Otras</button>
        </div>

        <div class="panel-grid">
          <div class="panel-section">
            <h3>Cliente</h3>
            <div class="data-row">
              <span class="data-label">Nombre:</span>
              <span class="data-value">
                <a [routerLink]="['/clientes', contrato.cliente?.idCliente]" class="direct-link">
                  {{ contrato.cliente?.nombre }} {{ contrato.cliente?.apellido1 }}
                </a>
              </span>
            </div>
            <div class="data-row">
              <span class="data-label">DNI / NIF:</span>
              <span class="data-value">{{ contrato.cliente?.dni }}</span>
            </div>
            <div class="data-row">
              <span class="data-label">IBAN:</span>
              <span class="data-value">{{ contrato.cliente?.cuentaBancaria }}</span>
            </div>
          </div>

          <div class="panel-section">
            <h3>Localizacion</h3>
            <div class="data-row">
              <span class="data-label">Direccion:</span>
              <span class="data-value">
                <a [routerLink]="['/locales', contrato.local?.idLocal]" class="direct-link">
                  {{ contrato.local?.direccionCompleta }}
                </a>
              </span>
            </div>
            <div class="data-row">
              <span class="data-label">Titular:</span>
              <span class="data-value">{{ contrato.local?.nombreTitular }}</span>
            </div>
          </div>

          <div class="grid-layout-wrap">
          <div class="grid-layout">
            <section class="formulario-intervencion">
              <h3>Nueva Intervencion</h3>
              <form [formGroup]="nuevaIntervencionForm" (ngSubmit)="guardarIntervencion()">
                <select class="tramite-sel" formControlName="tipoTramite">
                  <option value="">-- Seleccionar intervencion --</option>
                  <option value="Legalizacion">Legalizacion</option>
                  <option value="Licencia de Obras">Licencia de Obras</option>
                  <option value="CE Previo">CE Previo</option>
                  <option value="CE Post">CE Post</option>
                </select>
                <input type="text" class="tramite-sel" formControlName="detalleSeguimiento" placeholder="Descripcion opcional...">
                <button type="submit" class="btn-add" [disabled]="nuevaIntervencionForm.invalid">Anadir a ventas</button>
              </form>
            </section>
            <section class="panel-ventas-pendientes">
              <h3>Ventas Pendientes</h3>
              <div class="tramites-scroll-container">
                <p *ngIf="ventas.length === 0" class="ventas-empty">No hay ventas pendientes.</p>
                <div *ngFor="let t of ventas" class="venta-row">
                  <div class="map-col">
                    <span class="map-data">{{ t.tipoTramite }}</span>
                  </div>
                  <div class="map-col">
                    <span class="map-data map-data-fecha">{{ (t.fechaCreacion || t.fechaSeguimiento) ? ((t.fechaCreacion || t.fechaSeguimiento) | date:'dd/MM/yyyy') : '—' }}</span>
                  </div>
                  <div class="map-col">
                    <span class="status-badge pendiente">Pendiente</span>
                  </div>
                  <div class="venta-actions">
                    <button type="button" class="btn-primary btn-generar" (click)="generarIntervencion(t)">Generar</button>
                  </div>
                </div>
              </div>
            </section>
          </div>
          </div>



          <div class="panel-section panel-section-full mapa-visual-wrap">
            <h3>Mapa Visual de Intervenciones Activas / Finalizadas</h3>
            <div class="tramites-scroll-container">
              <p *ngIf="activas.length === 0" class="ventas-empty">No hay intervenciones activas.</p>
              <div *ngFor="let ta of activas" class="intervencion-map-row clickable"
                   (click)="irADetalle(ta)">
                <div class="map-col">
                  <span class="map-label">Intervencion</span>
                  <span class="map-data map-data-accent">#{{ ta.idTramite }} - {{ ta.tipoTramite }}</span>
                </div>
                <div class="map-col">
                  <span class="map-label">Descripcion</span>
                  <span class="map-data map-data-sm" [title]="ta.detalleSeguimiento || ''">{{ ta.detalleSeguimiento || '---' }}</span>
                </div>
                <div class="map-col">
                  <span class="map-label">Estado</span>
                  <span class="status-badge" [ngClass]="ta.estado?.toLowerCase()?.replace(' ', '-')">{{ ta.estado }}</span>
                </div>
                <div class="map-col">
                  <span class="map-label">F. Inicio</span>
                  <span class="map-data">{{ (ta.fechaCreacion || ta.fechaSeguimiento) ? ((ta.fechaCreacion || ta.fechaSeguimiento) | date:'dd/MM/yyyy') : '---' }}</span>
                </div>
                <div class="map-col">
                  <span class="map-label">F. Fin (Real/Prev.)</span>
                  <span class="map-data" [class.map-data-fin]="ta.estado === 'Terminado'">{{ (ta.fechaEjecucion || ta.fechaSeguimiento) ? ((ta.fechaEjecucion || ta.fechaSeguimiento) | date:'dd/MM/yyyy') : '---' }}</span>
                </div>
                <div class="map-col">
                  <span class="map-label">Ult. Modificador</span>
                  <span class="map-data map-data-sm">{{ ta.tecnicoAsignado || 'N/A' }}</span>
                </div>
                <div class="map-actions">
                  <span class="map-link-icon">Ver</span>
                </div>
              </div>
            </div>
          </div>

          <div class="panel-section panel-section-full">
            <h3>Observaciones del Contrato</h3>
            <form [formGroup]="obsForm" (ngSubmit)="guardarObservaciones()">
              <textarea formControlName="observaciones" placeholder="Escriba notas generales..."></textarea>
              <button type="submit" class="btn-save-obs">Actualizar Notas</button>
            </form>
          </div>
          <div class="panel-section panel-section-full">
            <h3>Documentación del Contrato</h3>
            <app-file-uploader 
                *ngIf="contrato.idContrato" 
                [referenceId]="contrato.idContrato" 
                entityType="CONTRATO">
            </app-file-uploader>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .main-container { max-width: 98%; width: 100%; margin: 0 auto; padding: 1rem; box-sizing: border-box; }
    .user-stamp {
      text-align: right; font-size: 0.75rem; color: #64748b; margin-bottom: 15px;
      background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; float: right;
    }
    .gestion-container {
      clear: both; margin-top: 20px; background: white; width: 100%; max-width: 98%;
      border-radius: 20px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); border-top: 8px solid #1e293b;
      overflow: hidden; margin-bottom: 50px;
    }
    .info-header {
      display: none;
    }
    .info-header p { margin: 0; opacity: 0.8; font-size: 0.9rem; }
    .contract-dates {
      margin-top: 6px;
      display: flex;
      gap: 16px;
      font-size: 0.8rem;
      opacity: 0.9;
    }
    .header-badge-wrap { text-align: right; }
    .header-label { font-size: 0.7rem; font-weight: bold; opacity: 0.8; display: block; margin-bottom: 5px; }
    .badge-tipo {
      background: #f1c40f; color: #1e293b; padding: 4px 12px; border-radius: 6px;
      font-weight: 800; font-size: 0.8rem; text-transform: uppercase;
    }
    .panel-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 25px;
      padding: 1rem;
      width: 100%;
      box-sizing: border-box;
    }
    .panel-section {
      background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 15px;
    }
    .panel-section-full { grid-column: span 2; border-top: 4px solid #f1c40f; }

    .grid-layout-wrap { grid-column: span 2; }
    .grid-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      width: 100%;
    }
    .formulario-intervencion {
      background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 15px;
    }
    .formulario-intervencion h3 {
      margin-bottom: 15px; color: #1e293b; font-size: 0.85rem; text-transform: uppercase;
      border-bottom: 2px solid #f1c40f; padding-bottom: 5px; display: inline-block;
    }
    .panel-ventas-pendientes {
      background: #fee2e2; border: 1px solid #fecaca; padding: 20px; border-radius: 15px;
      max-height: 600px;
      overflow-y: auto;
    }
    .panel-ventas-pendientes::-webkit-scrollbar { width: 6px; }
    .panel-ventas-pendientes::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    .panel-ventas-pendientes h3 {
      margin-bottom: 15px; color: #1e293b; font-size: 0.85rem; text-transform: uppercase;
      border-bottom: 2px solid #f1c40f; padding-bottom: 5px; display: inline-block;
    }
    .panel-section h3 {
      margin-bottom: 15px; color: #1e293b; font-size: 0.85rem; text-transform: uppercase;
      border-bottom: 2px solid #f1c40f; padding-bottom: 5px; display: inline-block;
    }
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .filter-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-right: 6px;
    }
    .filter-chip {
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #1e293b;
      padding: 6px 12px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.75rem;
      cursor: pointer;
    }
    .filter-chip.active {
      background: #1e293b;
      color: #f8fafc;
      border-color: #1e293b;
    }
    .intervencion-row {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .data-row { margin-bottom: 10px; display: flex; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    .data-label { font-weight: 700; color: #64748b; font-size: 0.8rem; text-transform: uppercase; width: 140px; flex-shrink: 0; }
    .data-value { color: #1e293b; font-size: 0.95rem; font-weight: 600; }
    .direct-link { color: #3498db; text-decoration: none; font-weight: 700; border-bottom: 1px dashed #3498db; }
    .direct-link:hover { color: #1e293b; }

    .tramite-sel {
      width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1;
      margin-bottom: 12px; font-weight: 600; box-sizing: border-box;
    }
    .tramite-sel + .tramite-sel { margin-top: -5px; }
    .btn-add {
      background: #1e293b; color: white; border: none; padding: 12px; border-radius: 10px;
      font-weight: bold; width: 100%; cursor: pointer; transition: 0.2s;
    }
    .btn-add:disabled { opacity: 0.6; cursor: not-allowed; }

    .panel-ventas-pendientes .tramites-scroll-container {
      max-height: none; overflow-y: visible; padding-right: 0;
    }
    .tramites-scroll-container {
      max-height: 400px; overflow-y: auto; padding-right: 10px;
    }
    .tramites-scroll-container::-webkit-scrollbar { width: 6px; }
    .tramites-scroll-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    .ventas-empty { text-align: center; color: #94a3b8; font-size: 0.8rem; margin: 0; padding: 20px 0; }

    .venta-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr;
      align-items: center;
      padding: 10px 15px;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      margin-bottom: 8px;
      gap: 15px;
    }
    .venta-row .map-data { color: #b91c1c; font-size: 0.85rem; font-weight: 700; }
    .venta-row .map-data-fecha { font-size: 0.75rem; color: #991b1b; }
    .map-col { display: flex; flex-direction: column; overflow: hidden; }
    .map-label { font-size: 0.6rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px; }
    .map-data { font-size: 0.85rem; font-weight: 700; color: #1e293b; }
    .map-data-accent { color: #0369a1; }
    .map-data-sm { font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }

    .status-badge {
      padding: 4px 10px; border-radius: 5px; font-size: 0.7rem; font-weight: 800;
      text-transform: uppercase; text-align: center; border: 1px solid transparent;
    }
    .status-badge.pendiente { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }
    .status-badge.en-proceso { background: #ffedd5; color: #c2410c; border-color: #fed7aa; }
    .status-badge.terminado { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
    .status-badge.activo { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
    .status-badge.anulado { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }

    .venta-actions { display: flex; justify-content: center; align-items: center; gap: 8px; }
    .btn-primary {
      padding: 6px 12px; font-size: 0.7rem; font-weight: bold; border-radius: 5px;
      text-decoration: none; text-align: center; cursor: pointer; border: none;
    }
    .btn-gestionar, .btn-generar { background: #f1c40f; color: #1e293b; }
    .btn-icon { background: #1e293b; color: white; padding: 8px 12px; }

    .mapa-visual-wrap { border-top: 4px solid #f1c40f; width: 100%; }
    .intervencion-map-row {
      display: grid; grid-template-columns: 1.2fr 1.5fr 0.8fr 1fr 1fr 1fr 0.8fr;
      align-items: center; padding: 15px; background: white; border: 1px solid #e2e8f0;
      border-radius: 12px; margin-bottom: 12px; gap: 15px; transition: 0.3s;
    }
    .intervencion-map-row:hover {
      border-color: #f1c40f; transform: translateX(5px); box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .map-data-fin { color: #059669; font-weight: 800; }
    .map-actions { display: flex; gap: 8px; justify-content: flex-end; align-items: center; }
    .intervencion-map-row.clickable { cursor: pointer; }
    .intervencion-map-row.clickable:hover { border-color: #f1c40f; background: #fffbeb; }
    .map-link-icon { color: #1e293b; font-weight: 800; font-size: 1rem; }

    textarea {
      width: 100%; min-height: 120px; padding: 15px; border-radius: 10px;
      border: 1px solid #cbd5e1; resize: vertical; font-family: inherit; margin-bottom: 15px; box-sizing: border-box;
    }
    .btn-save-obs {
      background: #1e293b; color: white; border: none; padding: 15px; border-radius: 10px;
      font-weight: 800; width: 100%; cursor: pointer; text-transform: uppercase; transition: 0.3s;
    }

    @media (max-width: 768px) {
      .main-container {
        padding: 0.5rem;
      }

      .info-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        padding: 18px 16px;
      }

      .header-badge-wrap {
        text-align: left;
      }

      .panel-grid {
        grid-template-columns: 1fr;
        padding: 0.75rem;
        gap: 16px;
      }

      .panel-section-full,
      .grid-layout-wrap {
        grid-column: span 1;
      }

      .grid-layout {
        grid-template-columns: 1fr;
      }

      .filter-bar {
        flex-wrap: wrap;
        padding: 10px 12px;
      }

      .data-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }

      .data-label {
        width: auto;
      }

      .venta-row {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .intervencion-map-row {
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .map-actions {
        justify-content: flex-start;
      }

      .map-data-sm {
        max-width: none;
        white-space: normal;
      }

      .panel-ventas-pendientes {
        max-height: none;
      }
    }
  `],
})
export class ContratoFichaViewComponent implements OnInit {
  contrato: Contrato | null = null;
  ventas: Tramite[] = [];
  activas: Tramite[] = [];
  allTramites: Tramite[] = [];
  filtroTipo: 'todos' | 'mantenimiento' | 'otros' = 'todos';


  nuevaIntervencionForm: FormGroup;
  obsForm: FormGroup;

  constructor(
    private contratos: ContratoService,
    private tramites: TramiteService,

    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.nuevaIntervencionForm = this.fb.group({
      tipoTramite: ['', Validators.required],
      detalleSeguimiento: ['']
    });
    this.obsForm = this.fb.group({
      observaciones: ['']
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (!id || isNaN(id)) return;
      this.cargarContrato(id);
      this.cargarDatos(id);
    });
  }

  cargarContrato(id: number) {
    this.contratos.getById(id).subscribe(c => {
      this.contrato = c;
      this.obsForm.patchValue({ observaciones: c.observaciones || '' });
    });
  }

  cargarDatos(idContrato: number) {
    this.contratos.getTramitesPorContrato(idContrato).subscribe({
      next: (lista) => {
        const all = Array.isArray(lista) ? lista : [];
        this.allTramites = all;
        this.aplicarFiltros();

      },
      error: (err) => {
        console.error('Error al cargar tramites por contrato', err?.status, err?.error);
      }
    });
  }

  setFiltro(tipo: 'todos' | 'mantenimiento' | 'otros') {
    this.filtroTipo = tipo;
    this.aplicarFiltros();
  }

  private aplicarFiltros() {
    const e = (s: string | undefined) => (s || '').trim().toLowerCase();
    let list = this.allTramites;
    if (this.filtroTipo === 'mantenimiento') {
      list = list.filter(t => e(t.tipoTramite) === 'mantenimiento');
    } else if (this.filtroTipo === 'otros') {
      list = list.filter(t => e(t.tipoTramite) !== 'mantenimiento');
    }
    this.ventas = list.filter(t => e(t.estado) === 'pendiente');
    this.activas = list.filter(t => {
      const est = e(t.estado);
      return est === 'en proceso' || est === 'terminado' || est === 'anulado';
    });
  }



  guardarIntervencion() {
    if (!this.contrato || this.nuevaIntervencionForm.invalid) {
      Swal.fire('Datos incompletos', 'Debes seleccionar un tipo de intervencion.', 'warning');
      return;
    }
    const id = this.contrato.idContrato!;
    const { tipoTramite, detalleSeguimiento } = this.nuevaIntervencionForm.value;
    const datos = { tipoTramite, detalleSeguimiento: detalleSeguimiento || undefined };

    this.contratos.addIntervencion(id, datos).subscribe({
      next: () => {
        this.cargarDatos(id);
        this.nuevaIntervencionForm.reset();
        this.nuevaIntervencionForm.patchValue({ tipoTramite: '' });
        Swal.fire('Anadido a ventas', 'La intervencion se ha creado y aparece en Ventas Pendientes.', 'success');
      },
      error: (err) => {
        console.error('Error al anadir a ventas', err);
        Swal.fire('Error', err?.error?.message || 'No se pudo anadir a ventas. Revisa la consola.', 'error');
      }
    });
  }

  irADetalle(ta: Tramite) {
    if (ta?.idTramite == null) return;
    this.router.navigate(['/tramite-detalle', ta.idTramite]);
  }

  generarIntervencion(t: Tramite) {
    if (!this.contrato || !t.idTramite) return;
    const idContrato = this.contrato.idContrato!;
    this.tramites.generar(t.idTramite).subscribe({
      next: () => {
        this.cargarDatos(idContrato);
        Swal.fire('Generado', 'La intervencion ya aparece en el Mapa Visual.', 'success');
      },
      error: (err) => {
        console.error('Error al generar', err);
        const msg = typeof err?.error === 'string' ? err.error : (err?.error?.message ?? err?.message ?? 'No se pudo generar la intervencion.');
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  guardarObservaciones() {
    if (!this.contrato) return;
    const obs = this.obsForm.value.observaciones;
    this.contratos.getById(this.contrato.idContrato!).subscribe(actual => {
      const body: Record<string, unknown> = {
        idCliente: actual.cliente?.idCliente,
        idLocal: actual.local?.idLocal,
        fechaInicio: actual.fechaInicio,
        fechaVencimiento: actual.fechaVencimiento,
        tipoContrato: actual.tipoContrato,
        cePrevio: actual.cePrevio,
        cePost: actual.cePost,
        enviadoCeePost: actual.enviadoCeePost,
        licenciaObras: actual.licenciaObras,
        mtd: actual.mtd,
        planos: actual.planos,
        subvencionEstado: actual.subvencionEstado,
        libroEdifIncluido: actual.libroEdifIncluido,
        estado: actual.estado,
        observaciones: obs
      };
      this.contratos.update(actual.idContrato!, body).subscribe(() => {
        Swal.fire('Actualizado', 'Observaciones guardadas', 'success');
      });
    });
  }
}
