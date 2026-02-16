import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContratoService, ClienteService, LocalService, Contrato, Cliente, Local } from '../../services/domain.services';
import Swal from 'sweetalert2';

import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';

@Component({
  selector: 'app-contrato-ficha',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AutocompleteComponent],
  template: `
    <div class="ficha-wrapper">
      <div class="header-section">
        <a [routerLink]="idContrato ? ['/contratos', idContrato] : ['/contratos']" class="back-link">
          <span class="icon">←</span> {{ idContrato ? 'Volver al contrato' : 'Volver al listado' }}
        </a>
        <h2>{{ idContrato ? 'Editar Contrato' : 'Nuevo Contrato' }}</h2>
        <p class="subtitle">{{ idContrato ? 'Modifique los datos del contrato.' : 'Complete la información para registrar un nuevo contrato.' }}</p>
        
        <div *ngIf="idContrato" class="header-actions">
           <button type="button" class="btn-delete-header" (click)="eliminarContrato()">
             🗑️ Eliminar Contrato
           </button>
        </div>
      </div>

      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="save()" class="modern-form">
          <div class="form-grid">
            <!-- Cliente -->
            <div class="form-group">
              <label class="form-label">Cliente <span class="required">*</span></label>
              <div class="select-wrapper">
                <app-autocomplete
                    formControlName="idCliente"
                    [data]="clientes"
                    [searchProps]="['nombre', 'apellido1', 'dni', 'email']"
                    valueProp="idCliente"
                    [displayFn]="displayCliente"
                    placeholder="Buscar cliente por nombre o DNI..."
                    (ngModelChange)="onClienteChange()"
                ></app-autocomplete>
              </div>
            </div>

            <!-- Local -->
            <!-- Local -->
            <div class="form-group">
              <label class="form-label">Local / Suministro <span class="required">*</span></label>
              <div class="select-wrapper">
                <app-autocomplete
                    formControlName="idLocal"
                    [data]="localesFiltrados"
                    [searchProps]="['nombreTitular', 'direccionCompleta', 'referenciaCatastral']"
                    valueProp="idLocal"
                    [displayFn]="displayLocal"
                    placeholder="Buscar local por dirección o titular..."
                    (ngModelChange)="onLocalChange()"
                ></app-autocomplete>
              </div>
              <small class="form-help" *ngIf="!form.get('idCliente')?.value">Puede buscar un local directamente para auto-seleccionar el cliente.</small>
            </div>

            <!-- Tipo de Contrato -->
            <div class="form-group">
              <label class="form-label">Tipo de Servicio <span class="required">*</span></label>
              <select class="form-control" formControlName="tipoContrato">
                <option value="">-- Seleccionar --</option>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Obra Nueva">Obra Nueva</option>
                <option value="Reforma">Reforma</option>
                <option value="Legalización">Legalización</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <!-- Fechas -->
            <div class="form-group">
              <label class="form-label">Fecha Inicio <span class="required">*</span></label>
              <input type="date" class="form-control" formControlName="fechaInicio" />
            </div>

            <div class="form-group">
              <label class="form-label">Fecha Vencimiento <span class="required">*</span></label>
              <input type="date" class="form-control" formControlName="fechaVencimiento" />
            </div>
          </div>

          <div class="separator"></div>

          <!-- Datos Técnicos (Checks) -->
          <div class="form-row full-width">
             <label class="form-label section-label">Datos Técnicos / Hitos</label>
             <div class="checks-grid">
                <label class="check-pill"><input type="checkbox" formControlName="cePrevio"> CE Previo</label>
                <label class="check-pill"><input type="checkbox" formControlName="mtd"> MTD</label>
                <label class="check-pill"><input type="checkbox" formControlName="cePost"> CE Post</label>
                <label class="check-pill"><input type="checkbox" formControlName="planos"> Planos</label>
                <label class="check-pill"><input type="checkbox" formControlName="enviadoCeePost"> Enviado CEE Post</label>
                <label class="check-pill"><input type="checkbox" formControlName="licenciaObras"> Licencia Obras</label>
                <label class="check-pill"><input type="checkbox" formControlName="subvencionEstado"> Subvención</label>
                <label class="check-pill"><input type="checkbox" formControlName="libroEdifIncluido"> Libro Edificio</label>
             </div>
          </div>

          <div class="separator"></div>

          <!-- Observaciones -->
          <div class="form-group full-width">
            <label class="form-label">Observaciones</label>
            <textarea class="form-control" formControlName="observaciones" rows="4" placeholder="Notas adicionales del contrato..."></textarea>
          </div>

          <div class="form-actions">
            <button type="button" [routerLink]="idContrato ? ['/contratos', idContrato] : ['/contratos']" class="btn-cancel">Cancelar</button>
            <button type="submit" class="btn-save" [disabled]="form.invalid || loading">
              {{ idContrato ? 'Guardar Cambios' : 'Crear Contrato' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Links rápidos si es edición -->
      <div *ngIf="idContrato" class="quick-links">
         <h3>Accesos Directos</h3>
         <div class="links-grid">
           <a [routerLink]="['/contratos', idContrato, 'tramites']" class="quick-link-card">
              <span class="icon">📂</span>
              <span class="text">Ver Intervenciones / Trámites</span>
           </a>
           <a [routerLink]="['/contratos', idContrato, 'planificacion']" class="quick-link-card">
              <span class="icon">📅</span>
              <span class="text">Planificación de Mantenimiento</span>
           </a>
         </div>
      </div>
    </div>
  `,
  styles: [`
    .ficha-wrapper {
      max-width: 1000px;
      margin: 0 auto;
      padding-bottom: 3rem;
      animation: fadeIn 0.4s ease-out;
    }

    .header-section {
      text-align: center;
      margin-bottom: 2rem;
      padding-top: 1rem;
      position: relative;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #64748b;
      text-decoration: none;
      font-weight: 500;
      margin-bottom: 1rem;
      transition: color 0.2s;
    }
    .back-link:hover { color: #3b82f6; }

    .header-section h2 {
      font-size: 2rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      color: #64748b;
      font-size: 1.1rem;
    }
    
    .header-actions {
      position: absolute;
      right: 0;
      top: 1rem;
    }
    
    .btn-delete-header {
      padding: 0.5rem 1rem;
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.2s;
    }
    .btn-delete-header:hover {
      background: #fecaca;
      color: #b91c1c;
    }

    .form-card {
      background: white;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
      padding: 2.5rem;
    }

    .modern-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .full-width { grid-column: 1 / -1; }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: #334155;
    }
    .section-label {
      font-size: 1rem;
      color: #1e293b;
      margin-bottom: 1rem;
      border-bottom: 2px solid #f1c40f;
      display: inline-block;
      padding-bottom: 0.25rem;
    }

    .required { color: #ef4444; }

    .form-control {
      padding: 0.75rem 1rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.95rem;
      transition: all 0.2s;
      background: #f8fafc;
      box-sizing: border-box;
      width: 100%;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      background: white;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .select-wrapper {
      position: relative;
    }

    .form-help {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .separator {
      height: 1px;
      background: #e2e8f0;
      margin: 1rem 0;
    }

    /* Checks Grid */
    .checks-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .check-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #f1f5f9;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #475569;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s;
    }
    .check-pill:hover { background: #e2e8f0; }
    .check-pill:has(input:checked) {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #1d4ed8;
      font-weight: 600;
    }
    .check-pill input { accent-color: #3b82f6; width: 16px; height: 16px; margin: 0; }

    /* Actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 1rem;
    }

    .btn-cancel {
      padding: 0.75rem 1.5rem;
      background: white;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      text-decoration: none;
    }
    .btn-cancel:hover { background: #f8fafc; color: #334155; }

    .btn-save {
      padding: 0.75rem 2rem;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }
    .btn-save:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.3);
    }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
    
    /* Quick Links */
    .quick-links { margin-top: 3rem; border-top: 1px solid #e2e8f0; padding-top: 2rem; }
    .quick-links h3 { color: #64748b; font-size: 1rem; margin-bottom: 1rem; text-transform: uppercase; }
    .links-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; }
    .quick-link-card {
       display: flex; align-items: center; gap: 1rem; padding: 1.5rem;
       background: white; border: 1px solid #e2e8f0; border-radius: 12px;
       text-decoration: none; color: #1e293b; font-weight: 600;
       transition: all 0.2s;
    }
    .quick-link-card:hover {
       border-color: #3b82f6; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1); transform: translateY(-2px);
    }
    .quick-link-card .icon { font-size: 1.5rem; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @media (max-width: 768px) {
       .header-actions { position: static; margin-top: 1rem; }
       .form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ContratoFichaComponent implements OnInit {
  form: FormGroup;
  idContrato: number | null = null;
  loading = false;
  clientes: Cliente[] = [];
  locales: Local[] = [];
  localesFiltrados: Local[] = [];

  constructor(
    private fb: FormBuilder,
    private contratoService: ContratoService,
    private clienteService: ClienteService,
    private localService: LocalService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      idCliente: [null, Validators.required],
      idLocal: [null, Validators.required],
      tipoContrato: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaVencimiento: ['', Validators.required],
      observaciones: [''],
      // Checks
      cePrevio: [false],
      cePost: [false],
      mtd: [false],
      planos: [false],
      enviadoCeePost: [false],
      licenciaObras: [false],
      subvencionEstado: [false],
      libroEdifIncluido: [false]
    });
  }

  ngOnInit(): void {
    // Load dependencies first
    this.loadDependencies();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'nuevo') {
        this.idContrato = +id;
        this.loadContrato(this.idContrato);
      }
    });
  }

  loadDependencies() {
    this.clienteService.getAll().subscribe(res => {
      this.clientes = res;
      this.checkInitialLoad();
    });
    this.localService.getAll().subscribe(res => {
      this.locales = res;
      this.checkInitialLoad();
    });
  }

  // Ensure we filter locales only after both contract (if editing) and locales are loaded
  private dependenciesLoaded = 0;
  private contractLoaded = false;

  checkInitialLoad() {
    this.dependenciesLoaded++;
    if (this.dependenciesLoaded >= 2) {
      if (this.idContrato && this.contractLoaded) {
        // If editing, filter locals for the current client but keeping the current local valid
        this.filterLocales(this.form.get('idCliente')?.value);
      } else if (!this.idContrato) {
        // If new, show ALL locales initially
        this.localesFiltrados = this.locales;
      }
    }
  }

  loadContrato(id: number) {
    this.loading = true;
    this.contratoService.getById(id).subscribe({
      next: (c) => {
        this.loading = false;
        this.contractLoaded = true;

        // Map string 'Realizado'/'Concedida' to boolean checks if needed
        this.form.patchValue({
          idCliente: c.idCliente,
          idLocal: c.idLocal,
          tipoContrato: c.tipoContrato,
          fechaInicio: this.formatDate(c.fechaInicio),
          fechaVencimiento: this.formatDate(c.fechaVencimiento),
          observaciones: c.observaciones || '',
          cePrevio: c.cePrevio === 'Realizado',
          cePost: c.cePost === 'Realizado',
          mtd: !!c.mtd,
          planos: !!c.planos,
          enviadoCeePost: !!c.enviadoCeePost,
          licenciaObras: c.licenciaObras === 'Concedida',
          subvencionEstado: c.subvencionEstado === 'Concedida',
          libroEdifIncluido: !!c.libroEdifIncluido
        });

        // Filter locales for the loaded client if dependencies are ready
        if (this.dependenciesLoaded >= 2) {
          this.filterLocales(c.idCliente);
        }
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudo cargar el contrato.', 'error');
        this.router.navigate(['/contratos']);
      }
    });
  }

  onClienteChange() {
    const selectedClientId = this.form.get('idCliente')?.value;
    const currentLocalId = this.form.get('idLocal')?.value;

    // If we have a local selected, check if it belongs to the new client
    if (currentLocalId) {
      const local = this.locales.find(l => l.idLocal === currentLocalId);
      // If local doesn't belong to new client, clear it
      if (local && local.idCliente !== selectedClientId &&
        (!local.cliente || local.cliente.idCliente !== selectedClientId)) {
        this.form.get('idLocal')?.setValue(null);
      }
    }

    this.filterLocales(selectedClientId);
  }

  onLocalChange() {
    const selectedLocalId = this.form.get('idLocal')?.value;
    if (selectedLocalId) {
      const local = this.locales.find(l => l.idLocal === selectedLocalId);
      if (local) {
        const clientId = local.idCliente || local.cliente?.idCliente;
        const currentClientId = this.form.get('idCliente')?.value;
        // If local has a client and it's different from selected, update client
        if (clientId && clientId !== currentClientId) {
          this.form.get('idCliente')?.setValue(clientId);
          this.filterLocales(clientId);
        }
      }
    }
  }

  filterLocales(clientId: number | null) {
    if (clientId && this.locales.length > 0) {
      this.localesFiltrados = this.locales.filter(l =>
        l.idCliente === clientId ||
        (l.cliente && l.cliente.idCliente === clientId)
      );
    } else {
      // If no client selected, show ALL locales to allow global search
      this.localesFiltrados = this.locales;
    }
  }

  eliminarContrato() {
    if (!this.idContrato) return;
    Swal.fire({
      title: '¿Eliminar Contrato?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(res => {
      if (res.isConfirmed) {
        this.contratoService.delete(this.idContrato!).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Contrato eliminado.', 'success');
            this.router.navigate(['/contratos']);
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar el contrato.', 'error')
        });
      }
    });
  }

  save() {
    if (this.form.invalid) return;
    this.loading = true;
    const v = this.form.value;

    // Map booleans/forms back to payload
    const payload: Contrato = {
      idCliente: v.idCliente,
      idLocal: v.idLocal,
      tipoContrato: v.tipoContrato,
      fechaInicio: v.fechaInicio,
      fechaVencimiento: v.fechaVencimiento,
      observaciones: v.observaciones,
      // Booleans mapped to strings/booleans as per interface/backend logic
      cePrevio: v.cePrevio ? 'Realizado' : 'Pendiente',
      cePost: v.cePost ? 'Realizado' : 'Pendiente',
      mtd: !!v.mtd,
      planos: !!v.planos,
      enviadoCeePost: !!v.enviadoCeePost,
      licenciaObras: v.licenciaObras ? 'Concedida' : 'No requerida',
      subvencionEstado: v.subvencionEstado ? 'Concedida' : 'No solicitada',
      libroEdifIncluido: !!v.libroEdifIncluido
    };

    if (this.idContrato) {
      this.contratoService.update(this.idContrato, payload as any).subscribe({
        next: () => {
          this.loading = false;
          Swal.fire('Guardado', 'Contrato actualizado correctamente.', 'success');
          this.router.navigate(['/contratos', this.idContrato]);
        },
        error: () => {
          this.loading = false;
          Swal.fire('Error', 'No se pudo actualizar el contrato.', 'error');
        }
      });
    } else {
      this.contratoService.create(payload).subscribe({
        next: (created) => {
          this.loading = false;
          Swal.fire('Creado', 'Contrato creado correctamente.', 'success');
          this.router.navigate(['/contratos', created.idContrato]);
        },
        error: () => {
          this.loading = false;
          Swal.fire('Error', 'No se pudo crear el contrato.', 'error');
        }
      });
    }
  }

  private formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    // Handle ISO strings with time
    return dateStr.split('T')[0];
  }

  // Display functions for Autocomplete
  displayCliente(c: Cliente): string {
    if (!c) return '';
    // Use optional chaining or defaults just in case
    return `${c.nombre} ${c.apellido1} (${c.dni})`;
  }

  displayLocal(l: Local): string {
    if (!l) return '';
    return `${l.nombreTitular} - ${l.direccionCompleta}`;
  }
}
