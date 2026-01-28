import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Usuario, UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2>Gestión de Usuarios</h2>
      <a routerLink="/usuarios/nuevo" class="btn-primary">+ Nuevo Usuario</a>
    </div>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>ID</th>
          <th>Usuario</th>
          <th>Email</th>
          <th>Rol</th>
          <th style="text-align: right;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let u of usuarios">
          <td>#{{ u.idUsuario }}</td>
          <td><code>{{ u.nombreUsuario }}</code></td>
          <td>{{ u.email || 'N/A' }}</td>
          <td>
            <span
              class="badge"
              [ngStyle]="{
                'background-color': u.rol === 'ADMIN' ? '#1e293b' : '#64748b',
                color: 'white',
                'border-radius.px': 6,
                'padding.px': 6,
                'font-size.px': 12,
                'font-weight': 'bold'
              }"
            >
              {{ u.rol }}
            </span>
          </td>
          <td style="text-align: right;">
            <a
              [routerLink]="['/usuarios', u.idUsuario]"
              class="action-badge badge-edit"
              >✏️</a
            >
            <a
              href="javascript:void(0)"
              class="action-badge badge-delete"
              (click)="eliminar(u)"
              >🗑️</a
            >
          </td>
        </tr>
      </tbody>
    </table>
  `,
})
export class UsuarioListComponent implements OnInit {
  usuarios: Usuario[] = [];

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.usuarioService.getAll().subscribe((data) => (this.usuarios = data));
  }

  eliminar(u: Usuario): void {
    if (!u.idUsuario) return;
    if (!confirm('¿Borrar cuenta?')) return;
    this.usuarioService.delete(u.idUsuario).subscribe(() => this.cargar());
  }
}

