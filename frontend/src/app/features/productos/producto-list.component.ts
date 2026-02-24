import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { Producto } from '../../models/producto.model';
import { ProductoService } from '../../services/producto.service';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3" style="margin-bottom: 25px;">
      <h1>Almacén de Productos</h1>
      <button type="button" class="btn-primary" (click)="abrirModalNuevo()">+ Nuevo Producto</button>
    </div>

    <div style="display: flex; gap: 10px; margin-bottom: 25px;">
      <input
        type="text"
        [(ngModel)]="filtro"
        (ngModelChange)="aplicarFiltro()"
        placeholder="Buscar por código, descripción o categoría..."
        style="flex-grow: 1; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;"
      />
      <button class="btn-primary" (click)="aplicarFiltro()">Filtrar</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>CÓDIGO</th>
          <th>DESCRIPCIÓN</th>
          <th>CATEGORÍA</th>
          <th>COSTE</th>
          <th>MARGEN</th>
          <th>PVP (B.I)</th>
          <th>PVP TOTAL</th>
          <th style="text-align: right;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let p of filtrados">
          <td><strong>#{{ p.id }}</strong></td>
          <td><code style="background:#f1f5f9; padding:2px 5px; border-radius:4px;">{{ p.codRef }}</code></td>
          <td>{{ p.descripcion }}</td>
          <td>{{ p.categoria || '—' }}</td>
          <td>{{ p.coste | number:'1.2-2' }} €</td>
          <td>{{ (p.margen || 0) | number:'1.1-1' }}%</td>
          <td><strong>{{ (p.precioVenta || 0) | number:'1.2-2' }} €</strong></td>
          <td style="color: #059669; font-weight: 700;">
            {{ ((p.precioVenta || 0) * (1 + (p.iva || 0) / 100)) | number:'1.2-2' }} €
          </td>
          <td style="text-align: right;">
            <a [routerLink]="['/productos', p.id]" class="action-badge badge-edit">✏️</a>
            <a href="javascript:void(0)" class="action-badge badge-delete" (click)="eliminar(p)">🗑️</a>
          </td>
        </tr>
        <tr *ngIf="filtrados.length === 0">
          <td colspan="6" style="text-align:center; padding:40px; color:#64748b;">
            No hay productos registrados.
          </td>
        </tr>
      </tbody>
    </table>

    <div class="modal-overlay" *ngIf="modalVisible" (click)="onOverlayClick($event)">
      <div class="modal-bubble modal-form" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Nuevo Producto</h2>
          <button type="button" class="close-btn" (click)="cerrarModal()">✕</button>
        </div>
        <form #formModal="ngForm" (ngSubmit)="guardarNuevo(formModal)">
          <div class="modal-grid">
            <div class="modal-field">
              <label>Código de referencia *</label>
              <input type="text" name="codRef" [(ngModel)]="nuevo.codRef" required />
            </div>
            <div class="modal-field">
              <label>Categoría</label>
              <input type="text" name="categoria" [(ngModel)]="nuevo.categoria" />
            </div>
            <div class="modal-field full">
              <label>Descripción *</label>
              <input type="text" name="descripcion" [(ngModel)]="nuevo.descripcion" required />
            </div>
            <div class="modal-field">
              <label>Coste *</label>
              <input type="number" name="coste" [(ngModel)]="nuevo.coste" step="0.01" min="0" required />
            </div>
            <div class="modal-field">
              <label>Margen (%)</label>
              <input type="number" name="margen" [(ngModel)]="nuevo.margen" step="0.1" />
            </div>
            <div class="modal-field">
              <label>IVA (%)</label>
              <input type="number" name="iva" [(ngModel)]="nuevo.iva" />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" (click)="cerrarModal()" [disabled]="guardando">Cancelar</button>
            <button type="submit" class="btn-primary" [disabled]="formModal.invalid || guardando">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-form { max-width: 620px; width: 90%; text-align: left; }
    .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .modal-field { display: flex; flex-direction: column; gap: 6px; }
    .modal-field.full { grid-column: span 2; }
    .modal-field input {
      padding: 0.75rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      font-family: inherit;
      width: 100%;
      box-sizing: border-box;
    }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 1.5rem; }
    .btn-secondary {
      background: #94a3b8;
      color: white;
      padding: 10px 18px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-weight: 600;
    }
  `],
})
export class ProductoListComponent implements OnInit {
  productos: Producto[] = [];
  filtrados: Producto[] = [];
  filtro = '';
  modalVisible = false;
  guardando = false;
  nuevo: Producto = {
    codRef: '',
    descripcion: '',
    coste: 0,
    margen: 0,
    iva: 21,
    precioVenta: 0,
    categoria: '',
  };

  constructor(private productoService: ProductoService) { }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.productoService.getAll().subscribe((data) => {
      this.productos = Array.isArray(data) ? data : [];
      this.aplicarFiltro();
    });
  }

  aplicarFiltro(): void {
    const term = this.filtro.trim().toLowerCase();
    if (!term) {
      this.filtrados = [...this.productos];
      return;
    }
    this.filtrados = this.productos.filter((p) => {
      const cod = p.codRef?.toLowerCase() ?? '';
      const desc = p.descripcion?.toLowerCase() ?? '';
      const cat = p.categoria?.toLowerCase() ?? '';
      return cod.includes(term) || desc.includes(term) || cat.includes(term);
    });
  }

  eliminar(p: Producto): void {
    if (!p.id) return;
    Swal.fire({
      title: '¿Eliminar producto?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e293b',
      cancelButtonText: 'Cancelar',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.productoService.delete(p.id!).subscribe({
        next: () => {
          this.cargar();
          Swal.fire('Eliminado', 'Producto borrado correctamente.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo eliminar el producto.', 'error'),
      });
    });
  }

  abrirModalNuevo(): void {
    this.guardando = false;
    this.nuevo = { codRef: '', descripcion: '', coste: 0, margen: 0, iva: 21, precioVenta: 0, categoria: '' };
    this.modalVisible = true;
  }

  cerrarModal(): void {
    this.modalVisible = false;
  }

  onOverlayClick(e: Event): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.cerrarModal();
  }

  guardarNuevo(form: NgForm): void {
    if (form.invalid || this.guardando) return;
    this.guardando = true;
    const payload: Producto = {
      codRef: this.nuevo.codRef.trim(),
      descripcion: this.nuevo.descripcion.trim(),
      coste: Number(this.nuevo.coste),
      margen: Number(this.nuevo.margen || 0),
      iva: Number(this.nuevo.iva || 0),
      precioVenta: +(Number(this.nuevo.coste) * (1 + Number(this.nuevo.margen || 0) / 100)).toFixed(2),
      categoria: this.nuevo.categoria?.trim() || '',
    };
    this.productoService.create(payload).subscribe({
      next: (created) => {
        this.guardando = false;
        this.cerrarModal();
        this.productos = [created, ...this.productos];
        this.aplicarFiltro();
        Swal.fire('Guardado', 'Producto creado correctamente.', 'success');
      },
      error: () => {
        this.guardando = false;
        Swal.fire('Error', 'No se pudo crear el producto.', 'error');
      },
    });
  }
}
