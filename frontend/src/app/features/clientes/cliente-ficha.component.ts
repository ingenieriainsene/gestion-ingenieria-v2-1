import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClienteService } from '../../services/domain.services';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-cliente-ficha',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    template: `
    <div class="ficha-wrapper">
      <div class="header-section">
        <a [routerLink]="idCliente ? ['/clientes', idCliente] : ['/clientes']" class="back-link">
          <span class="icon">←</span> {{ idCliente ? 'Volver a la ficha' : 'Volver al listado' }}
        </a>
        <h2>{{ idCliente ? 'Editar Cliente' : 'Nuevo Cliente' }}</h2>
        <p class="subtitle">Complete la información personal y fiscal del cliente.</p>
      </div>

      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="save()" class="modern-form">
          <div class="form-grid">
            <!-- DNI/CIF -->
            <div class="form-group">
              <label class="form-label" for="dni">DNI / CIF <span class="required">*</span></label>
              <div class="input-wrapper">
                <span class="input-icon">🆔</span>
                <input
                  type="text"
                  id="dni"
                  class="form-control"
                  formControlName="dni"
                  placeholder="Documento de identidad"
                />
              </div>
            </div>

            <!-- Nombre -->
            <div class="form-group">
              <label class="form-label" for="nombre">Nombre <span class="required">*</span></label>
              <div class="input-wrapper">
                <span class="input-icon">👤</span>
                <input
                  type="text"
                  id="nombre"
                  class="form-control"
                  formControlName="nombre"
                  placeholder="Nombre del cliente"
                />
              </div>
            </div>

            <!-- Primer Apellido -->
            <div class="form-group">
              <label class="form-label" for="apellido1">Primer Apellido <span class="required">*</span></label>
              <div class="input-wrapper">
                <span class="input-icon">📝</span>
                <input
                  type="text"
                  id="apellido1"
                  class="form-control"
                  formControlName="apellido1"
                  placeholder="Primer apellido"
                />
              </div>
            </div>

            <!-- Segundo Apellido -->
            <div class="form-group">
              <label class="form-label" for="apellido2">Segundo Apellido</label>
              <div class="input-wrapper">
                <span class="input-icon">📝</span>
                <input
                  type="text"
                  id="apellido2"
                  class="form-control"
                  formControlName="apellido2"
                  placeholder="Segundo apellido (opcional)"
                />
              </div>
            </div>

            <!-- Dirección Fiscal -->
            <div class="form-group full-width">
              <label class="form-label" for="direccionFiscalCompleta">Dirección Fiscal Completa</label>
              <div class="input-wrapper">
                <span class="input-icon">📍</span>
                <input
                  type="text"
                  id="direccionFiscalCompleta"
                  class="form-control"
                  formControlName="direccionFiscalCompleta"
                  placeholder="Dirección completa"
                />
              </div>
            </div>

            <!-- Código Postal -->
            <div class="form-group">
              <label class="form-label" for="codigoPostal">Código Postal</label>
              <div class="input-wrapper">
                <span class="input-icon">📮</span>
                <input
                  type="text"
                  id="codigoPostal"
                  class="form-control"
                  formControlName="codigoPostal"
                  placeholder="CP"
                />
              </div>
            </div>

            <!-- Cuenta Bancaria -->
            <div class="form-group">
              <label class="form-label" for="cuentaBancaria">Cuenta Bancaria (IBAN)</label>
              <div class="input-wrapper">
                <span class="input-icon">🏦</span>
                <input
                  type="text"
                  id="cuentaBancaria"
                  class="form-control"
                  formControlName="cuentaBancaria"
                  placeholder="ESXX XXXX XXXX XXXX XXXX"
                />
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" [routerLink]="idCliente ? ['/clientes', idCliente] : ['/clientes']" class="btn-cancel">Cancelar</button>
            <button
              type="submit"
              class="btn-save"
              [disabled]="form.invalid"
            >
              {{ idCliente ? 'Guardar Cambios' : 'Crear Cliente' }}
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
export class ClienteFichaComponent implements OnInit {
    form: FormGroup;
    idCliente: number | null = null;

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private service: ClienteService,
        private router: Router
    ) {
        this.form = this.fb.group({
            nombre: ['', Validators.required],
            apellido1: ['', Validators.required],
            apellido2: [''],
            dni: ['', Validators.required],
            codigoPostal: [''],
            direccionFiscalCompleta: [''],
            cuentaBancaria: ['']
        });
    }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id && id !== 'nuevo') {
            this.idCliente = +id;
            this.service.getById(this.idCliente).subscribe(cliente => {
                this.form.patchValue(cliente);
            });
        }
    }

    save() {
        if (this.form.invalid) return;
        const value = this.form.value;
        if (this.idCliente) {
            this.service.update(this.idCliente, value).subscribe(() => {
                Swal.fire('Guardado', 'Cliente actualizado correctamente', 'success')
                    .then(() => this.router.navigate(['/clientes']));
            });
        } else {
            this.service.create(value).subscribe(() => {
                Swal.fire('Guardado', 'Cliente guardado correctamente', 'success')
                    .then(() => this.router.navigate(['/clientes']));
            });
        }
    }
}
