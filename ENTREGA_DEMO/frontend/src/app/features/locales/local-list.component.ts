import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LocalService, Local } from '../../services/domain.services';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-local-list',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
    template: `
    <div class="d-flex justify-content-between align-items-center mb-3" style="margin-bottom: 25px;">
      <h1>Gestión de Locales</h1>
      <button type="button" class="btn-primary" (click)="abrirModalNuevo()">+ Nuevo Local</button>
    </div>

    <div style="display: flex; gap: 10px; margin-bottom: 25px;">
      <input
        type="text"
        [(ngModel)]="filtro"
        (ngModelChange)="aplicarFiltro()"
        placeholder="Buscar por dirección, titular, CUPS o Referencia..."
        style="flex-grow: 1; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;"
      />
      <button class="btn-primary" (click)="aplicarFiltro()">Filtrar</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>DIRECCIÓN (MAPA)</th>
          <th>CUPS</th>
          <th>REF. CATASTRAL</th>
          <th>TITULAR</th>
          <th>DNI TITULAR</th>
          <th>FECHA ALTA</th>
          <th style="text-align: right;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let l of filtrados">
          <td><strong>#{{ l.idLocal }}</strong></td>
          <td>
            <small>
              <a
                class="maps-link"
                target="_blank"
                [href]="buildMapsUrl(l.direccionCompleta)"
              >
                📍 {{ l.direccionCompleta }}
              </a>
            </small>
          </td>
          <td><code>{{ l.cups || '---' }}</code></td>
          <td>
            <ng-container *ngIf="l.referenciaCatastral; else noRc">
              <a
                class="catastro-link"
                target="_blank"
                [href]="buildCatastroUrl(l.referenciaCatastral!)"
              >
                📑 {{ l.referenciaCatastral }}
              </a>
            </ng-container>
            <ng-template #noRc>
              <span style="color:#94a3b8;">---</span>
            </ng-template>
          </td>
          <td>{{ l.apellido1Titular }} {{ l.apellido2Titular || '' }}, {{ l.nombreTitular }}</td>
          <td><code style="background:#f1f5f9;">{{ l.dniTitular || '---' }}</code></td>
          <td><small>{{ l.fechaAlta | date:'dd/MM/yyyy' }}</small></td>
          <td style="text-align: right; white-space: nowrap;">
            <a
              [routerLink]="['/locales', l.idLocal]"
              class="action-badge"
              style="background:#3498db;"
              title="Ver ficha técnica"
            >👁️</a>
            <a
              [routerLink]="['/locales', l.idLocal, 'editar']"
              class="action-badge badge-edit"
              title="Editar local"
            >✏️</a>
            <button
              class="action-badge badge-delete"
              style="border:none; cursor:pointer;"
              title="Eliminar"
              (click)="eliminar(l)"
            >🗑️</button>
          </td>
        </tr>
        <tr *ngIf="filtrados.length === 0">
          <td colspan="8" style="text-align:center; padding:40px; color:#64748b;">
            No se encontraron locales con los criterios de búsqueda.
          </td>
        </tr>
      </tbody>
    </table>

    <div class="modal-overlay" *ngIf="modalVisible" (click)="onOverlayClick($event)">
      <div class="modal-bubble modal-form" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Nuevo Local</h2>
          <button type="button" class="close-btn" (click)="cerrarModal()">✕</button>
        </div>
        <form [formGroup]="formModal" (ngSubmit)="guardarNuevo()">
          <div class="modal-grid">
            <div class="modal-field">
              <label>ID Cliente *</label>
              <input type="number" formControlName="idCliente" />
            </div>
            <div class="modal-field">
              <label>Nombre titular *</label>
              <input type="text" formControlName="nombreTitular" />
            </div>
            <div class="modal-field">
              <label>Apellido1 titular *</label>
              <input type="text" formControlName="apellido1Titular" />
            </div>
            <div class="modal-field">
              <label>Apellido2 titular</label>
              <input type="text" formControlName="apellido2Titular" />
            </div>
            <div class="modal-field full">
              <label>Dirección completa *</label>
              <input type="text" formControlName="direccionCompleta" />
            </div>
            <div class="modal-field">
              <label>CUPS</label>
              <input type="text" formControlName="cups" />
            </div>
            <div class="modal-field">
              <label>Ref. catastral</label>
              <input type="text" formControlName="referenciaCatastral" />
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
    .modal-form { max-width: 720px; width: 90%; text-align: left; }
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
export class LocalListComponent implements OnInit {
    locales: Local[] = [];
    filtrados: Local[] = [];
    filtro = '';
    modalVisible = false;
    guardando = false;
    formModal: FormGroup;

    constructor(private service: LocalService, private fb: FormBuilder) {
        this.formModal = this.fb.group({
            idCliente: [null, Validators.required],
            nombreTitular: ['', Validators.required],
            apellido1Titular: ['', Validators.required],
            apellido2Titular: [''],
            direccionCompleta: ['', Validators.required],
            cups: [''],
            referenciaCatastral: [''],
        });
    }

    ngOnInit() {
        this.service.getAll().subscribe(data => {
            this.locales = data;
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
        const v = this.formModal.value;
        const payload = {
            idCliente: v.idCliente,
            nombreTitular: v.nombreTitular,
            apellido1Titular: v.apellido1Titular,
            apellido2Titular: v.apellido2Titular || null,
            direccionCompleta: v.direccionCompleta,
            cups: v.cups || null,
            referenciaCatastral: v.referenciaCatastral || null
        };
        this.service.create(payload as any).subscribe({
            next: (created) => {
                this.guardando = false;
                this.cerrarModal();
                this.locales = [created, ...this.locales];
                this.aplicarFiltro();
                Swal.fire('Guardado', 'Local creado correctamente.', 'success');
            },
            error: (e) => {
                this.guardando = false;
                Swal.fire('Error', e?.error?.message || 'No se pudo crear el local.', 'error');
            }
        });
    }

    aplicarFiltro() {
        const term = this.filtro.trim().toLowerCase();
        if (!term) {
            this.filtrados = this.locales;
            return;
        }
        this.filtrados = this.locales.filter(l =>
            (l.direccionCompleta && l.direccionCompleta.toLowerCase().includes(term)) ||
            (l.nombreTitular && l.nombreTitular.toLowerCase().includes(term)) ||
            (l.apellido1Titular && l.apellido1Titular.toLowerCase().includes(term)) ||
            (l.cups && l.cups.toLowerCase().includes(term)) ||
            (l.referenciaCatastral && l.referenciaCatastral.toLowerCase().includes(term))
        );
    }

    eliminar(l: Local) {
        if (!l.idLocal) return;
        Swal.fire({
            title: '¿Eliminar local?',
            text: `¿Seguro que deseas eliminar el local #${l.idLocal}? Se borrarán también sus contratos asociados.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#1e293b',
            cancelButtonText: 'Cancelar',
        }).then((res) => {
            if (!res.isConfirmed) return;
            this.service.delete(l.idLocal!).subscribe({
                next: () => {
                    this.locales = this.locales.filter(x => x.idLocal !== l.idLocal);
                    this.aplicarFiltro();
                    Swal.fire('Eliminado', 'Local borrado correctamente.', 'success');
                },
                error: () => Swal.fire('Error', 'No se pudo eliminar el local.', 'error'),
            });
        });
    }

    buildCatastroUrl(fullRc: string): string {
        const rc14 = fullRc.substring(0, 14);
        return `https://www1.sedecatastro.gob.es/Cartografia/mapa.aspx?refcat=${encodeURIComponent(rc14)}&RCCompleta=${encodeURIComponent(fullRc)}&from=OVCBusqueda&pest=rc`;
    }

    buildMapsUrl(direccion: string): string {
        return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(direccion || '');
    }
}
