import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProveedorService, ProveedorCreateRequest } from '../../services/proveedor.service';
import Swal from 'sweetalert2';

/** Coincide con ProveedorListDTO del backend (camelCase). */
interface ProveedorRow {
  id: number;
  nombreComercial: string;
  cif: string;
  tipo: string;
  listaOficios: string[];
  telefono?: string;
  email?: string;
  contactosCount: number;
}

@Component({
  selector: 'app-proveedor-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3" style="margin-bottom: 25px;">
      <h1>Gestión de Proveedores</h1>
      <button type="button" class="btn-primary" (click)="abrirModalNuevo()">+ Nuevo Proveedor</button>
    </div>

    <div style="display: flex; gap: 10px; margin-bottom: 25px;">
      <input
        type="text"
        [(ngModel)]="filtro"
        (ngModelChange)="aplicarFiltro()"
        placeholder="Buscar por nombre, CIF u oficio..."
        style="flex-grow: 1; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;"
      />
      <button class="btn-primary" (click)="aplicarFiltro()">Filtrar</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>NOMBRE COMERCIAL</th>
          <th>CIF</th>
          <th>TIPO</th>
          <th>OFICIOS</th>
          <th>CONTACTOS</th>
          <th style="text-align: right;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let p of filtrados">
          <td><strong>#{{ p.id }}</strong></td>
          <td>{{ p.nombreComercial }}</td>
          <td><code style="background:#f1f5f9; padding:2px 5px; border-radius:4px;">{{ p.cif }}</code></td>
          <td>{{ p.tipo }}</td>
          <td>
            <ng-container *ngIf="p.listaOficios?.length; else sinOficios">
              <span *ngFor="let o of p.listaOficios; let last = last">{{ o }}<span *ngIf="!last">, </span></span>
            </ng-container>
            <ng-template #sinOficios><span class="muted">Sin oficios</span></ng-template>
          </td>
          <td>
            <ng-container *ngIf="p.contactosCount > 0; else sinContactos">
              {{ p.contactosCount }} persona{{ p.contactosCount !== 1 ? 's' : '' }}
            </ng-container>
            <ng-template #sinContactos>—</ng-template>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <a [routerLink]="['/proveedores', p.id]" class="action-badge" style="background:#3498db;" title="Ver ficha">👁️</a>
            <a [routerLink]="['/proveedores', p.id]" class="action-badge badge-edit" title="Editar">✏️</a>
            <button class="action-badge badge-delete" style="border:none; cursor:pointer;" title="Eliminar" (click)="eliminar(p)">🗑️</button>
          </td>
        </tr>
        <tr *ngIf="filtrados.length === 0">
          <td colspan="7" style="text-align:center; padding:40px; color:#64748b;">No hay proveedores registrados.</td>
        </tr>
      </tbody>
    </table>

    <div class="modal-overlay" [class.active]="modalAbierto" (click)="onOverlayClick($event)">
      <div class="modal-content modal-form" (click)="$event.stopPropagation()">
        <h2 style="margin-bottom: 20px; text-align: left;">Nuevo Proveedor</h2>
        <form [formGroup]="formModal" (ngSubmit)="guardarNuevo()">
          <div class="form-row">
            <label class="form-label">Nombre comercial *</label>
            <input type="text" class="form-input" formControlName="nombreComercial" placeholder="Ej. Instalaciones Pérez" />
          </div>
          <div class="form-row">
            <label class="form-label">Razón social</label>
            <input type="text" class="form-input" formControlName="razonSocial" placeholder="Ej. Instalaciones Pérez S.L." />
          </div>
          <div class="form-row">
            <label class="form-label">CIF / NIF *</label>
            <input type="text" class="form-input" formControlName="cif" placeholder="Ej. B12345678" />
          </div>
          <div class="form-row form-row-check">
            <label class="form-check-label">
              <input type="checkbox" formControlName="esAutonomo" />
              Tipo: Es autónomo
            </label>
          </div>
          <div class="form-row">
            <label class="form-label">Dirección fiscal</label>
            <input type="text" class="form-input" formControlName="direccionFiscal" placeholder="Calle, número, CP, localidad" />
          </div>
          <div class="form-row">
            <label class="form-label">Oficios (uno por línea)</label>
            <textarea class="form-input" formControlName="oficiosTexto" rows="3" placeholder="Electricidad&#10;Fontanería"></textarea>
          </div>
          <div class="form-row">
            <label class="form-label">Contacto (opcional): Nombre, Cargo, Teléfono, Email</label>
            <div class="contacto-fila">
              <input type="text" class="form-input" formControlName="contactoNombre" placeholder="Nombre" />
              <input type="text" class="form-input" formControlName="contactoCargo" placeholder="Cargo" />
              <input type="text" class="form-input" formControlName="contactoTelefono" placeholder="Teléfono" />
              <input type="text" class="form-input" formControlName="contactoEmail" placeholder="Email" />
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" (click)="cerrarModal(); $event.stopPropagation()" [disabled]="guardando">Cancelar</button>
            <button type="submit" class="btn-primary" [disabled]="formModal.invalid || guardando">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `.muted { color: #94a3b8; }`,
    `.modal-form { max-width: 520px; text-align: left; }`,
    `.form-row { margin-bottom: 16px; }`,
    `.form-label { display: block; font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 6px; }`,
    `.form-input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 1rem; }`,
    `.form-row-check .form-check-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }`,
    `.form-row-check input[type="checkbox"] { width: 18px; height: 18px; }`,
    `.contacto-fila { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }`,
    `.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; }`,
    `.btn-secondary { background: #94a3b8; color: white; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; }`,
  ],
})
export class ProveedorListComponent implements OnInit {
  proveedores: ProveedorRow[] = [];
  filtrados: ProveedorRow[] = [];
  filtro = '';
  modalAbierto = false;
  guardando = false;
  formModal: FormGroup;

