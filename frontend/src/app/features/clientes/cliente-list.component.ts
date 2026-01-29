import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Cliente, ClienteService } from '../../services/domain.services';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-cliente-list',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    template: `
    <div class="d-flex justify-content-between align-items-center mb-3" style="margin-bottom: 25px;">
      <h1>Gestión de Clientes</h1>
      <a routerLink="/clientes/nuevo" class="btn-primary">+ Nuevo Cliente</a>
    </div>

    <div style="display: flex; gap: 10px; margin-bottom: 25px;">
      <input
        type="text"
        [(ngModel)]="filtro"
        (ngModelChange)="aplicarFiltro()"
        placeholder="Buscar por nombre, apellido o DNI..."
        style="flex-grow: 1; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;"
      />
      <button class="btn-primary" (click)="aplicarFiltro()">Filtrar</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>NOMBRE COMPLETO</th>
          <th>DNI</th>
          <th>DIRECCIÓN FISCAL</th>
          <th>FECHA DE ALTA</th>
          <th style="text-align: right;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let c of filtrados">
          <td><strong>#{{ c.idCliente }}</strong></td>
          <td>{{ c.apellido1 }} {{ c.apellido2 || '' }}, {{ c.nombre }}</td>
          <td>
            <code style="background:#f1f5f9; padding:2px 5px; border-radius:4px;">{{ c.dni }}</code>
          </td>
          <td>
            <small>{{ c.direccionFiscalCompleta }}<span *ngIf="c.codigoPostal"> ({{ c.codigoPostal }})</span></small>
          </td>
          <td>{{ c.fechaAlta | date:'dd/MM/yyyy' }}</td>
          <td style="text-align: right; white-space: nowrap;">
            <a
              [routerLink]="['/clientes', c.idCliente]"
              class="action-badge"
              style="background:#3498db;"
              title="Ver ficha"
            >👁️</a>
            <a
              [routerLink]="['/clientes', c.idCliente, 'editar']"
              class="action-badge badge-edit"
              title="Editar cliente"
            >✏️</a>
            <button
              class="action-badge badge-delete"
              style="border:none; cursor:pointer;"
              title="Eliminar"
              (click)="eliminar(c)"
            >🗑️</button>
          </td>
        </tr>
        <tr *ngIf="filtrados.length === 0">
          <td colspan="6" style="text-align:center; padding:40px; color:#64748b;">
            No se encontraron clientes con los criterios de búsqueda.
          </td>
        </tr>
      </tbody>
    </table>
  `
})
export class ClienteListComponent implements OnInit {
    clientes: Cliente[] = [];
    filtrados: Cliente[] = [];
    filtro = '';

    constructor(private service: ClienteService) { }

    ngOnInit() {
        this.service.getAll().subscribe(data => {
            this.clientes = data;
            this.filtrados = data;
        });
    }

    aplicarFiltro() {
        const term = this.filtro.trim().toLowerCase();
        if (!term) {
            this.filtrados = this.clientes;
            return;
        }
        this.filtrados = this.clientes.filter(c =>
            (c.nombre && c.nombre.toLowerCase().includes(term)) ||
            (c.apellido1 && c.apellido1.toLowerCase().includes(term)) ||
            (c.dni && c.dni.toLowerCase().includes(term))
        );
    }

    eliminar(c: Cliente) {
        if (!c.idCliente) return;
        Swal.fire({
            title: '¿Eliminar cliente?',
            text: `¿Seguro que deseas eliminar al cliente ${c.nombre} ${c.apellido1}? Se borrarán también sus contratos y locales vinculados.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#1e293b',
            cancelButtonText: 'Cancelar',
        }).then((res) => {
            if (!res.isConfirmed) return;
            this.service.delete(c.idCliente!).subscribe({
                next: () => {
                    this.clientes = this.clientes.filter(x => x.idCliente !== c.idCliente);
                    this.aplicarFiltro();
                    Swal.fire('Eliminado', 'Cliente borrado correctamente.', 'success');
                },
                error: () => Swal.fire('Error', 'No se pudo eliminar el cliente.', 'error'),
            });
        });
    }
}
