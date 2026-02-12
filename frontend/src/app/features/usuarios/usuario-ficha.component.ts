import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { Usuario, UsuarioService } from '../../services/usuario.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuario-ficha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="ficha-wrapper">
      <div class="header-section">
        <a routerLink="/usuarios" class="back-link">
          <span class="icon">←</span> Volver
        </a>
        <h2>{{ esNuevo ? 'Crear Nuevo Usuario' : 'Editar Usuario' }}</h2>
        <p class="subtitle">Complete la información para {{ esNuevo ? 'registrar un nuevo miembro' : 'actualizar los datos del miembro' }} del equipo.</p>
      </div>

      <div class="form-card">
        <form (ngSubmit)="guardar()" #formRef="ngForm" class="modern-form">
          <div class="form-grid">
            <!-- Nombre de Usuario -->
            <div class="form-group">
              <label class="form-label" for="nombreUsuario">Nombre de Usuario <span class="required">*</span></label>
              <div class="input-wrapper">
                <span class="input-icon">👤</span>
                <input
                  type="text"
                  id="nombreUsuario"
                  class="form-control"
                  name="nombreUsuario"
                  [(ngModel)]="modelo.nombreUsuario"
                  required
                  minlength="3"
                  placeholder="ej. jgarcia"
                  [disabled]="!esNuevo"
                />
              </div>
              <small class="form-text" *ngIf="!esNuevo">El nombre de usuario no se puede modificar una vez creado.</small>
            </div>

            <!-- Email -->
            <div class="form-group">
              <label class="form-label" for="email">Correo Electrónico</label>
              <div class="input-wrapper">
                <span class="input-icon">✉️</span>
                <input
                  type="email"
                  id="email"
                  class="form-control"
                  name="email"
                  [(ngModel)]="modelo.email"
                  placeholder="ej. jgarcia@empresa.com"
                  email
                />
              </div>
            </div>

            <!-- Rol -->
            <div class="form-group">
              <label class="form-label" for="rol">Rol del Sistema <span class="required">*</span></label>
              <div class="select-wrapper">
                <select
                  class="form-select"
                  id="rol"
                  name="rol"
                  [(ngModel)]="modelo.rol"
                  required
                >
                  <option [ngValue]="'ADMIN'">Administrador</option>
                  <option [ngValue]="'TÉCNICO'">Técnico</option>
                  <option [ngValue]="'LECTURA'">Lectura</option>
                </select>
                <span class="select-arrow">▼</span>
              </div>
              <small class="form-text">Define los permisos de acceso dentro de la aplicación.</small>
            </div>

            <!-- Contraseña -->
            <div class="form-group">
              <label class="form-label" for="password">
                Contraseña <span class="required" *ngIf="esNuevo">*</span>
              </label>
              <div class="input-wrapper">
                <span class="input-icon">🔒</span>
                <input
                  type="password"
                  id="password"
                  class="form-control"
                  name="password"
                  [(ngModel)]="passwordPlain"
                  [required]="esNuevo"
                  minlength="6"
                  placeholder="{{ esNuevo ? 'Ingrese una contraseña segura' : 'Dejar en blanco para mantener la actual' }}"
                />
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" routerLink="/usuarios" class="btn-cancel">Cancelar</button>
            <button
              type="submit"
              class="btn-save"
              [disabled]="formRef.invalid || (!esNuevo && !formRef.dirty && !passwordPlain)"
            >
              {{ esNuevo ? 'Crear Usuario' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .ficha-wrapper {
      max-width: 800px;
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

    .input-wrapper, .select-wrapper {
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

    .form-control, .form-select {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      font-size: 0.95rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background-color: #f8fafc;
      transition: all 0.2s ease;
      color: #1e293b;
    }

    .form-select {
      appearance: none;
      padding-right: 2.5rem;
      cursor: pointer;
    }

    .select-arrow {
      position: absolute;
      right: 1rem;
      font-size: 0.8rem;
      color: #64748b;
      pointer-events: none;
    }

    .form-control:focus, .form-select:focus {
      outline: none;
      border-color: #3b82f6;
      background-color: white;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-control:disabled {
      background-color: #f1f5f9;
      color: #94a3b8;
      cursor: not-allowed;
    }

    .form-text {
      font-size: 0.8rem;
      color: #64748b;
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
export class UsuarioFichaComponent implements OnInit {
  @ViewChild('formRef') formRef!: NgForm;

  modelo: Usuario = {
    nombreUsuario: '',
    passwordHash: '',
    rol: 'TÉCNICO', // Default para nuevos usuarios
    email: '',
  };
  passwordPlain = '';
  esNuevo = true;

  constructor(
    private usuarioService: UsuarioService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nuevo') {
      this.esNuevo = false;
      this.usuarioService.getById(+id).subscribe((u) => {
        this.modelo = { ...u, passwordHash: '' };
      });
    }
  }

  guardar(): void {
    if (this.passwordPlain) {
      this.modelo.passwordHash = this.passwordPlain;
    }

    const action$ = this.esNuevo
      ? this.usuarioService.create(this.modelo)
      : this.usuarioService.update(this.modelo.idUsuario!, this.modelo);

    action$.subscribe({
      next: () => {
        Swal.fire({
          title: this.esNuevo ? '¡Usuario Creado!' : '¡Usuario Actualizado!',
          text: `El usuario ${this.modelo.nombreUsuario} se ha guardado correctamente.`,
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          timer: 2000,
          timerProgressBar: true
        }).then(() => {
          this.router.navigate(['/usuarios']);
        });
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo guardar la información del usuario.', 'error');
      }
    });
  }
}

