import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
  loginStatus = signal<'idle' | 'error' | 'success'>('idle');

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

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.loginStatus.set('idle');

    // Logging para depuración en producción
    console.log('[Login] Intentando conectar con:', (this.authService as any).api.url);
    console.log('[Login] Usuario:', this.loginForm.value.username);

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.loginStatus.set('success');
        // Pequeño delay para mostrar el mensaje de éxito antes de navegar
        setTimeout(() => {
          this.isLoading.set(false);
          this.router.navigate(['/']);
        }, 1000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.loginStatus.set('error');
        console.error('[Login] Error:', err);
        
        // Limpiar el estado de error después de unos segundos
        setTimeout(() => {
          this.loginStatus.set('idle');
        }, 5000);
      }
    });
  }
}
