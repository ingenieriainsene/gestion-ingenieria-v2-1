import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LocalService, ClienteService, Cliente, Local } from '../../services/domain.services';
import { AutocompleteComponent } from '../../shared/components/autocomplete/autocomplete.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-local-ficha',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AutocompleteComponent],
  template: `
    <div class="ficha-wrapper">
      <div class="header-section">
        <a [routerLink]="idLocal ? ['/locales', idLocal] : ['/locales']" class="back-link">
          <span class="icon">←</span> {{ idLocal ? 'Volver a la ficha' : 'Volver al listado' }}
        </a>
        <h2>{{ idLocal ? 'Editar Local' : 'Nuevo Local' }}</h2>
        <p class="subtitle">Complete la información del local o punto de suministro.</p>
      </div>

      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="save()" class="modern-form">
          <div class="form-grid">
            <!-- Cliente (Selector) -->
            <div class="form-group">
              <label class="form-label">Vincular a Cliente (Opcional)</label>
              <app-autocomplete
                formControlName="idCliente"
                [data]="clientes"
                [searchProps]="['nombre', 'apellido1', 'dni', 'email']"
                valueProp="idCliente"
                [displayFn]="displayCliente"
                placeholder="Buscar cliente para autocompletar datos..."
              ></app-autocomplete>
            </div>

            <!-- Nombre Titular -->
            <div class="form-group">
              <label class="form-label" for="nombreTitular">Nombre Titular <span class="required">*</span></label>
              <div class="input-wrapper">
                <span class="input-icon">📝</span>
                <input
                  type="text"
                  id="nombreTitular"
                  class="form-control"
                  formControlName="nombreTitular"
                  placeholder="Nombre del titular"
                />
              </div>
            </div>

            <!-- Apellido 1 -->
            <div class="form-group">
              <label class="form-label" for="apellido1Titular">Primer Apellido <span class="required">*</span></label>
              <div class="input-wrapper">
                <span class="input-icon">📝</span>
                <input
                  type="text"
                  id="apellido1Titular"
                  class="form-control"
                  formControlName="apellido1Titular"
                  placeholder="Primer apellido"
                />
              </div>
            </div>

            <!-- Apellido 2 -->
            <div class="form-group">
              <label class="form-label" for="apellido2Titular">Segundo Apellido</label>
              <div class="input-wrapper">
                <span class="input-icon">📝</span>
                <input
                  type="text"
                  id="apellido2Titular"
                  class="form-control"
                  formControlName="apellido2Titular"
                  placeholder="Segundo apellido (opcional)"
                />
              </div>
            </div>

            <!-- Dirección Completa -->
            <div class="form-group full-width">
              <label class="form-label" for="direccionCompleta">Dirección Completa <span class="required">*</span></label>
              <div class="input-wrapper">
                <span class="input-icon">📍</span>
                <input
                  type="text"
                  id="direccionCompleta"
                  class="form-control"
                  formControlName="direccionCompleta"
                  placeholder="Calle, número, piso, puerta..."
                />
              </div>
            </div>

            <!-- Código Postal, Localidad, Provincia -->
            <div class="address-grid full-width">
              <div class="form-group">
                <label class="form-label" for="codigoPostal">C.P.</label>
                <div class="input-wrapper">
                  <span class="input-icon">📮</span>
                  <input type="text" id="codigoPostal" class="form-control" formControlName="codigoPostal" placeholder="C.P." />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="localidad">Localidad</label>
                <div class="input-wrapper">
                  <span class="input-icon">🏢</span>
                  <input type="text" id="localidad" class="form-control" formControlName="localidad" placeholder="Localidad" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label" for="provincia">Provincia</label>
                <div class="input-wrapper">
                  <span class="input-icon">🗺️</span>
                  <input type="text" id="provincia" class="form-control" formControlName="provincia" placeholder="Provincia" />
                </div>
              </div>
            </div>

            <!-- CUPS -->
            <div class="form-group">
              <label class="form-label" for="cups">CUPS</label>
              <div class="input-wrapper">
                <span class="input-icon">⚡</span>
                <input
                  type="text"
                  id="cups"
                  class="form-control"
                  formControlName="cups"
                  placeholder="Código Universal de Punto de Suministro"
                />
              </div>
            </div>

            <!-- Ref. Catastral -->
            <div class="form-group">
              <label class="form-label" for="referenciaCatastral">Ref. Catastral <span class="required">*</span></label>
              <div class="input-wrapper">
                <span class="input-icon">🏠</span>
                <input
                  type="text"
                  id="referenciaCatastral"
                  class="form-control"
                  formControlName="referenciaCatastral"
                  placeholder="Referencia Catastral"
                />
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" [routerLink]="idLocal ? ['/locales', idLocal] : ['/locales']" class="btn-cancel">Cancelar</button>
            <button
              type="submit"
              class="btn-save"
              [disabled]="form.invalid || loading"
            >
              {{ idLocal ? 'Guardar Cambios' : 'Crear Local' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .ficha-wrapper {
      max-width: 900px;
      margin: 0 auto;
      animation: fadeIn 0.4s ease-out;
    }

    .header-section {
      margin-bottom: 2rem;
      text-align: center;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #64748b;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.9rem;
      margin-bottom: 1rem;
      transition: color 0.2s;
    }

    .back-link:hover {
      color: #3b82f6;
    }

    h2 {
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      color: #64748b;
      font-size: 1.1rem;
    }

    .form-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .modern-form {
      padding: 2.5rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    @media (min-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr 1fr;
      }
      .full-width {
        grid-column: span 2;
      }
      .address-grid {
        display: grid;
        grid-template-columns: 1fr 2fr 2fr;
        gap: 1.5rem;
      }
    }

    @media (max-width: 767px) {
      .address-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
    }

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

    .required {
      color: #ef4444;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 1rem;
      font-size: 1.1rem;
      color: #94a3b8;
      pointer-events: none;
      z-index: 10;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      font-size: 0.95rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background-color: #f8fafc;
      transition: all 0.2s ease;
      color: #1e293b;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      background-color: white;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-actions {
      margin-top: 2.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding-top: 1.5rem;
      border-top: 1px solid #f1f5f9;
    }

    .btn-cancel {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      background: white;
      border: 1px solid #cbd5e1;
      color: #64748b;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }

    .btn-cancel:hover {
      background: #f8fafc;
      color: #334155;
      border-color: #94a3b8;
    }

    .btn-save {
      padding: 0.75rem 2rem;
      border-radius: 8px;
      font-weight: 600;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }

    .btn-save:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.3);
    }

    .btn-save:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
      background: #94a3b8;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class LocalFichaComponent implements OnInit {
  form!: FormGroup;
  idLocal: number | null = null;
  clientes: Cliente[] = [];
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: LocalService,
    private clienteService: ClienteService
  ) { }

  ngOnInit() {
    this.initForm();
    this.cargarClientes();

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id && id !== 'nuevo') {
        this.idLocal = +id;
        this.service.getById(this.idLocal).subscribe({
          next: (l: Local) => {
            this.form.patchValue({
              idCliente: l.cliente?.idCliente ?? l.idCliente,
              nombreTitular: l.nombreTitular,
              apellido1Titular: l.apellido1Titular,
              apellido2Titular: l.apellido2Titular ?? '',
              direccionCompleta: l.direccionCompleta,
              codigoPostal: l.codigoPostal ?? '',
              localidad: l.localidad ?? '',
              provincia: l.provincia ?? '',
              cups: l.cups ?? '',
              referenciaCatastral: l.referenciaCatastral ?? ''
            });
          },
          error: () => this.router.navigate(['/locales'])
        });
      } else {
        this.idLocal = null;
        this.route.queryParams.subscribe(qp => {
          if (qp['clienteId']) {
            this.form.patchValue({ idCliente: +qp['clienteId'] });
          }
        });
      }
    });
  }

  private initForm() {
    this.form = this.fb.group({
      idCliente: [null],
      nombreTitular: ['', Validators.required],
      apellido1Titular: ['', Validators.required],
      apellido2Titular: [''],
      direccionCompleta: ['', Validators.required],
      codigoPostal: [''],
      localidad: [''],
      provincia: [''],
      cups: [''],
      referenciaCatastral: ['', Validators.required]
    });

    // Validar RC en tiempo real
    const rcControl = this.form.get('referenciaCatastral');
    if (rcControl) {
      rcControl.valueChanges.subscribe((val: string | null) => {
        if (val && val.length > 5) {
          this.service.checkRC(val).subscribe({
            next: (existente: Local) => {
              if (existente && existente.idLocal !== this.idLocal) {
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
                  if (result.isConfirmed && existente.idLocal) {
                    this.router.navigate(['/locales', existente.idLocal]);
                  }
                });
              }
            },
            error: () => { }
          });
        }
      });
    }

    // Auto-fill Titular when a Cliente is selected
    const idClienteControl = this.form.get('idCliente');
    if (idClienteControl) {
      idClienteControl.valueChanges.subscribe(val => {
        if (val) {
          const selectedCliente = this.clientes.find(c => c.idCliente === val);
          if (selectedCliente) {
            this.form.patchValue({
              nombreTitular: selectedCliente.nombre,
              apellido1Titular: selectedCliente.apellido1,
              apellido2Titular: selectedCliente.apellido2 || ''
            });
          }
        }
      });
    }
  }

  cargarClientes() {
    this.clienteService.getAll().subscribe(res => {
      this.clientes = res;
    });
  }

  displayCliente(c: Cliente): string {
    return c ? `${c.nombre} ${c.apellido1} (${c.dni})` : '';
  }

  save() {
    if (this.form.invalid) return;
    this.loading = true;
    const v = this.form.value;

    const payload: any = {
      idCliente: v.idCliente,
      nombreTitular: v.nombreTitular,
      apellido1Titular: v.apellido1Titular,
      apellido2Titular: v.apellido2Titular || null,
      direccionCompleta: v.direccionCompleta,
      codigoPostal: v.codigoPostal || null,
      localidad: v.localidad || null,
      provincia: v.provincia || null,
      cups: v.cups || null,
      referenciaCatastral: v.referenciaCatastral
    };

    if (this.idLocal) {
      this.service.update(this.idLocal, payload).subscribe({
        next: () => {
          this.loading = false;
          Swal.fire('Guardado', 'Local actualizado correctamente', 'success');
          this.router.navigate(['/locales', this.idLocal]);
        },
        error: (e: any) => {
          this.loading = false;
          const msg = typeof e.error === 'string' ? e.error : (e.error?.message || 'Error al actualizar');
          Swal.fire('Error', msg, 'error');
        }
      });
    } else {
      this.service.create(payload as any).subscribe({
        next: (loc: Local) => {
          this.loading = false;
          Swal.fire('Creado', 'Local registrado correctamente', 'success');
          this.router.navigate(['/locales', loc.idLocal]);
        },
        error: (e: any) => {
          this.loading = false;
          const msg = typeof e.error === 'string' ? e.error : (e.error?.message || 'Error al crear');
          Swal.fire('Error', msg, 'error');
        }
      });
    }
  }
}