  constructor(private service: ProveedorService, private fb: FormBuilder) {
    this.formModal = this.fb.group({
      nombreComercial: ['', Validators.required],
      cif: ['', Validators.required],
      razonSocial: [''],
      direccionFiscal: [''],
      esAutonomo: [false],
      oficiosTexto: [''],
      contactoNombre: [''],
      contactoCargo: [''],
      contactoTelefono: [''],
      contactoEmail: [''],
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.service.getAll().subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data ?? (data as { content?: unknown[] })?.content ?? [];
        this.proveedores = (list as ProveedorRow[]).map((x) => ({
          id: x.id,
          nombreComercial: x.nombreComercial ?? '',
          cif: x.cif ?? '',
          tipo: x.tipo ?? 'EMPRESA',
          listaOficios: Array.isArray(x.listaOficios) ? x.listaOficios : [],
          telefono: x.telefono ?? undefined,
          email: x.email ?? undefined,
          contactosCount: typeof x.contactosCount === 'number' ? x.contactosCount : 0,
        }));
        this.aplicarFiltro();
      },
      error: (err) => {
        this.proveedores = [];
        this.filtrados = [];
        const msg = err?.error?.message ?? err?.error?.error ?? err?.message ?? 'Error desconocido';
        Swal.fire('Error', String(msg), 'error');
      },
    });
  }

  aplicarFiltro(): void {
    const term = this.filtro.trim().toLowerCase();
    if (!term) {
      this.filtrados = [...this.proveedores];
      return;
    }
    this.filtrados = this.proveedores.filter(
      (p) =>
        (p.nombreComercial?.toLowerCase().includes(term)) ||
        (p.cif?.toLowerCase().includes(term)) ||
        (p.tipo?.toLowerCase().includes(term)) ||
        (p.listaOficios?.some((o) => o.toLowerCase().includes(term)))
    );
  }

  abrirModalNuevo(): void {
    this.guardando = false;
    this.formModal.reset({
      nombreComercial: '',
      cif: '',
      razonSocial: '',
      direccionFiscal: '',
      esAutonomo: false,
      oficiosTexto: '',
      contactoNombre: '',
      contactoCargo: '',
      contactoTelefono: '',
      contactoEmail: '',
    });
    this.modalAbierto = true;
  }

  onOverlayClick(e: Event): void {
    if ((e.target as HTMLElement)?.classList?.contains('modal-overlay')) this.cerrarModal();
  }

  cerrarModal(): void {
    this.guardando = false;
    this.modalAbierto = false;
  }

  guardarNuevo(): void {
    if (this.formModal.invalid || this.guardando) return;
    this.guardando = true;
    const v = this.formModal.value;
    const oficiosTexto = (v.oficiosTexto || '').trim();
    const oficios = oficiosTexto ? oficiosTexto.split(/[\n,;]+/).map((s: string) => s.trim()).filter(Boolean) : [];
    const contactos: { nombre: string; cargo?: string; telefono?: string; email?: string }[] = [];
    const nombreContacto = (v.contactoNombre || '').trim();
    if (nombreContacto) {
      contactos.push({
        nombre: nombreContacto,
        cargo: (v.contactoCargo || '').trim() || undefined,
        telefono: (v.contactoTelefono || '').trim() || undefined,
        email: (v.contactoEmail || '').trim() || undefined,
      });
    }
    const rs = (v.razonSocial || '').trim() || (v.nombreComercial || '').trim();
    const df = (v.direccionFiscal || '').trim();
    const payload: ProveedorCreateRequest = {
      nombreComercial: v.nombreComercial.trim(),
      cif: v.cif.trim(),
      esAutonomo: !!v.esAutonomo,
      ...(rs ? { razonSocial: rs } : {}),
      ...(df ? { direccionFiscal: df } : {}),
      ...(oficios.length ? { oficios } : {}),
      ...(contactos.length ? { contactos } : {}),
    };
    this.service.create(payload).subscribe({
      next: () => {
        this.guardando = false;
        this.modalAbierto = false;
        this.cargar();
        Swal.fire('Creado', 'Proveedor creado correctamente.', 'success');
      },
      error: (err) => {
        this.guardando = false;
        const msg = err?.error?.message ?? err?.error?.error ?? err?.message ?? 'No se pudo crear el proveedor.';
        Swal.fire('Error', String(msg), 'error');
      },
    });
  }

  eliminar(p: ProveedorRow): void {
    if (!p.id) return;
    Swal.fire({
      title: '¿Eliminar proveedor?',
      text: `¿Seguro que deseas eliminar a "${p.nombreComercial}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e293b',
      cancelButtonText: 'Cancelar',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.service.delete(p.id).subscribe({
        next: () => {
          this.proveedores = this.proveedores.filter((x) => x.id !== p.id);
          this.aplicarFiltro();
          Swal.fire('Eliminado', 'Proveedor borrado correctamente.', 'success');
        },
        error: (err) => {
          const msg = err?.error?.message ?? err?.error?.error ?? err?.message ?? 'No se pudo eliminar.';
          Swal.fire('Error', String(msg), 'error');
        },
      });
    });
  }
}
