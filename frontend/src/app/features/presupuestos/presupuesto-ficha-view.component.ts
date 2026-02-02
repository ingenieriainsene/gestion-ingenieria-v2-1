import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PresupuestoService, PresupuestoDTO } from '../../services/presupuesto.service';
import { ClienteService, LocalService, Cliente, Local } from '../../services/domain.services';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-presupuesto-ficha-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="ficha-top">
      <a routerLink="/presupuestos" class="direct-link">&larr; Volver al listado</a>
    </div>

    <div *ngIf="loading" class="ficha-loading">Cargando…</div>

    <div *ngIf="!loading && presupuesto" class="ficha-container">
      <div class="ficha-header clearfix">
        <h1 class="ficha-title">FICHA PRESUPUESTO #{{ presupuesto.idPresupuesto }}</h1>
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

      <section class="ficha-section">
        <div class="section-header">
          <h2>📋 Líneas de presupuesto</h2>
        </div>
        <div class="table-wrap">
          <table class="ficha-table">
            <thead>
              <tr>
                <th>ORDEN</th>
                <th>PRODUCTO</th>
                <th>TIPO DE LÍNEA</th>
                <th>IVA %</th>
                <th>CANTIDAD</th>
                <th>PRECIO</th>
                <th>TOTAL (CON IVA)</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of presupuesto.lineas">
                <td>{{ l.orden }}</td>
                <td>{{ l.productoTexto || '—' }}</td>
                <td>{{ l.concepto || '—' }}</td>
                <td>{{ l.ivaPorcentaje ?? 21 }}</td>
                <td>{{ l.cantidad | number:'1.2-2' }}</td>
                <td>{{ l.precioUnitario | number:'1.2-2' }} €</td>
                <td>{{ getLineaTotalConIva(l) | number:'1.2-2' }} €</td>
              </tr>
              <tr *ngIf="presupuesto.lineas.length === 0">
                <td colspan="7" class="empty-cell">No hay líneas registradas.</td>
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: PresupuestoService,
    private clienteService: ClienteService,
    private localService: LocalService
  ) {}

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
      error: () => {}
    });
    this.localService.getById(viviendaId).subscribe({
      next: (l: Local) => {
        this.viviendaDireccion = l.direccionCompleta || null;
      },
      error: () => {}
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

  getLineaTotalConIva(linea: any): number {
    const totalLinea = Number(linea?.totalLinea ?? 0);
    const iva = Number(linea?.ivaPorcentaje ?? 21);
    const conIva = totalLinea + totalLinea * (iva / 100);
    return Math.round(conIva * 100) / 100;
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
    for (const l of this.presupuesto.lineas || []) {
      const totalLinea = Number(l.totalLinea ?? 0);
      const iva = Number(l.ivaPorcentaje ?? 21);
      base += totalLinea;
      conIva += this.getLineaTotalConIva(l);
    }
    this.totalSinIva = this.round2(base);
    this.totalConIva = this.round2(conIva);
    this.totalIva = this.round2(this.totalConIva - this.totalSinIva);
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
