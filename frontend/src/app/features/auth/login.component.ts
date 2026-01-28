import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="row justify-content-center mt-5">
      <div class="col-md-4">
        <div class="card shadow">
          <div class="card-body">
            <h3 class="text-center mb-3">Iniciar Sesión</h3>
             <form [formGroup]="form" (ngSubmit)="login()">
                <div class="mb-3">
                   <label class="form-label">Usuario</label>
                   <input type="text" class="form-control" formControlName="username">
                </div>
                <div class="mb-3">
                   <label class="form-label">Contraseña</label>
                   <input type="password" class="form-control" formControlName="password">
                </div>
                <div class="d-grid">
                  <button class="btn btn-primary" type="submit" [disabled]="form.invalid">Entrar</button>
                </div>
             </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
    form: FormGroup;

    constructor(
        private fb: FormBuilder,
        private auth: AuthService,
        private router: Router
    ) {
        this.form = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });
    }

    login() {
        if (this.form.invalid) return;
        this.auth.login(this.form.value).subscribe({
            next: () => {
                this.router.navigate(['/']);
            },
            error: (err) => {
                const status = err?.status;
                const body = err?.error && typeof err.error === 'object' ? err.error : {};
                const msg = body['message'] ?? body['error'] ?? (typeof err?.error === 'string' ? err.error : null);
                console.error('[Login] Error:', status, msg ?? err?.message, err);
                const text = (typeof msg === 'string' && msg) ? msg : 'Credenciales inválidas. Usuario: jefe_admin, contraseña: admin123';
                Swal.fire('Error', text, 'error');
            }
        });
    }
}
