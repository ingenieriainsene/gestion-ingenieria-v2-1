import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PresupuestoService, PresupuestoDTO } from '../../services/presupuesto.service';
import { ClienteService, LocalService, Cliente, Local } from '../../services/domain.services';
import { MantenimientoPreventivoService } from '../../services/mantenimiento-preventivo.service';
import { AuditStampComponent } from '../../layout/audit-stamp.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-presupuesto-ficha-view',
  standalone: true,
  imports: [CommonModule, RouterLink, AuditStampComponent],
  template: `
    <div class="ficha-top">
      <a routerLink="/presupuestos" class="direct-link">&larr; Volver al listado</a>
    </div>
    <app-audit-stamp [data]="presupuesto"></app-audit-stamp>

    <div *ngIf="loading" class="ficha-loading">Cargando…</div>

    <div *ngIf="!loading && presupuesto" class="ficha-container">
      <div class="ficha-header clearfix">
        <div class="ficha-title-wrap">
          <h1 class="ficha-title">FICHA PRESUPUESTO #{{ presupuesto.idPresupuesto }}</h1>
        </div>
        <div class="header-badge-wrap">
          <span class="header-label">TIPO:</span>
          <span class="badge-tipo">{{ presupuesto.tipoPresupuesto || 'Obra' }}</span>
        </div>
        <div class="ficha-actions">
          <span class="link-archivos link-disabled" title="Código de referencia">
            {{ presupuesto.codigoReferencia || 'Sin referencia' }}
          </span>
          <button type="button" class="link-archivos" style="background:none;border:none;padding:0;cursor:pointer;" (click)="descargarPdf()">⬇️ PDF</button>
          <a [routerLink]="['/presupuestos', presupuesto.idPresupuesto, 'editar']" class="link-editar">✏️ Editar</a>
          <button type="button" class="link-archivos" style="background:none;border:none;padding:0;cursor:pointer;" (click)="eliminar()">🗑️ Eliminar</button>
          <a routerLink="/presupuestos" class="link-volver">Volver</a>
        </div>
      </div>

      <div class="info-card-grid">
        <div class="info-card">
          <h3>Cliente</h3>
          <p>{{ clienteNombre || ('ID ' + presupuesto.clienteId) }}</p>
        </div>
        <div class="info-card">
          <h3>Vivienda</h3>
          <p>{{ viviendaDireccion || ('ID ' + presupuesto.viviendaId) }}</p>
        </div>
        <div class="info-card">
          <h3>Fecha</h3>
          <p>{{ presupuesto.fecha | date:'dd/MM/yyyy' }}</p>
        </div>
        <div class="info-card">
          <h3>Estado</h3>
          <p>{{ presupuesto.estado || '—' }}</p>
        </div>
        <div class="info-card">
          <h3>Total sin IVA</h3>
          <p>{{ totalSinIva | number:'1.2-2' }} €</p>
        </div>
        <div class="info-card">
          <h3>IVA total</h3>
          <p>{{ totalIva | number:'1.2-2' }} €</p>
        </div>
        <div class="info-card">
          <h3>TOTAL con IVA</h3>
          <p>{{ totalConIva | number:'1.2-2' }} €</p>
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
          <table class="ficha-table">
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
                  <td>{{ cap.codigoVisual || '—' }}</td>
                  <td>
                    <button type="button" class="toggle-btn" (click)="toggleCapitulo(i)">
                      {{ collapsed[i] ? '▶' : '▼' }}
                    </button>
                    {{ cap.concepto || '—' }}
                  </td>
                  <td style="text-align:right;">—</td>
                  <td style="text-align:right;">—</td>
                  <td style="text-align:right;">{{ getCapituloTotalCoste(cap) | number:'1.2-2' }} €</td>
                  <td style="text-align:right;">—</td>
                  <td style="text-align:right;">{{ getCapituloTotalPvp(cap) | number:'1.2-2' }} €</td>
                  <td style="text-align:right;" *ngIf="presupuesto.tipoPresupuesto === 'Preventivo'">—</td>
                  <td style="text-align:right;">—</td>
                  <td style="text-align:right;">{{ getCapituloImporteIva(cap) | number:'1.2-2' }} €</td>
                  <td style="text-align:right;">{{ getCapituloTotalFinal(cap) | number:'1.2-2' }} €</td>
                </tr>
                <tr *ngFor="let l of cap.hijos || []" class="row-partida" [class.hidden]="collapsed[i]">
                  <td class="indent">{{ l.codigoVisual || '—' }}</td>
                  <td>{{ l.concepto || '—' }}</td>
                  <td style="text-align:right;">{{ l.cantidad | number:'1.2-2' }}</td>
                  <td style="text-align:right;">{{ l.costeUnitario | number:'1.2-2' }} €</td>
                  <td style="text-align:right;">{{ getPartidaTotalCoste(l) | number:'1.2-2' }} €</td>
                  <td style="text-align:right;">{{ l.factorMargen | number:'1.2-2' }}</td>
                  <td style="text-align:right;">{{ getPartidaTotalPvp(l) | number:'1.2-2' }} €</td>
                  <td style="text-align:right;" *ngIf="presupuesto.tipoPresupuesto === 'Preventivo'">{{ l.numVisitas || 0 }}</td>
                  <td style="text-align:right;">{{ l.ivaPorcentaje ?? 21 }}</td>
                  <td style="text-align:right;">{{ getPartidaImporteIva(l) | number:'1.2-2' }} €</td>
                  <td style="text-align:right;">{{ getPartidaTotalFinal(l) | number:'1.2-2' }} €</td>
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
  styleUrls: ['../clientes/cliente-ficha-view.component.css']
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: PresupuestoService,
    private mantenimientoService: MantenimientoPreventivoService,
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
        this.presupuesto = { ...p, lineas: p.lineas || [] };
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
    if (!this.presupuesto) return;
    if (this.presupuesto.tipoPresupuesto === 'Preventivo') {
      this.mantenimientoService.crearContratoDesdePresupuesto(this.presupuesto.idPresupuesto!).subscribe({
        next: (c) => {
          if (c?.idContratoMant) {
            this.router.navigate(['/contratos', c.idContratoMant, 'planificacion']);
          }
        },
        error: (e) => {
          let msg = 'No se pudo generar el contrato preventivo.';
          if (typeof e?.error === 'string') {
            msg = e.error;
          } else if (e?.error?.message) {
            msg = e.error.message;
          } else if (e?.status === 404) {
            msg = 'El endpoint no está disponible en el backend.';
          }
          Swal.fire('Error', msg, 'error');
        },
      });
      return;
    }
    const tipoContrato = this.mapTipoContrato(this.presupuesto.tipoPresupuesto);
    this.router.navigate(['/contratos'], {
      queryParams: {
        openModal: 1,
        clienteId: this.presupuesto.clienteId,
        localId: this.presupuesto.viviendaId,
        ...(tipoContrato ? { tipoContrato } : {}),
        ...(this.presupuesto.fecha ? { fechaInicio: this.presupuesto.fecha } : {}),
      },
    });
  }

  private mapTipoContrato(tipoPresupuesto?: string): string | null {
    if (!tipoPresupuesto) return null;
    const t = tipoPresupuesto.toLowerCase();
    if (t === 'preventivo') return 'Preventivo';
    if (t === 'obra') return 'Instalación';
    return null;
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

  descargarPdf(): void {
    if (!this.presupuesto?.idPresupuesto) return;
    this.service.downloadPdf(this.presupuesto.idPresupuesto).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `presupuesto_${this.presupuesto!.idPresupuesto}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        Swal.fire('Error', 'No se pudo descargar el PDF.', 'error');
      }
    });
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
