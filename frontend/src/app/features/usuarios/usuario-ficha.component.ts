import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Usuario, UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-usuario-ficha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="mb-3">
      <a routerLink="/usuarios" class="direct-link">← Volver al listado</a>
    </div>

    <h2>{{ esNuevo ? 'Nuevo Usuario' : 'Editar Usuario' }}</h2>

    <form (ngSubmit)="guardar()" #formRef="ngForm" class="mt-3">
      <div class="mb-3">
        <label class="form-label">Nombre de usuario</label>
        <input
          type="text"
          class="form-control"
          name="nombreUsuario"
          [(ngModel)]="modelo.nombreUsuario"
          required
        />
      </div>

      <div class="mb-3">
        <label class="form-label">Email</label>
        <input
          type="email"
          class="form-control"
          name="email"
          [(ngModel)]="modelo.email"
        />
      </div>

      <div class="mb-3">
        <label class="form-label">Rol</label>
        <select
          class="form-select"
          name="rol"
          [(ngModel)]="modelo.rol"
          required
        >
          <option [ngValue]="'ADMIN'">ADMIN</option>
          <option [ngValue]="'TÉCNICO'">TÉCNICO</option>
          <option [ngValue]="'LECTURA'">LECTURA</option>
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label"
          >Contraseña {{ esNuevo ? '' : '(déjala vacía para no cambiarla)' }}</label
        >
        <input
          type="password"
          class="form-control"
          name="password"
          [(ngModel)]="passwordPlain"
          [required]="esNuevo"
        />
      </div>

      <button
        type="submit"
        class="btn-primary"
        [disabled]="formRef.invalid"
      >
        Guardar
      </button>
    </form>
  `,
})
export class UsuarioFichaComponent implements OnInit {
  modelo: Usuario = {
    nombreUsuario: '',
    passwordHash: '',
    rol: 'LECTURA',
    email: '',
  };
  passwordPlain = '';
  esNuevo = true;

  constructor(
    private usuarioService: UsuarioService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

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

    if (this.esNuevo) {
      this.usuarioService.create(this.modelo).subscribe(() => {
        this.router.navigate(['/usuarios']);
      });
    } else if (this.modelo.idUsuario) {
      this.usuarioService
        .update(this.modelo.idUsuario, this.modelo)
        .subscribe(() => this.router.navigate(['/usuarios']));
    }
  }
}

