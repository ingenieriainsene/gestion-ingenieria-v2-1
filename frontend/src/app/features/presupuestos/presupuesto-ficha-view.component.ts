import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PresupuestoService, PresupuestoDTO } from '../../services/presupuesto.service';
import { ClienteService, LocalService, Cliente, Local } from '../../services/domain.services';

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
        <h1 class="ficha-title">PRESUPUESTO {{ presupuesto.codigoReferencia }}</h1>
        <div class="ficha-actions">
          <a [routerLink]="['/presupuestos', presupuesto.idPresupuesto, 'editar']" class="link-editar">✏️ Editar</a>
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
          <h3>Total</h3>
          <p>{{ presupuesto.total | number:'1.2-2' }} €</p>
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
                <th>CANTIDAD</th>
                <th>PRECIO</th>
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of presupuesto.lineas">
                <td>{{ l.orden }}</td>
                <td>{{ l.productoTexto || '—' }}</td>
                <td>{{ l.concepto || '—' }}</td>
                <td>{{ l.cantidad | number:'1.2-2' }}</td>
                <td>{{ l.precioUnitario | number:'1.2-2' }} €</td>
                <td>{{ l.totalLinea | number:'1.2-2' }} €</td>
              </tr>
              <tr *ngIf="presupuesto.lineas.length === 0">
                <td colspan="6" class="empty-cell">No hay líneas registradas.</td>
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
  `
})
export class PresupuestoFichaViewComponent implements OnInit {
  presupuesto: PresupuestoDTO | null = null;
  loading = true;
  clienteNombre: string | null = null;
  viviendaDireccion: string | null = null;

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
}
