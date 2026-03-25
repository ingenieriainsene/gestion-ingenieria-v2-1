import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PresupuestoService, PresupuestoDTO } from '../../services/presupuesto.service';
import { ClienteService, LocalService, Cliente, Local } from '../../services/domain.services';
import { MantenimientoPreventivoService } from '../../services/mantenimiento-preventivo.service';
import { AuditStampComponent } from '../../layout/audit-stamp.component';
import Swal from 'sweetalert2';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-presupuesto-ficha-view',
  standalone: true,
  imports: [CommonModule, RouterLink, AuditStampComponent, FormsModule],
  template: `
    <div class="ficha-top">
      <a routerLink="/presupuestos" class="direct-link">&larr; Volver al listado</a>
    </div>
    <app-audit-stamp [data]="presupuesto"></app-audit-stamp>

    <div *ngIf="loading" class="ficha-loading">Cargando…</div>

    <div *ngIf="!loading && presupuesto" class="ficha-container">
      <div class="header-section">
        <h1>FICHA PRESUPUESTO #{{ presupuesto.idPresupuesto }} <span class="badge-contador">{{ presupuesto.tipoPresupuesto || 'Obra' }}</span></h1>
        <div class="ficha-actions">
          <span class="link-archivos link-disabled" title="Código de referencia">
            {{ presupuesto.codigoReferencia || 'Sin referencia' }}
          </span>
          <button type="button" class="link-archivos" style="background:none;border:none;padding:0;cursor:pointer;margin-right:10px;" (click)="verPdf('simple')">📄 PDF con Capítulo</button>
          <button type="button" class="link-archivos" style="background:none;border:none;padding:0;cursor:pointer;margin-right:10px;" (click)="verPdf('detallado')">📑 PDF con Capítulo + Partida</button>
          <a [routerLink]="['/presupuestos', presupuesto.idPresupuesto, 'editar']" class="link-editar">✏️ Editar</a>
          <button type="button" class="link-archivos" style="background:none;border:none;padding:0;cursor:pointer;" (click)="eliminar()">🗑️ Eliminar</button>
          <a routerLink="/presupuestos" class="link-volver">Volver</a>
        </div>
      </div>

      <div class="summary-header">
        <div class="summary-main">
          <div class="summary-item">
            <span class="summary-label">Cliente</span>
            <span class="summary-value">
              <a [routerLink]="['/clientes', presupuesto.clienteId]" class="ficha-link">
                {{ clienteNombre || ('ID ' + presupuesto.clienteId) }}
              </a>
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Vivienda</span>
            <span class="summary-value">
              <a [routerLink]="['/locales', presupuesto.viviendaId]" class="ficha-link">
                {{ viviendaDireccion || ('ID ' + presupuesto.viviendaId) }}
              </a>
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Fecha</span>
            <span class="summary-value">{{ presupuesto.fecha | date:'dd/MM/yyyy' }}</span>
          </div>
          <div class="summary-item status-item" [class.loading]="actualizandoEstado">
            <span class="summary-label">Estado</span>
            <div class="status-selector-wrap">
              <select 
                [ngModel]="presupuesto.estado" 
                (ngModelChange)="cambiarEstado($event)"
                class="status-select-compact"
                [disabled]="actualizandoEstado"
              >
                <option *ngFor="let st of estados" [value]="st">{{ st }}</option>
              </select>
              <span *ngIf="actualizandoEstado" class="spinner-mini"></span>
            </div>
          </div>
        </div>
        
        <div class="summary-financials">
          <div class="financial-item">
            <span class="financial-label">Sin IVA</span>
            <span class="financial-value">{{ totalSinIva | number:'1.2-2' }} €</span>
          </div>
          <div class="financial-item">
            <span class="financial-label">IVA</span>
            <span class="financial-value">{{ totalIva | number:'1.2-2' }} €</span>
          </div>
          <div class="financial-item total-highlight">
            <span class="financial-label">TOTAL</span>
            <span class="financial-value">{{ totalConIva | number:'1.2-2' }} €</span>
          </div>
        </div>
      </div>

      <div class="description-section clickable" (click)="editarDescripcion()">
        <div class="description-label">
          DESCRIPCIÓN DEL PRESUPUESTO
          <span class="edit-hint">✏️ Clic para editar</span>
        </div>
        <div class="description-text" [class.empty-placeholder]="!presupuesto.descripcion">
          {{ presupuesto.descripcion || 'Haz clic aquí para añadir una descripción detallada al presupuesto...' }}
        </div>
      </div>

      <div class="compact-extra-info" *ngIf="presupuesto.estado === 'Aceptado'">
        <div class="extra-item">
          <strong>Fecha Aceptación:</strong> {{ (presupuesto.fechaAceptacion) ? (presupuesto.fechaAceptacion | date:'dd/MM/yyyy HH:mm') : 'Pendiente' }}
        </div>
        <div class="extra-item">
          <strong>Validez:</strong> {{ presupuesto.diasValidez ? (presupuesto.diasValidez + ' días') : 'No def.' }}
        </div>
      </div>

      <div class="info-card-grid" *ngIf="presupuesto.estado === 'Aceptado'">
        <div class="info-card info-card-wide">
          <h3>Generar contrato</h3>
          <p *ngIf="presupuesto.tipoPresupuesto === 'Preventivo'">
            Este presupuesto preventivo está aceptado. Continuaremos con la planificación de intervenciones.
          </p>
          <p *ngIf="presupuesto.tipoPresupuesto !== 'Preventivo'">
            Este presupuesto está aceptado. ¿Deseas generar un contrato ahora?
          </p>
          <div class="cta-actions">
            <button type="button" class="btn-primary" (click)="generarContrato()">Continuar</button>
          </div>
        </div>
      </div>

      <section class="ficha-section">
        <div class="section-header">
          <h2>📋 Capítulos y partidas</h2>
        </div>
        <div class="table-wrap">
          <table class="ficha-table table-card">
            <thead>
              <tr>
                <th>CÓDIGO</th>
                <th>CONCEPTO</th>
                <th style="text-align:right;">CANT.</th>
                <th style="text-align:right;">P. COSTE</th>
                <th style="text-align:right;">TOT. COSTE</th>
                <th style="text-align:right;">MARGEN</th>
                <th style="text-align:right;">TOT. PVP</th>
                <th style="text-align:right;" *ngIf="presupuesto.tipoPresupuesto === 'Preventivo'">VISITAS</th>
                <th style="text-align:right;">% IVA</th>
                <th style="text-align:right;">IMP. IVA</th>
                <th style="text-align:right;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let cap of presupuesto.lineas; let i = index">
                <tr class="row-capitulo">
                  <td data-label="Código">{{ cap.codigoVisual || '—' }}</td>
                  <td data-label="Concepto">
                    <button type="button" class="toggle-btn" (click)="toggleCapitulo(i)">
                      {{ collapsed[i] ? '▶' : '▼' }}
                    </button>
                    {{ cap.concepto || '—' }}
                  </td>
                  <td data-label="Cant." style="text-align:right;">—</td>
                  <td data-label="P. coste" style="text-align:right;">—</td>
                  <td data-label="Tot. coste" style="text-align:right;">{{ getCapituloTotalCoste(cap) | number:'1.2-2' }} €</td>
                  <td data-label="Margen" style="text-align:right;">—</td>
                  <td data-label="Tot. PVP" style="text-align:right;">{{ getCapituloTotalPvp(cap) | number:'1.2-2' }} €</td>
                  <td data-label="Visitas" style="text-align:right;" *ngIf="presupuesto.tipoPresupuesto === 'Preventivo'">—</td>
                  <td data-label="% IVA" style="text-align:right;">—</td>
                  <td data-label="Imp. IVA" style="text-align:right;">{{ getCapituloImporteIva(cap) | number:'1.2-2' }} €</td>
                  <td data-label="Total" style="text-align:right;">{{ getCapituloTotalFinal(cap) | number:'1.2-2' }} €</td>
                </tr>
                <tr *ngFor="let l of cap.hijos || []" class="row-partida" [class.hidden]="collapsed[i]">
                  <td data-label="Código" class="indent">{{ l.codigoVisual || '—' }}</td>
                  <td data-label="Concepto">{{ l.concepto || '—' }}</td>
                  <td data-label="Cant." style="text-align:right;">{{ l.cantidad | number:'1.2-2' }}</td>
                  <td data-label="P. coste" style="text-align:right;">{{ l.costeUnitario | number:'1.2-2' }} €</td>
                  <td data-label="Tot. coste" style="text-align:right;">{{ getPartidaTotalCoste(l) | number:'1.2-2' }} €</td>
                  <td data-label="Margen" style="text-align:right;">{{ l.factorMargen | number:'1.2-2' }}</td>
                  <td data-label="Tot. PVP" style="text-align:right;">{{ getPartidaTotalPvp(l) | number:'1.2-2' }} €</td>
                  <td data-label="Visitas" style="text-align:right;" *ngIf="presupuesto.tipoPresupuesto === 'Preventivo'">{{ l.numVisitas || 0 }}</td>
                  <td data-label="% IVA" style="text-align:right;">{{ l.ivaPorcentaje ?? 21 }}</td>
                  <td data-label="Imp. IVA" style="text-align:right;">{{ getPartidaImporteIva(l) | number:'1.2-2' }} €</td>
                  <td data-label="Total" style="text-align:right;">{{ getPartidaTotalFinal(l) | number:'1.2-2' }} €</td>
                </tr>
              </ng-container>
              <tr *ngIf="presupuesto.lineas.length === 0">
                <td colspan="10" class="empty-cell">No hay líneas registradas.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <div *ngIf="!loading && !presupuesto" class="ficha-missing">
      <p>Presupuesto no encontrado.</p>
      <a routerLink="/presupuestos" class="direct-link">Volver al listado</a>
    </div>
  `,
  styleUrls: ['../clientes/cliente-ficha-view.component.css'],
  styles: [`
    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      padding: 15px 35px;
      background: #fdfdfd;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 10px;
    }
    .summary-main {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      flex: 1;
    }
    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .summary-label {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      font-weight: 700;
    }
    .summary-value {
      font-size: 0.95rem;
      font-weight: 700;
      color: #334155;
    }
    .status-selector-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .status-select-compact {
      padding: 4px 28px 4px 10px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      font-size: 0.85rem;
      font-weight: 700;
      color: #1e293b;
      cursor: pointer;
      outline: none;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 6px center;
      background-size: 14px;
    }
    .summary-financials {
      display: flex;
      gap: 20px;
      background: #f1f5f9;
      padding: 10px 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .financial-item {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
    }
    .financial-label {
      font-size: 0.6rem;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 700;
    }
    .financial-value {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0f172a;
    }
    .total-highlight .financial-value {
      color: #2563eb;
    }
    .compact-extra-info {
      display: flex;
      gap: 20px;
      padding: 0 35px 15px;
      font-size: 0.85rem;
      color: #64748b;
    }
    .extra-item strong {
      color: #475569;
    }
    .description-section {
      padding: 15px 35px;
      background: #fff;
      border-bottom: 1px solid #f1f5f9;
      margin-bottom: 15px;
    }
    .description-label {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .description-text {
      font-size: 0.95rem;
      color: #334155;
      line-height: 1.5;
      white-space: pre-wrap;
    }
    .description-section.clickable {
      cursor: pointer;
      border: 1px solid transparent;
      border-radius: 8px;
      transition: all 0.2s;
    }
    .description-section.clickable:hover {
      background: #f8fafc;
      border-color: #3b82f6;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .edit-hint {
      font-size: 0.6rem;
      color: #3b82f6;
      margin-left: 10px;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .description-section.clickable:hover .edit-hint {
      opacity: 1;
    }
    .empty-placeholder {
      font-style: italic;
      color: #94a3b8;
    }
    .spinner-mini {
      width: 14px;
      height: 14px;
      border: 2px solid #e2e8f0;
      border-top-color: #3498db;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .status-item.loading {
      opacity: 0.8;
    }
    .ficha-link {
      color: #2563eb;
      text-decoration: none;
      transition: color 0.2s;
    }
    .ficha-link:hover {
      color: #1d4ed8;
      text-decoration: underline;
    }
  `]
})
export class PresupuestoFichaViewComponent implements OnInit {
  presupuesto: PresupuestoDTO | null = null;
  loading = true;
  clienteNombre: string | null = null;
  viviendaDireccion: string | null = null;
  totalSinIva = 0;
  totalIva = 0;
  totalConIva = 0;
  collapsed: boolean[] = [];
  estados = ['Borrador', 'Estudio', 'Enviado', 'Aceptado', 'Rechazado', 'Pagado'];
  actualizandoEstado = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: PresupuestoService,
    private clienteService: ClienteService,
    private localService: LocalService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id || id === 'nuevo') {
        this.router.navigate(['/presupuestos']);
        return;
      }
      this.cargar(+id);
    });
  }

  private cargar(id: number): void {
    this.loading = true;
    this.service.getById(id).subscribe({
      next: (p) => {
        this.presupuesto = p;
        if (this.presupuesto && !this.presupuesto.lineas) {
          this.presupuesto.lineas = [];
        }
        this.collapsed = (p.lineas || []).map(() => false);
        this.recalcularTotales();
        this.loading = false;
        this.loadClienteLocal(p.clienteId, p.viviendaId);
      },
      error: () => {
        this.loading = false;
        this.presupuesto = null;
      }
    });
  }

  private loadClienteLocal(clienteId: number, viviendaId: number): void {
    this.clienteService.getById(clienteId).subscribe({
      next: (c: Cliente) => {
        const nombre = `${c.nombre} ${c.apellido1}${c.apellido2 ? ' ' + c.apellido2 : ''}`.trim();
        this.clienteNombre = nombre || null;
      },
      error: () => { }
    });
    this.localService.getById(viviendaId).subscribe({
      next: (l: Local) => {
        this.viviendaDireccion = l.direccionCompleta || null;
      },
      error: () => { }
    });
  }

  async cambiarEstado(nuevoEstado: string): Promise<void> {
    if (!this.presupuesto?.idPresupuesto || this.actualizandoEstado) return;
    if (this.presupuesto.estado === nuevoEstado) return;

    let diasValidez: number | undefined = undefined;

    if (nuevoEstado === 'Aceptado') {
      const { value: selectedDate } = await Swal.fire({
        title: 'Fecha de Validez',
        html: `
          <p>El presupuesto se marcará como <strong>Aceptado</strong> hoy.</p>
          <p>Por favor, selecciona hasta qué fecha es válido:</p>
          <input type="date" id="swal-fecha-validez" class="swal2-input" 
                 value="${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}">
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Confirmar Aceptación',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#1e293b',
        preConfirm: () => {
          const input = document.getElementById('swal-fecha-validez') as HTMLInputElement;
          if (!input.value) {
            Swal.showValidationMessage('Debes seleccionar una fecha de validez');
            return false;
          }
          return input.value;
        }
      });

      if (!selectedDate) return; // Usuario canceló

      // Calcular diferencia en días
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const validez = new Date(selectedDate);
      validez.setHours(0, 0, 0, 0);

      const diffTime = validez.getTime() - hoy.getTime();
      diasValidez = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diasValidez < 0) {
        Swal.fire('Error', 'La fecha de validez no puede ser anterior a hoy', 'error');
        return;
      }
    }

    this.actualizandoEstado = true;
    this.service.patchEstado(this.presupuesto.idPresupuesto, nuevoEstado, diasValidez).subscribe({
      next: (p) => {
        this.presupuesto = p;
        this.recalcularTotales();
        this.actualizandoEstado = false;
        Swal.fire({
          title: 'Estado actualizado',
          text: `El presupuesto ha pasado a estado: ${nuevoEstado}${diasValidez !== undefined ? ' con ' + diasValidez + ' días de validez' : ''}`,
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      },
      error: (e) => {
        this.actualizandoEstado = false;
        let msg = 'No se pudo actualizar el estado.';
        if (typeof e?.error === 'string') msg = e.error;
        else if (e?.error?.message) msg = e.error.message;
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  async editarDescripcion(): Promise<void> {
    if (!this.presupuesto?.idPresupuesto) return;
    
    const { value: text } = await Swal.fire({
      title: 'Descripción del presupuesto',
      input: 'textarea',
      inputLabel: 'Introduce la descripción técnica o detalles adicionales del proyecto',
      inputValue: this.presupuesto.descripcion || '',
      inputPlaceholder: 'Ej: Instalación fotovoltaica 5kW con inversor Huawei...',
      showCancelButton: true,
      confirmButtonText: 'Guardar cambios',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1e293b',
      inputAttributes: {
        'rows': '5'
      }
    });

    if (text !== undefined) {
      this.actualizandoEstado = true; // Reusing spinner logic if you want
      const payload: PresupuestoDTO = { ...this.presupuesto, descripcion: text };
      this.service.updateBudget(this.presupuesto.idPresupuesto, payload).subscribe({
        next: (res) => {
          this.presupuesto = res;
          this.actualizandoEstado = false;
          Swal.fire({
            title: 'Descripción guardada',
            icon: 'success',
            toast: true,
            position: 'top-end',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: () => {
          this.actualizandoEstado = false;
          Swal.fire('Error', 'No se pudo guardar la descripción. Por favor, inténtalo de nuevo.', 'error');
        }
      });
    }
  }

  eliminar(): void {
    if (!this.presupuesto?.idPresupuesto) return;
    Swal.fire({
      title: '¿Eliminar presupuesto?',
      text: `¿Seguro que deseas eliminar ${this.presupuesto.codigoReferencia || ('#' + this.presupuesto.idPresupuesto)}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e293b',
      cancelButtonText: 'Cancelar',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.service.deleteBudget(this.presupuesto!.idPresupuesto!).subscribe({
        next: () => {
          Swal.fire('Eliminado', 'Presupuesto borrado correctamente.', 'success')
            .then(() => this.router.navigate(['/presupuestos']));
        },
        error: () => {
          Swal.fire('Error', 'No se pudo eliminar el presupuesto.', 'error');
        }
      });
    });
  }

  generarContrato(): void {
    if (!this.presupuesto?.idPresupuesto) return;

    Swal.fire({
      title: '¿Generar contrato automático?',
      text: `Se creará el contrato y la venta pendiente (${this.presupuesto.tipoPresupuesto || 'Obra'}) automáticamente.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, generar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1e293b',
    }).then((res) => {
      if (!res.isConfirmed) return;

      this.loading = true;
      this.service.convertirAContrato(this.presupuesto!.idPresupuesto!).subscribe({
        next: (contratoId) => {
          this.loading = false;
          Swal.fire({
            title: '¡Contrato y Venta generados!',
            text: 'El contrato se ha creado correctamente y la intervención ya está disponible en "Ventas Pendientes".',
            icon: 'success',
            confirmButtonText: 'Ir al Contrato',
            confirmButtonColor: '#1e293b',
          }).then(() => {
            this.router.navigate(['/contratos', contratoId]);
          });
        },
        error: (e) => {
          this.loading = false;
          let msg = 'No se pudo generar el contrato automático.';
          if (typeof e?.error === 'string') msg = e.error;
          else if (e?.error?.message) msg = e.error.message;
          Swal.fire('Error', msg, 'error');
        },
      });
    });
  }


  toggleCapitulo(index: number): void {
    this.collapsed[index] = !this.collapsed[index];
  }

  getLineaTotalConIva(linea: any): number {
    const totalFinal = Number(linea?.totalFinal);
    if (!Number.isNaN(totalFinal) && totalFinal > 0) return this.round2(totalFinal);
    const totalPvp = this.getLineaBase(linea);
    const iva = Number(linea?.ivaPorcentaje ?? 21);
    const conIva = totalPvp + totalPvp * (iva / 100);
    return this.round2(conIva);
  }

  getCapituloTotalConIva(capitulo: any): number {
    const hijos = capitulo?.hijos || [];
    if (!hijos.length) {
      return this.round2(this.getLineaTotalConIva(capitulo));
    }
    let total = 0;
    for (const l of hijos) {
      total += this.getLineaTotalConIva(l);
    }
    return this.round2(total);
  }

  getCapituloTotalCoste(capitulo: any): number {
    const hijos = capitulo?.hijos || [];
    if (!hijos.length) return this.calcPartidaValues(capitulo).totalCoste;
    return this.round2(hijos.reduce((acc: number, l: any) => acc + this.calcPartidaValues(l).totalCoste, 0));
  }

  getCapituloTotalPvp(capitulo: any): number {
    const hijos = capitulo?.hijos || [];
    if (!hijos.length) return this.calcPartidaValues(capitulo).totalPvp;
    return this.round2(hijos.reduce((acc: number, l: any) => acc + this.calcPartidaValues(l).totalPvp, 0));
  }

  getCapituloImporteIva(capitulo: any): number {
    const hijos = capitulo?.hijos || [];
    if (!hijos.length) return this.calcPartidaValues(capitulo).importeIva;
    return this.round2(hijos.reduce((acc: number, l: any) => acc + this.calcPartidaValues(l).importeIva, 0));
  }

  getCapituloTotalFinal(capitulo: any): number {
    const hijos = capitulo?.hijos || [];
    if (!hijos.length) return this.calcPartidaValues(capitulo).totalFinal;
    return this.round2(hijos.reduce((acc: number, l: any) => acc + this.calcPartidaValues(l).totalFinal, 0));
  }

  getPartidaTotalCoste(linea: any): number {
    return this.calcPartidaValues(linea).totalCoste;
  }

  getPartidaTotalPvp(linea: any): number {
    return this.calcPartidaValues(linea).totalPvp;
  }

  getPartidaImporteIva(linea: any): number {
    return this.calcPartidaValues(linea).importeIva;
  }

  getPartidaTotalFinal(linea: any): number {
    return this.calcPartidaValues(linea).totalFinal;
  }

  verPdf(type: 'simple' | 'detallado' = 'simple'): void {
    if (!this.presupuesto?.idPresupuesto) return;
    this.service.downloadPdf(this.presupuesto.idPresupuesto, type).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: () => {
        Swal.fire('Error', 'No se pudo generar la vista previa del PDF.', 'error');
      }
    });
  }

  private async guardarBlobConDialogo(blob: Blob, filename: string): Promise<void> {
    const w = window as any;
    const safeName = (filename || 'documento.pdf').trim();

    if (typeof w.showSaveFilePicker === 'function') {
      try {
        const handle = await w.showSaveFilePicker({
          suggestedName: safeName,
          types: [{ description: 'Documento PDF', accept: { 'application/pdf': ['.pdf'] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeName;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private recalcularTotales(): void {
    if (!this.presupuesto) {
      this.totalSinIva = 0;
      this.totalIva = 0;
      this.totalConIva = 0;
      return;
    }
    let base = 0;
    let conIva = 0;
    for (const cap of this.presupuesto.lineas || []) {
      const hijos = cap.hijos || [];
      if (!hijos.length) {
        const totalLinea = this.getLineaBase(cap);
        base += totalLinea;
        conIva += this.getLineaTotalConIva(cap);
        continue;
      }
      for (const l of hijos) {
        const totalLinea = this.getLineaBase(l);
        base += totalLinea;
        conIva += this.getLineaTotalConIva(l);
      }
    }
    this.totalSinIva = this.round2(base);
    this.totalConIva = this.round2(conIva);
    this.totalIva = this.round2(this.totalConIva - this.totalSinIva);
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private getLineaBase(linea: any): number {
    const totalPvp = Number(linea?.totalPvp);
    if (!Number.isNaN(totalPvp) && totalPvp > 0) return this.round2(totalPvp);
    const totalLinea = Number(linea?.totalLinea);
    if (!Number.isNaN(totalLinea) && totalLinea > 0) return this.round2(totalLinea);
    const cantidad = Number(linea?.cantidad ?? 0);
    const pvpUnit = Number(linea?.pvpUnitario ?? linea?.precioUnitario ?? 0);
    return this.round2(cantidad * pvpUnit);
  }

  private calcPartidaValues(linea: any): { totalCoste: number; totalPvp: number; importeIva: number; totalFinal: number } {
    const cantidad = Number(linea?.cantidad ?? 0);
    const coste = Number(linea?.costeUnitario ?? 0);
    const factorRaw = Number(linea?.factorMargen);
    const factor = !Number.isNaN(factorRaw) && factorRaw > 0 ? factorRaw : 1;
    const totalCoste = this.round2(cantidad * coste);
    const totalPvp = this.round2(totalCoste * factor);
    const iva = Number(linea?.ivaPorcentaje ?? 21);
    const importeIva = this.round2(totalPvp * (iva / 100));
    const totalFinal = this.round2(totalPvp + importeIva);
    return { totalCoste, totalPvp, importeIva, totalFinal };
  }
}
