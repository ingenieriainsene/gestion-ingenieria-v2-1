import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  showPassword = signal(false);
  isLoading = signal(false);
  loginStatus = signal<'idle' | 'error' | 'success' | 'conflict'>('idle');

  loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  ngOnInit() {
    // Redirigir si ya está logueado
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
    // "Silent wake-up" para despertar el servidor de Render al cargar la página
    this.authService.ping().subscribe({
      next: () => console.log('[Auth] Server is awake'),
      error: () => console.warn('[Auth] Server cold start or unreachable')
    });
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onSubmit(force: boolean = false) {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.loginStatus.set('idle');

    const credentials = { ...this.loginForm.value, force };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.loginStatus.set('success');
        setTimeout(() => {
          this.isLoading.set(false);
          this.router.navigate(['/']);
        }, 1000);
      },
      error: (err) => {
        this.isLoading.set(false);
        
        if (err.status === 409) {
          this.loginStatus.set('conflict');
          this.handleConcurrentSession();
        } else {
          this.loginStatus.set('error');
          console.error('[Login] Error:', err);
          setTimeout(() => {
            this.loginStatus.set('idle');
          }, 5000);
        }
      }
    });
  }

  private handleConcurrentSession() {
    Swal.fire({
      title: 'Sesión Activa Detectada',
      text: 'Actualmente tienes otra sesión abierta en este usuario. ¿Deseas cerrarla e iniciar sesión aquí?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, cerrar otras sesiones',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      heightAuto: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.onSubmit(true); // Re-enviar con force=true
      } else {
        this.loginStatus.set('idle');
      }
    });
  }
}
