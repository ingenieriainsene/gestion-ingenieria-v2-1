import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ProveedorService,
  ProveedorDetailDTO,
  ProveedorDTO,
  OficioDTO,
  ContactoDTO,
} from '../../services/proveedor.service';
import { AuditStampComponent } from '../../layout/audit-stamp.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-proveedor-ficha',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, AuditStampComponent],
  template: `
    <div class="ficha-wrapper">
      <div class="header-section">
        <a routerLink="/proveedores" class="back-link">
          <span class="icon">←</span> Volver al listado
        </a>
        <h2>{{ id ? 'Editar Proveedor' : 'Nuevo Proveedor' }}</h2>
        <p class="subtitle">Gestión de la información del proveedor, oficios y contactos.</p>
        
        <div *ngIf="id" class="header-actions">
           <button class="btn-delete-header" (click)="eliminarProveedor()">
             🗑️ Eliminar Proveedor
           </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando información...</p>
      </div>

      <div *ngIf="!loading && (detail || !id)" class="form-card">
        <!-- Tabs -->
        <div class="tabs-header">
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab === 'general'" 
            (click)="activeTab = 'general'"
          >
            📋 Datos Generales
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab === 'oficios'" 
            (click)="activeTab = 'oficios'"
            [disabled]="!id"
          >
            🛠️ Oficios
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab === 'contactos'" 
            (click)="activeTab = 'contactos'"
            [disabled]="!id"
          >
            👥 Contactos
          </button>
        </div>

        <div class="tab-content">
          <!-- TAB GENERAL -->
          <div *ngIf="activeTab === 'general'" class="fade-in">
            <form [formGroup]="form" (ngSubmit)="guardarGeneral()" class="modern-form">
              <div class="form-grid">
                <!-- Razón Social -->
                <div class="form-group full-width">
                  <label class="form-label" for="razonSocial">Razón Social</label>
                  <div class="input-wrapper">
                    <span class="input-icon">🏢</span>
                    <input
                      type="text"
                      id="razonSocial"
                      class="form-control"
                      formControlName="razonSocial"
                      placeholder="Razón Social completa"
                    />
                  </div>
                </div>

                <!-- Nombre Comercial -->
                <div class="form-group">
                  <label class="form-label" for="nombreComercial">Nombre Comercial <span class="required">*</span></label>
                  <div class="input-wrapper">
                    <span class="input-icon">🏷️</span>
                    <input
                      type="text"
                      id="nombreComercial"
                      class="form-control"
                      formControlName="nombreComercial"
                      placeholder="Nombre conocido"
                    />
                  </div>
                </div>

                <!-- CIF -->
                <div class="form-group">
                  <label class="form-label" for="cif">CIF / NIF <span class="required">*</span></label>
                  <div class="input-wrapper">
                    <span class="input-icon">🆔</span>
                    <input
                      type="text"
                      id="cif"
                      class="form-control"
                      formControlName="cif"
                      placeholder="Identificación fiscal"
                    />
                  </div>
                </div>

                <!-- Dirección Fiscal -->
                <div class="form-group full-width">
                  <label class="form-label" for="direccionFiscal">Dirección Fiscal</label>
                  <div class="input-wrapper">
                    <span class="input-icon">📍</span>
                    <input
                      type="text"
                      id="direccionFiscal"
                      class="form-control"
                      formControlName="direccionFiscal"
                      placeholder="Dirección completa"
                    />
                  </div>
                </div>

                 <!-- Es Autónomo -->
                <div class="form-group">
                  <label class="form-label">Tipo de Proveedor</label>
                  <label class="checkbox-wrapper">
                    <input type="checkbox" formControlName="esAutonomo" />
                    <span class="checkbox-label">Es profesional autónomo</span>
                  </label>
                </div>

                <!-- Fecha Alta (Solo lectura) -->
                <div class="form-group" *ngIf="id">
                  <label class="form-label">Fecha de Alta</label>
                  <div class="readonly-value">
                    📅 {{ fechaAltaFormatted() }}
                  </div>
                </div>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn-save" [disabled]="form.invalid || guardando">
                  {{ id ? 'Guardar Cambios' : 'Crear Proveedor' }}
                </button>
              </div>
            </form>
          </div>

          <!-- TAB OFICIOS -->
          <div *ngIf="activeTab === 'oficios'" class="fade-in">
            <div class="section-card">
              <h3>Añadir Oficio</h3>
              <div class="add-row">
                <div class="input-wrapper flex-grow">
                  <span class="input-icon">🔧</span>
                  <input 
                    type="text" 
                    class="form-control" 
                    [(ngModel)]="oficioNuevo" 
                    placeholder="Ej. Electricidad, Fontanería..." 
                    (keyup.enter)="agregarOficio()" 
                  />
                </div>
                <button type="button" class="btn-primary-small" (click)="agregarOficio()">
                  + Añadir
                </button>
              </div>
            </div>

            <div class="items-list">
              <div class="item-card" *ngFor="let o of listaOficios">
                <span class="item-name">🛠️ {{ o.oficio }}</span>
                <button type="button" class="btn-icon-delete" (click)="quitarOficio(o)" title="Eliminar">
                  ✕
                </button>
              </div>
              <div *ngIf="listaOficios.length === 0" class="empty-state-small">
                No hay oficios asignados a este proveedor.
              </div>
            </div>
          </div>

          <!-- TAB CONTACTOS -->
          <div *ngIf="activeTab === 'contactos'" class="fade-in">
            <div class="actions-bar">
              <button type="button" class="btn-create-small" (click)="abrirModalContacto()">
                + Nuevo Contacto
              </button>
            </div>

            <div class="table-responsive">
              <table class="modern-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Cargo</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let c of contactos">
                    <td><strong>{{ c.nombre }}</strong></td>
                    <td>{{ c.cargo || '—' }}</td>
                    <td>{{ c.telefono || '—' }}</td>
                    <td>{{ c.email || '—' }}</td>
                    <td class="actions-cell">
                      <button class="action-btn edit" (click)="abrirModalContacto(c)" title="Editar">✏️</button>
                      <button class="action-btn delete" (click)="eliminarContacto(c)" title="Eliminar">🗑️</button>
                    </td>
                  </tr>
                  <tr *ngIf="!contactos.length">
                    <td colspan="5" class="empty-table">No hay contactos registrados.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Contacto -->
    <div class="modal-overlay" [class.active]="modalContacto" (click)="onOverlayClick($event)">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editandoContacto ? 'Editar Contacto' : 'Nuevo Contacto' }}</h3>
          <button class="close-btn" (click)="cerrarModalContacto()">✕</button>
        </div>
        <form [formGroup]="formContacto" (ngSubmit)="guardarContacto()">
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Nombre <span class="required">*</span></label>
              <input type="text" class="form-control" formControlName="nombre" placeholder="Nombre completo" />
            </div>
            <div class="form-group">
              <label class="form-label">Cargo</label>
              <input type="text" class="form-control" formControlName="cargo" placeholder="Puesto o rol" />
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input type="text" class="form-control" formControlName="telefono" placeholder="Teléfono de contacto" />
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" formControlName="email" placeholder="Correo electrónico" />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-cancel" (click)="cerrarModalContacto()">Cancelar</button>
            <button type="submit" class="btn-save" [disabled]="formContacto.invalid">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .ficha-wrapper { max-width: 900px; margin: 0 auto; animation: fadeIn 0.4s ease-out; }
    .header-section { margin-bottom: 2rem; text-align: center; position: relative; }
    .header-actions { position: absolute; right: 0; top: 0; }
    .back-link { display: inline-flex; align-items: center; gap: 0.5rem; color: #64748b; text-decoration: none; font-weight: 500; font-size: 0.9rem; margin-bottom: 1rem; transition: color 0.2s; }
    .back-link:hover { color: #3b82f6; }
    h2 { font-size: 2rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem 0; }
    .subtitle { color: #64748b; font-size: 1.1rem; }
    
    .form-card { background: white; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; overflow: hidden; }
    
    /* Tabs */
    .tabs-header { display: flex; background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 0 1rem; gap: 1rem; overflow-x: auto; }
    .tab-btn { background: none; border: none; padding: 1rem 1.5rem; font-weight: 600; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap; }
    .tab-btn:hover:not(:disabled) { color: #3b82f6; background: #f1f5f9; }
    .tab-btn.active { color: #2563eb; border-bottom-color: #2563eb; background: white; border-top-left-radius: 8px; border-top-right-radius: 8px; box-shadow: 0 -4px 6px -4px rgba(0,0,0,0.05); }
    .tab-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .tab-content { padding: 2rem; }
    .modern-form { display: flex; flex-direction: column; gap: 2rem; }
    .form-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
    @media (min-width: 768px) { .form-grid { grid-template-columns: 1fr 1fr; } .full-width { grid-column: span 2; } }
    
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-label { font-size: 0.9rem; font-weight: 600; color: #334155; }
    .required { color: #ef4444; }
    .input-wrapper { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 1rem; font-size: 1.1rem; color: #94a3b8; pointer-events: none; z-index: 10; }
    .form-control { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; font-size: 0.95rem; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; transition: all 0.2s ease; color: #1e293b; }
    .form-control:focus { outline: none; border-color: #3b82f6; background-color: white; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
    
    .checkbox-wrapper { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; padding: 0.5rem 0; }
    .checkbox-wrapper input[type="checkbox"] { width: 1.25rem; height: 1.25rem; accent-color: #2563eb; cursor: pointer; }
    .readonly-value { padding: 0.75rem 1rem; background: #f1f5f9; border-radius: 8px; color: #475569; font-weight: 500; border: 1px solid #e2e8f0; }
    
    .form-actions { display: flex; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid #f1f5f9; }
    .btn-save { padding: 0.75rem 2rem; border-radius: 8px; font-weight: 600; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
    .btn-save:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.3); }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
    
    .btn-create-small { padding: 0.5rem 1rem; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-create-small:hover { background: #059669; }

    .btn-primary-small { padding: 0 1.5rem; background: #3b82f6; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; height: 45px; }
    .btn-primary-small:hover { background: #2563eb; }

    .btn-delete-header { padding: 0.5rem 1rem; background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all 0.2s; }
    .btn-delete-header:hover { background: #fecaca; color: #b91c1c; }

    /* Oficios & List Styles */
    .section-card { background: #f8fafc; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 1.5rem; }
    .section-card h3 { margin: 0 0 1rem 0; font-size: 1rem; color: #475569; }
    .add-row { display: flex; gap: 1rem; }
    .flex-grow { flex: 1; }
    .items-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
    .item-card { background: white; border: 1px solid #e2e8f0; padding: 0.75rem 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .item-name { font-weight: 600; color: #334155; }
    .btn-icon-delete { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1.1rem; }
    .btn-icon-delete:hover { color: #ef4444; }

    /* Table */
    .table-responsive { overflow-x: auto; border-radius: 8px; border: 1px solid #e2e8f0; }
    .modern-table { width: 100%; border-collapse: collapse; text-align: left; background: white; }
    .modern-table th { background: #f8fafc; padding: 1rem; font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
    .modern-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.9rem; }
    .modern-table tr:last-child td { border-bottom: none; }
    .actions-cell { display: flex; gap: 0.5rem; }
    .action-btn { width: 32px; height: 32px; border-radius: 6px; border: 1px solid transparent; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .action-btn.edit:hover { background: #eff6ff; border-color: #bfdbfe; }
    .action-btn.delete:hover { background: #fef2f2; border-color: #fecaca; }
    .empty-table { padding: 3rem !important; text-align: center; color: #94a3b8; font-style: italic; }

    /* Loading */
    .loading-state { text-align: center; padding: 4rem; color: #64748b; }
    .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem auto; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; z-index: 50; animation: fadeIn 0.2s; }
    .modal-overlay.active { display: flex; }
    .modal-card { background: white; width: 90%; max-width: 500px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    .modal-header { padding: 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; font-size: 1.25rem; color: #1e293b; }
    .close-btn { background: none; border: none; font-size: 1.5rem; color: #64748b; cursor: pointer; }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { padding: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 1rem; background: #f8fafc; }
    .btn-cancel { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; background: white; border: 1px solid #cbd5e1; color: #64748b; cursor: pointer; }
    .btn-cancel:hover { background: #f1f5f9; }

    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class ProveedorFichaComponent implements OnInit {
  activeTab: 'general' | 'oficios' | 'contactos' = 'general';
  id: number | null = null;
  detail: ProveedorDetailDTO | null = null;
  loading = true;
  guardando = false;
  form: FormGroup;
  oficioNuevo = '';
  listaOficios: { id: number; oficio: string }[] = [];
  modalContacto = false;
  editandoContacto: ContactoDTO | null = null;
  formContacto: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: ProveedorService
  ) {
    this.form = this.fb.group({
      nombreComercial: ['', Validators.required],
      razonSocial: [''],
      cif: ['', Validators.required],
      direccionFiscal: [''],
      esAutonomo: [false],
    });
    this.formContacto = this.fb.group({
      nombre: ['', Validators.required],
      cargo: [''],
      telefono: [''],
      email: [''],
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((m) => {
      const idParam = m.get('id');
      if (idParam && idParam !== 'nuevo') {
        this.id = +idParam;
        this.cargar();
      } else if (idParam === 'nuevo' || this.router.url.endsWith('/nuevo')) {
        this.loading = false;
        this.id = null;
      } else {
        this.router.navigate(['/proveedores']);
      }
    });
  }

  cargar(): void {
    if (!this.id) return;
    this.loading = true;
    this.service.getById(this.id).subscribe({
      next: (d) => {
        this.detail = d;
        this.form.patchValue({
          nombreComercial: d.nombreComercial ?? '',
          razonSocial: d.razonSocial ?? '',
          cif: d.cif ?? '',
          direccionFiscal: d.direccionFiscal ?? '',
          esAutonomo: !!d.esAutonomo,
        });
        this.listaOficios = (d.listaOficios ?? []).map((o) => ({ id: o.id, oficio: o.oficio }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudo cargar el proveedor.', 'error');
        this.router.navigate(['/proveedores']);
      },
    });
  }

  guardarGeneral(): void {
    if (!this.id || this.form.invalid || this.guardando) return;
    this.guardando = true;
    const payload: ProveedorDTO = {
      nombreComercial: this.form.get('nombreComercial')!.value,
      cif: this.form.get('cif')!.value,
      razonSocial: this.form.get('razonSocial')!.value || undefined,
      direccionFiscal: this.form.get('direccionFiscal')!.value || undefined,
      esAutonomo: !!this.form.get('esAutonomo')!.value,
    };
    this.service.update(this.id, payload).subscribe({
      next: () => {
        this.guardando = false;
        this.cargar();
        Swal.fire('Guardado', 'Datos generales actualizados.', 'success');
      },
      error: () => {
        this.guardando = false;
        Swal.fire('Error', 'No se pudieron guardar los datos.', 'error');
      },
    });
  }

  agregarOficio(): void {
    const s = (this.oficioNuevo || '').trim();
    if (!s || !this.id) return;
    const nueva = this.listaOficios.map((o) => o.oficio).concat(s);
    this.service.updateOficios(this.id, nueva).subscribe({
      next: () => {
        this.oficioNuevo = '';
        this.cargar();
        Swal.fire('Añadido', 'Oficio añadido.', 'success');
      },
      error: () => Swal.fire('Error', 'No se pudo añadir el oficio.', 'error'),
    });
  }

  quitarOficio(o: { id: number; oficio: string }): void {
    if (!this.id) return;
    Swal.fire({
      title: '¿Eliminar oficio?',
      text: `¿Quitar "${o.oficio}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e293b',
      cancelButtonText: 'Cancelar',
    }).then((res) => {
      if (!res.isConfirmed) return;
      const nueva = this.listaOficios.filter((x) => x.id !== o.id).map((x) => x.oficio);
      this.service.updateOficios(this.id!, nueva).subscribe({
        next: () => {
          this.cargar();
          Swal.fire('Eliminado', 'Oficio quitado.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo eliminar el oficio.', 'error'),
      });
    });
  }

  abrirModalContacto(contacto?: ContactoDTO): void {
    this.editandoContacto = contacto ?? null;
    this.formContacto.reset({
      nombre: contacto?.nombre ?? '',
      cargo: contacto?.cargo ?? '',
      telefono: contacto?.telefono ?? '',
      email: contacto?.email ?? '',
    });
    this.modalContacto = true;
  }

  onOverlayClick(e: Event): void {
    if ((e.target as HTMLElement)?.classList?.contains('modal-overlay')) this.cerrarModalContacto();
  }

  cerrarModalContacto(): void {
    this.modalContacto = false;
    this.editandoContacto = null;
  }

  guardarContacto(): void {
    if (!this.id || this.formContacto.invalid) return;
    const v = this.formContacto.value;
    const c: ContactoDTO = {
      nombre: v.nombre.trim(),
      cargo: v.cargo?.trim() || undefined,
      telefono: v.telefono?.trim() || undefined,
      email: v.email?.trim() || undefined,
    };
    if (this.editandoContacto?.id) {
      this.service.updateContact(this.id, this.editandoContacto.id, c).subscribe({
        next: () => {
          this.cerrarModalContacto();
          this.cargar();
          Swal.fire('Guardado', 'Contacto actualizado.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo actualizar el contacto.', 'error'),
      });
    } else {
      this.service.addContact(this.id, c).subscribe({
        next: () => {
          this.cerrarModalContacto();
          this.cargar();
          Swal.fire('Creado', 'Contacto añadido.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo añadir el contacto.', 'error'),
      });
    }
  }

  eliminarContacto(c: ContactoDTO): void {
    if (!this.id || !c.id) return;
    Swal.fire({
      title: '¿Eliminar contacto?',
      text: `¿Quitar a ${c.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e293b',
      cancelButtonText: 'Cancelar',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.service.deleteContact(this.id!, c.id!).subscribe({
        next: () => {
          this.cargar();
          Swal.fire('Eliminado', 'Contacto borrado.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo eliminar el contacto.', 'error'),
      });
    });
  }

  eliminarProveedor(): void {
    if (!this.id) return;
    Swal.fire({
      title: '¿Eliminar proveedor?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e293b',
      cancelButtonText: 'Cancelar',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.service.delete(this.id!).subscribe({
        next: () => {
          Swal.fire('Eliminado', 'Proveedor borrado.', 'success');
          this.router.navigate(['/proveedores']);
        },
        error: () => Swal.fire('Error', 'No se pudo eliminar el proveedor.', 'error'),
      });
    });
  }

  get contactos(): ContactoDTO[] {
    return this.detail?.listaContactos ?? [];
  }

  fechaAltaFormatted(): string {
    const d = this.detail?.fechaAlta;
    if (!d) return '—';
    const x = new Date(d);
    return isNaN(x.getTime()) ? '—' : x.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
