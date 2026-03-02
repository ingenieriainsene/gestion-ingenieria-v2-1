import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LocalService, ClienteService, Local, Cliente } from '../../services/domain.services';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-local-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, AutocompleteComponent],
  template: `
    <div class="header-bar">
      <h1>Gestión de Locales</h1>
      <button type="button" class="btn-primary" (click)="abrirModalNuevo()">+ Nuevo Local</button>
    </div>

    <div class="filter-card">
      <div class="filter-toolbar single-search">
        <div class="filter-group search-locales">
          <label>Buscar</label>
          <div class="input-with-icon">
            <span class="icon">🔍</span>
            <input
              type="text"
              [(ngModel)]="filtro"
              (ngModelChange)="aplicarFiltro()"
              placeholder="Buscar por dirección, titular, CUPS o Referencia..."
            />
          </div>
        </div>
        <button class="btn-clear" (click)="aplicarFiltro()">Filtrar</button>
      </div>
    </div>

    <div class="table-container">
      <table class="table-card">
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
            <td data-label="ID"><strong>#{{ l.idLocal }}</strong></td>
            <td data-label="Dirección">
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
            <td data-label="CUPS"><code class="code-pill">{{ l.cups || '---' }}</code></td>
            <td data-label="Ref. catastral">
              <ng-container *ngIf="l.referenciaCatastral; else noRc">
                <a
                  class="catastro-link code-pill"
                  target="_blank"
                  [href]="buildCatastroUrl(l.referenciaCatastral!)"
                >
                  📑 {{ l.referenciaCatastral }}
                </a>
              </ng-container>
              <ng-template #noRc>
                <span class="muted">---</span>
              </ng-template>
            </td>
            <td data-label="Titular">{{ l.apellido1Titular }} {{ l.apellido2Titular || '' }}, {{ l.nombreTitular }}</td>
            <td data-label="DNI titular"><code class="code-pill">{{ l.dniTitular || '---' }}</code></td>
            <td data-label="Fecha alta"><small>{{ l.fechaAlta | date:'dd/MM/yyyy' }}</small></td>
            <td data-label="Acciones" class="actions-cell">
              <a
                [routerLink]="['/locales', l.idLocal]"
                class="action-ghost"
                title="Ver ficha técnica"
              >👁️</a>
              <a
                [routerLink]="['/locales', l.idLocal, 'editar']"
                class="action-ghost edit"
                title="Editar local"
              >✏️</a>
              <button
                class="action-ghost danger"
                title="Eliminar"
                (click)="eliminar(l)"
              >🗑️</button>
            </td>
          </tr>
          <tr *ngIf="filtrados.length === 0">
            <td colspan="8" class="empty-state">
              No se encontraron locales con los criterios de búsqueda.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Nuevo Local -->
    <div class="modal-overlay" *ngIf="modalVisible" (click)="onOverlayClick($event)">
      <div class="modal-bubble modal-form" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Nuevo Local</h2>
          <button type="button" class="close-btn" (click)="cerrarModal()">✕</button>
        </div>
        <form [formGroup]="formModal" (ngSubmit)="guardarNuevo()">
          <div class="modal-grid">
            <div class="modal-field full">
              <label>Vincular a Cliente (Opcional)</label>
              <app-autocomplete
                formControlName="idCliente"
                [data]="clientes"
                [searchProps]="['nombre', 'apellido1', 'dni', 'email']"
                valueProp="idCliente"
                [displayFn]="displayCliente"
                placeholder="Buscar cliente por nombre o DNI..."
              ></app-autocomplete>
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
              <label>Ref. catastral *</label>
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
  `,
  styles: [`
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .header-bar h1 {
      font-size: 1.8rem;
      color: #0f172a;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.3px;
    }

    .filter-card {
      background: #ffffff;
      padding: 18px 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin-bottom: 18px;
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
    }

    .filter-toolbar {
      display: flex;
      gap: 16px;
      align-items: flex-end;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    .filter-group label {
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .input-with-icon {
      position: relative;
    }

    .input-with-icon .icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #94a3b8;
      font-size: 0.9rem;
    }

    .input-with-icon input {
      width: 100%;
      padding: 10px 12px 10px 34px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      font-size: 0.9rem;
      background: #f8fafc;
      transition: all 0.2s;
      outline: none;
      box-sizing: border-box;
    }

    .input-with-icon input:focus {
      border-color: #3b82f6;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
    }

    .btn-clear {
      padding: 10px 16px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
      height: 42px;
    }

    .btn-clear:hover {
      background: #eef2f7;
      color: #1e293b;
    }

    .table-container {
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
    }

    .table-card {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }

    .table-card thead th {
      background: #f9fafb;
      padding: 14px 18px;
      font-size: 0.7rem;
      font-weight: 800;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }

    .table-card td {
      padding: 16px 18px;
      border-bottom: 1px solid #f1f5f9;
      color: #0f172a;
      font-size: 0.9rem;
      vertical-align: middle;
    }

    .table-card tr:hover td {
      background: #f8fafc;
    }

    .code-pill {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 999px;
      background: #eef2ff;
      color: #1e293b;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 0.75rem;
      font-weight: 700;
      border: 1px solid #e2e8f0;
      text-decoration: none;
    }

    .maps-link {
      color: #2563eb;
      text-decoration: none;
      font-weight: 600;
    }

    .maps-link:hover {
      text-decoration: underline;
      color: #1d4ed8;
    }

    .catastro-link {
      text-decoration: none;
    }

    .muted {
      color: #94a3b8;
    }

    .actions-cell {
      text-align: right;
      white-space: nowrap;
    }

    .action-ghost {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 999px;
      border: none;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
      margin-left: 6px;
      font-size: 1rem;
    }

    .action-ghost:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .action-ghost.edit:hover {
      background: #eff6ff;
      color: #1d4ed8;
    }

    .action-ghost.danger:hover {
      background: #fee2e2;
      color: #b91c1c;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #94a3b8;
      font-style: italic;
    }

    .modal-form { max-width: 720px; width: 90%; text-align: left; background: white; border-radius: 16px; padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
    .modal-header h2 { margin: 0; font-size: 1.5rem; color: #1e293b; }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #94a3b8; }
    .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .modal-field { display: flex; flex-direction: column; gap: 6px; }
    .modal-field.full { grid-column: span 2; }
    .modal-field label { font-size: 0.9rem; font-weight: 600; color: #475569; }
    .modal-field input {
      padding: 0.75rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      font-family: inherit;
      width: 100%;
      box-sizing: border-box;
      background: #f8fafc;
    }
    .modal-field input:focus { outline: none; border-color: #3b82f6; background: white; }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 1.5rem; }
    .btn-primary { background: #1e293b; color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 6px rgba(30,41,59,0.2); }
    .btn-primary:disabled { background: #cbd5e1; cursor: not-allowed; }
    .btn-secondary { background: #f1f5f9; color: #475569; padding: 10px 18px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer; font-weight: 600; }
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }

    @media (max-width: 768px) {
      .header-bar {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .filter-toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      .btn-clear {
        width: 100%;
      }

      .modal-grid {
        grid-template-columns: 1fr;
      }

      .modal-actions {
        flex-direction: column;
      }
    }
  `]
})
export class LocalListComponent implements OnInit {
  locales: Local[] = [];
  filtrados: Local[] = [];
  clientes: Cliente[] = [];
  filtro = '';
  modalVisible = false;
  guardando = false;
  formModal: FormGroup;

