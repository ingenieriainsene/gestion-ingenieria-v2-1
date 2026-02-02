import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PresupuestoService, PresupuestoListItem } from '../../services/presupuesto.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-presupuesto-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3" style="margin-bottom: 25px;">
      <h1>Gestión de Presupuestos</h1>
      <a routerLink="/presupuestos/nuevo" class="btn-primary">+ Nuevo Presupuesto</a>
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>CLIENTE</th>
          <th>VIVIENDA</th>
          <th>PRODUCTO</th>
          <th>FECHA</th>
          <th>TOTAL</th>
          <th>ESTADO</th>
          <th style="text-align:right;">ACCIONES</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let p of presupuestos" (click)="verFicha(p)" style="cursor:pointer;">
          <td>
            <strong [title]="p.idPresupuesto">{{ formatId(p.idPresupuesto) }}</strong>
          </td>
          <td>{{ p.clienteNombre || '—' }}</td>
          <td>{{ p.viviendaDireccion || '—' }}</td>
          <td [title]="p.productoNombre || ''">{{ formatProducto(p.productoNombre) }}</td>
          <td>{{ p.fecha | date:'dd/MM/yyyy' }}</td>
          <td>{{ p.total | number:'1.2-2' }} €</td>
          <td>{{ p.estado || '—' }}</td>
          <td style="text-align:right; white-space:nowrap;">
            <a
              [routerLink]="['/presupuestos', p.idPresupuesto]"
              class="action-badge"
              style="background:#3498db;"
              title="Ver presupuesto"
              (click)="$event.stopPropagation()"
            >👁️</a>
            <a [routerLink]="['/presupuestos', p.idPresupuesto, 'editar']" class="action-badge badge-edit" title="Editar" (click)="$event.stopPropagation()">✏️</a>
            <button class="action-badge badge-delete" style="border:none; cursor:pointer;" (click)="eliminar(p); $event.stopPropagation()" title="Eliminar">🗑️</button>
          </td>
        </tr>
        <tr *ngIf="presupuestos.length === 0">
          <td colspan="8" style="text-align:center; padding:40px; color:#64748b;">
            No hay presupuestos registrados.
          </td>
        </tr>
      </tbody>
    </table>
  `
})
export class PresupuestoListComponent implements OnInit {
  presupuestos: PresupuestoListItem[] = [];

  constructor(private service: PresupuestoService, private router: Router) {}

  ngOnInit(): void {
    this.service.getBudgets().subscribe({
      next: (list) => (this.presupuestos = list || []),
      error: () => (this.presupuestos = []),
    });
  }

  formatId(id: number | string): string {
    const value = String(id);
    return value.length > 8 ? `${value.slice(0, 8)}…` : value;
  }

  formatProducto(valor?: string | null): string {
    if (!valor) return '—';
    const partes = valor.split(',').map((p) => p.trim()).filter(Boolean);
    if (partes.length === 0) return '—';
    if (partes.length === 1) return partes[0];
    return `${partes[0]} + ${partes.length - 1}`;
  }

  verFicha(p: PresupuestoListItem): void {
    this.router.navigate(['/presupuestos', p.idPresupuesto]);
  }

  eliminar(p: PresupuestoListItem): void {
    Swal.fire({
      title: '¿Eliminar presupuesto?',
      text: `¿Seguro que deseas eliminar ${p.codigoReferencia}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e293b',
      cancelButtonText: 'Cancelar',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.service.deleteBudget(p.idPresupuesto).subscribe({
        next: () => {
          this.presupuestos = this.presupuestos.filter(x => x.idPresupuesto !== p.idPresupuesto);
          Swal.fire('Eliminado', 'Presupuesto borrado correctamente.', 'success');
        },
        error: () => {
          Swal.fire('Error', 'No se pudo eliminar el presupuesto.', 'error');
        }
      });
    });
  }
}
