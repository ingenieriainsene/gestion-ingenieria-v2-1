import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContratoService, Contrato, ClienteService, LocalService, Cliente, Local } from '../../services/domain.services';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-contrato-list',
    standalone: true,
    imports: [CommonModule, RouterLink, ReactiveFormsModule],
    template: `
    <div class="d-flex justify-content-between align-items-center mb-3" style="margin-bottom: 25px;">
      <h1>Gestión de Contratos</h1>
      <button type="button" class="btn-primary" (click)="abrirModalNuevo()">+ Nuevo Contrato</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>CLIENTE (FICHA)</th>
          <th>LOCAL (FICHA)</th>
          <th>TIPO</th>
          <th>ALTA</th>
          <th>VENCIMIENTO</th>
          <th style="text-align:right;">ACCIONES</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let c of contratos">
          <td><strong>#{{ c.idContrato }}</strong></td>
          <td>
            <a
              [routerLink]="['/clientes', c.cliente?.idCliente || c.idCliente]"
              class="maps-link"
              style="font-weight:bold;"
              title="Ver expediente completo del cliente"
            >
              👤 {{ c.cliente?.nombre }} {{ c.cliente?.apellido1 }}
            </a>
          </td>
          <td>
            <a
              [routerLink]="['/locales', c.local?.idLocal || c.idLocal]"
              class="maps-link"
              title="Ver historial técnico de esta ubicación"
            >
              🏢 {{ c.local?.direccionCompleta }}
            </a>
          </td>
          <td>{{ c.tipoContrato }}</td>
          <td>{{ c.fechaAlta || c.fechaInicio | date:'dd/MM/yyyy' }}</td>
          <td>{{ c.fechaVencimiento | date:'dd/MM/yyyy' }}</td>
          <td style="text-align:right; white-space:nowrap;">
            <a
              [routerLink]="['/contratos', c.idContrato]"
              class="action-badge"
              title="Gestionar contrato (intervenciones, documentos, notas)"
              style="margin-right:6px; background:#0f172a; color:white;"
            >👁️</a>
            <a
              [routerLink]="['/contratos', c.idContrato, 'tramites']"
              class="action-badge badge-edit"
              title="Ver listado simple de trámites"
            >✏️</a>
            <button
              class="action-badge badge-delete"
              style="border:none; cursor:pointer;"
              (click)="eliminar(c)"
              title="Eliminar contrato"
            >🗑️</button>
          </td>
        </tr>
        <tr *ngIf="contratos.length === 0">
          <td colspan="7" style="text-align:center; padding:40px; color:#64748b;">
            No se encontraron contratos.
          </td>
        </tr>
      </tbody>
    </table>

    <div class="modal-overlay" *ngIf="modalVisible" (click)="onOverlayClick($event)">
      <div class="modal-bubble" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Nuevo Contrato</h2>
          <button type="button" class="close-btn" (click)="cerrarModal()">✕</button>
        </div>
        <form [formGroup]="formNuevo" (ngSubmit)="crearContrato()">
          <div class="modal-grid">
            <div class="modal-field">
              <label>Cliente *</label>
              <input
                type="text"
                formControlName="clienteLabel"
                list="clientes-list"
                placeholder="Busca por nombre o DNI"
                (input)="onClienteInput()"
              />
              <datalist id="clientes-list">
                <option *ngFor="let c of clientesOptions" [value]="c.label"></option>
              </datalist>
            </div>
            <div class="modal-field">
              <label>Local *</label>
              <input
                type="text"
                formControlName="localLabel"
                list="locales-list"
                placeholder="Busca por dirección o CUPS"
                (input)="onLocalInput()"
              />
              <datalist id="locales-list">
                <option *ngFor="let l of localesOptions" [value]="l.label"></option>
              </datalist>
            </div>
            <div class="modal-field">
              <label>Tipo de contrato *</label>
              <select formControlName="tipoContrato">
                <option value="">Selecciona un tipo</option>
                <option value="Instalación">Instalación</option>
                <option value="Ampliacion">Ampliacion</option>
                <option value="Preventivo">Preventivo</option>
              </select>
            </div>
            <div class="modal-field">
              <label>Fecha inicio *</label>
              <input type="date" formControlName="fechaInicio" />
            </div>
            <div class="modal-field">
              <label>Fecha vencimiento *</label>
              <input type="date" formControlName="fechaVencimiento" />
            </div>
            <div class="modal-field full">
              <label>Observaciones</label>
              <textarea rows="3" formControlName="observaciones" placeholder="Notas generales del contrato..."></textarea>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" (click)="cerrarModal()">Cancelar</button>
            <button type="submit" class="btn-primary" [disabled]="formNuevo.invalid || guardando">Crear contrato</button>
          </div>
        </form>
      </div>
    </div>
  `
  ,
  styles: [`
    .modal-bubble {
      text-align: left;
      overflow: hidden;
    }

    .modal-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 8px;
    }

    .modal-field.full {
      grid-column: span 2;
    }

    .modal-field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1rem;
      min-width: 0;
    }

    .modal-field input,
    .modal-field select,
    .modal-field textarea {
      padding: 0.75rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      font-family: inherit;
      width: 100%;
      box-sizing: border-box;
    }

    .modal-field label {
      font-weight: 700;
      color: #1e293b;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }

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
export class ContratoListComponent implements OnInit {
    contratos: Contrato[] = [];
    clientes: Cliente[] = [];
    locales: Local[] = [];
    clientesOptions: { id: number; label: string }[] = [];
    localesOptions: { id: number; label: string }[] = [];
    modalVisible = false;
    formNuevo: FormGroup;
    guardando = false;
    constructor(
        private service: ContratoService,
        private clientesService: ClienteService,
        private localesService: LocalService,
        private fb: FormBuilder
    ) {
        this.formNuevo = this.fb.group({
            idCliente: [null, Validators.required],
            idLocal: [null, Validators.required],
            clienteLabel: [''],
            localLabel: [''],
            tipoContrato: ['', Validators.required],
            fechaInicio: ['', Validators.required],
            fechaVencimiento: ['', Validators.required],
            observaciones: ['']
        });
    }

    ngOnInit() {
        this.service.getAll().subscribe(data => this.contratos = data);
        this.clientesService.getAll().subscribe(data => {
            this.clientes = data || [];
            this.clientesOptions = this.clientes
                .filter(c => typeof c.idCliente === 'number')
                .map(c => ({
                    id: c.idCliente!,
                    label: this.buildClienteLabel(c),
                }));
        });
        this.localesService.getAll().subscribe(data => {
            this.locales = data || [];
            this.localesOptions = this.locales
                .filter(l => typeof l.idLocal === 'number')
                .map(l => ({
                    id: l.idLocal!,
                    label: this.buildLocalLabel(l),
                }));
        });
    }

    abrirModalNuevo() {
        this.modalVisible = true;
    }

    cerrarModal() {
        this.modalVisible = false;
    }

    onOverlayClick(e: Event) {
        if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
            this.cerrarModal();
        }
    }

    crearContrato() {
        if (this.formNuevo.invalid || this.guardando) return;
        this.guardando = true;
        const v = this.formNuevo.value;
        const payload: Contrato = {
            idCliente: v.idCliente,
            idLocal: v.idLocal,
            tipoContrato: v.tipoContrato,
            fechaInicio: v.fechaInicio,
            fechaVencimiento: v.fechaVencimiento,
            observaciones: v.observaciones || undefined
        };
        this.service.create(payload).subscribe({
            next: (created) => {
                this.guardando = false;
                this.cerrarModal();
                this.formNuevo.reset();
                this.contratos = [created, ...this.contratos];
                Swal.fire('Creado', 'Contrato creado correctamente.', 'success');
            },
            error: (err) => {
                this.guardando = false;
                const msg = err?.error?.message ?? 'No se pudo crear el contrato.';
                Swal.fire('Error', msg, 'error');
            }
        });
    }

    onClienteInput() {
        const label = String(this.formNuevo.get('clienteLabel')?.value || '').trim();
        const match = this.clientesOptions.find(c => c.label === label);
        this.formNuevo.patchValue({ idCliente: match?.id ?? null }, { emitEvent: false });
    }

    onLocalInput() {
        const label = String(this.formNuevo.get('localLabel')?.value || '').trim();
        const match = this.localesOptions.find(l => l.label === label);
        this.formNuevo.patchValue({ idLocal: match?.id ?? null }, { emitEvent: false });
    }

    private buildClienteLabel(c: Cliente): string {
        const nombre = `${c.nombre} ${c.apellido1}${c.apellido2 ? ' ' + c.apellido2 : ''}`.trim();
        const dni = c.dni ? ` (${c.dni})` : '';
        return `${nombre}${dni}`;
    }

    private buildLocalLabel(l: Local): string {
        const dir = l.direccionCompleta || 'Local sin dirección';
        const cups = l.cups ? ` · ${l.cups}` : '';
        return `${dir}${cups}`;
    }

    eliminar(c: Contrato) {
        if (!c.idContrato) return;
        Swal.fire({
            title: '¿Eliminar contrato?',
            text: `¿Seguro que deseas eliminar el contrato #${c.idContrato}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#1e293b',
            cancelButtonText: 'Cancelar',
        }).then((res) => {
            if (!res.isConfirmed) return;
            this.service.delete(c.idContrato!).subscribe({
                next: () => {
                    this.contratos = this.contratos.filter(x => x.idContrato !== c.idContrato);
                    Swal.fire('Eliminado', 'Contrato borrado correctamente.', 'success');
                },
                error: () => Swal.fire('Error', 'No se pudo eliminar el contrato.', 'error'),
            });
        });
    }
}
