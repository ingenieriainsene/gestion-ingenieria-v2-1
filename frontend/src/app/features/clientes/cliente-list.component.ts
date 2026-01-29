import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Cliente, ClienteService } from '../../services/domain.services';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-cliente-list',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
    template: `
    <div class="d-flex justify-content-between align-items-center mb-3" style="margin-bottom: 25px;">
      <h1>Gestión de Clientes</h1>
      <button type="button" class="btn-primary" (click)="abrirModalNuevo()">+ Nuevo Cliente</button>
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

    <div class="modal-overlay" *ngIf="modalVisible" (click)="onOverlayClick($event)">
      <div class="modal-bubble modal-form" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Nuevo Cliente</h2>
          <button type="button" class="close-btn" (click)="cerrarModal()">✕</button>
        </div>
        <form [formGroup]="formModal" (ngSubmit)="guardarNuevo()">
          <div class="modal-grid">
            <div class="modal-field">
              <label>Nombre *</label>
              <input type="text" formControlName="nombre" />
            </div>
            <div class="modal-field">
              <label>Primer apellido *</label>
              <input type="text" formControlName="apellido1" />
            </div>
            <div class="modal-field">
              <label>Segundo apellido</label>
              <input type="text" formControlName="apellido2" />
            </div>
            <div class="modal-field">
              <label>DNI/CIF *</label>
              <input type="text" formControlName="dni" />
            </div>
            <div class="modal-field">
              <label>Código postal</label>
              <input type="text" formControlName="codigoPostal" />
            </div>
            <div class="modal-field full">
              <label>Dirección fiscal completa</label>
              <input type="text" formControlName="direccionFiscalCompleta" />
            </div>
            <div class="modal-field full">
              <label>Cuenta bancaria (IBAN)</label>
              <input type="text" formControlName="cuentaBancaria" />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" (click)="cerrarModal()">Cancelar</button>
            <button type="submit" class="btn-primary" [disabled]="formModal.invalid || guardando">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  `
  ,
  styles: [`
    .modal-form { max-width: 680px; width: 90%; text-align: left; }
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
  `]
})
export class ClienteListComponent implements OnInit {
    clientes: Cliente[] = [];
    filtrados: Cliente[] = [];
    filtro = '';
    modalVisible = false;
    guardando = false;
    formModal: FormGroup;

    constructor(private service: ClienteService, private fb: FormBuilder) {
        this.formModal = this.fb.group({
            nombre: ['', Validators.required],
            apellido1: ['', Validators.required],
            apellido2: [''],
            dni: ['', Validators.required],
            codigoPostal: [''],
            direccionFiscalCompleta: [''],
            cuentaBancaria: [''],
        });
    }

    ngOnInit() {
        this.service.getAll().subscribe(data => {
            this.clientes = data;
            this.filtrados = data;
        });
    }

    abrirModalNuevo() {
        this.guardando = false;
        this.formModal.reset();
        this.modalVisible = true;
    }

    cerrarModal() {
        this.modalVisible = false;
    }

    onOverlayClick(e: Event) {
        if ((e.target as HTMLElement).classList.contains('modal-overlay')) this.cerrarModal();
    }

    guardarNuevo() {
        if (this.formModal.invalid || this.guardando) return;
        this.guardando = true;
        const payload = this.formModal.value;
        this.service.create(payload).subscribe({
            next: (created) => {
                this.guardando = false;
                this.cerrarModal();
                this.clientes = [created, ...this.clientes];
                this.aplicarFiltro();
                Swal.fire('Guardado', 'Cliente creado correctamente.', 'success');
            },
            error: (e) => {
                this.guardando = false;
                Swal.fire('Error', e?.error?.message || 'No se pudo crear el cliente.', 'error');
            }
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