  constructor(
    private service: LocalService,
    private clienteService: ClienteService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.formModal = this.fb.group({
      idCliente: [null],
      nombreTitular: ['', Validators.required],
      apellido1Titular: ['', Validators.required],
      apellido2Titular: [''],
      direccionCompleta: ['', Validators.required],
      cups: [''],
      referenciaCatastral: ['', Validators.required],
    });

    // Validar RC en tiempo real en el modal
    this.formModal.get('referenciaCatastral')?.valueChanges.subscribe(val => {
      if (val && val.length > 5) {
        this.service.checkRC(val).subscribe({
          next: (existente) => {
            if (existente) {
              let htmlMsg = `<p>Ya existe un local con la Referencia Catastral: <b>${val}</b></p>`;
              if (existente.idLocal) {
                htmlMsg += `<p><a href="/locales/${existente.idLocal}" target="_blank" style="color: #3b82f6; text-decoration: underline;">Haz clic aquí para ver la ficha del local existente</a></p>`;
              }
              Swal.fire({
                title: 'Local duplicado',
                html: htmlMsg,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ir al Local Existente',
                cancelButtonText: 'Cerrar'
              }).then((result) => {
                if (result.isConfirmed) {
                  this.cerrarModal();
                  this.router.navigate(['/locales', existente.idLocal]);
                }
              });
            }
          },
          error: () => { }
        });
      }
    });

    // Autofill titular data
    this.formModal.get('idCliente')?.valueChanges.subscribe(val => {
      if (val) {
        const selectedCliente = this.clientes.find(c => c.idCliente === val);
        if (selectedCliente) {
          this.formModal.patchValue({
            nombreTitular: selectedCliente.nombre,
            apellido1Titular: selectedCliente.apellido1,
            apellido2Titular: selectedCliente.apellido2 || ''
          });
        }
      }
    });
  }

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.service.getAll().subscribe(data => {
      this.locales = data;
      this.filtrados = data;
    });
    this.clienteService.getAll().subscribe(data => {
      this.clientes = data;
    });
  }

  displayCliente(c: Cliente): string {
    return c ? `${c.nombre} ${c.apellido1} (${c.dni})` : '';
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
      referenciaCatastral: v.referenciaCatastral
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
        const msg = typeof e.error === 'string' ? e.error : (e.error?.message || 'No se pudo crear el local.');
        Swal.fire('Error', msg, 'error');
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
