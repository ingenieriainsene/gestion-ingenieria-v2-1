import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { Producto } from '../../models/producto.model';
import { ProductoService } from '../../services/producto.service';

@Component({
  selector: 'app-producto-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2>Almacén de Productos</h2>
      <a routerLink="/productos/nuevo" class="btn-primary">+ Nuevo Producto</a>
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

    <table class="table table-striped">
      <thead>
        <tr>
          <th>ID</th>
          <th>CÓDIGO</th>
          <th>DESCRIPCIÓN</th>
          <th>CATEGORÍA</th>
          <th>COSTE</th>
          <th style="text-align: right;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let p of filtrados">
          <td>#{{ p.id }}</td>
          <td><code>{{ p.codRef }}</code></td>
          <td>{{ p.descripcion }}</td>
          <td>{{ p.categoria || '—' }}</td>
          <td>{{ p.coste | number:'1.2-2' }} €</td>
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
  `,
})
export class ProductoListComponent implements OnInit {
  productos: Producto[] = [];
  filtrados: Producto[] = [];
  filtro = '';

  constructor(private productoService: ProductoService) {}

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
}
