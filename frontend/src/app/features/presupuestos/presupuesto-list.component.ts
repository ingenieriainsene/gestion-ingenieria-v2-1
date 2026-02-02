import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
          <th>REFERENCIA</th>
          <th>CLIENTE</th>
          <th>VIVIENDA</th>
          <th>TIPO LINEA</th>
          <th>PRODUCTO</th>
          <th>FECHA</th>
          <th>TOTAL</th>
          <th>ESTADO</th>
          <th style="text-align:right;">ACCIONES</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let p of presupuestos">
          <td><strong>{{ p.codigoReferencia }}</strong></td>
          <td>{{ p.clienteNombre || '—' }}</td>
          <td>{{ p.viviendaDireccion || '—' }}</td>
          <td>{{ p.tipoLinea || '—' }}</td>
          <td>{{ p.productoNombre || '—' }}</td>
          <td>{{ p.fecha | date:'dd/MM/yyyy' }}</td>
          <td>{{ p.total | number:'1.2-2' }} €</td>
          <td>{{ p.estado || '—' }}</td>
          <td style="text-align:right; white-space:nowrap;">
            <a
              [routerLink]="['/presupuestos', p.idPresupuesto]"
              class="action-badge"
              style="background:#3498db;"
              title="Ver presupuesto"
            >👁️</a>
            <a [routerLink]="['/presupuestos', p.idPresupuesto, 'editar']" class="action-badge badge-edit" title="Editar">✏️</a>
            <button class="action-badge badge-delete" style="border:none; cursor:pointer;" (click)="eliminar(p)" title="Eliminar">🗑️</button>
          </td>
        </tr>
        <tr *ngIf="presupuestos.length === 0">
          <td colspan="9" style="text-align:center; padding:40px; color:#64748b;">
            No hay presupuestos registrados.
          </td>
        </tr>
      </tbody>
    </table>
  `
})
export class PresupuestoListComponent implements OnInit {
  presupuestos: PresupuestoListItem[] = [];

  constructor(private service: PresupuestoService) {}

  ngOnInit(): void {
    this.service.getBudgets().subscribe({
      next: (list) => (this.presupuestos = list || []),
      error: () => (this.presupuestos = []),
    });
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
