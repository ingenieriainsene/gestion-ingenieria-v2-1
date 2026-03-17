import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Usuario, UsuarioService } from '../../services/usuario.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="user-wrapper">
      <div class="header-section">
        <h1>Gestión de Usuarios <span class="badge-contador" *ngIf="usuarios">{{ usuarios.length }} registros</span></h1>
        <p class="subtitle">Administra los accesos y roles del equipo</p>
      </div>
      <div style="margin-bottom: 20px;">
        <a routerLink="/usuarios/nuevo" class="btn-create">
          <span class="icon">+</span> Nuevo Usuario
        </a>
      </div>

      <div class="user-grid">
        <div class="user-card" *ngFor="let u of usuarios">
          <div class="card-header">
            <div class="user-avatar" [ngStyle]="{'background-color': getAvatarColor(u.nombreUsuario)}">
              {{ u.nombreUsuario.charAt(0).toUpperCase() }}
            </div>
            <div class="user-info">
              <h3>{{ u.nombreUsuario }}</h3>
              <span class="role-badge" [ngClass]="getRoleClass(u.rol)">{{ u.rol }}</span>
            </div>
            <div class="card-actions">
              <button [routerLink]="['/usuarios', u.idUsuario]" class="action-btn edit-btn" title="Editar">
                ✏️
              </button>
              <button (click)="eliminar(u)" class="action-btn delete-btn" title="Eliminar">
                🗑️
              </button>
            </div>
          </div>
          
          <div class="card-body">
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">{{ u.email || 'No registrado' }}</span>
            </div>
            <div class="info-row">
              <span class="label">ID:</span>
              <span class="value">#{{ u.idUsuario }}</span>
            </div>
            <div class="info-row" *ngIf="u.fechaCreacion">
              <span class="label">Creado:</span>
              <span class="value">{{ u.fechaCreacion | date:'mediumDate' }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div *ngIf="usuarios.length === 0" class="empty-state">
        <p>No hay usuarios registrados</p>
      </div>
    </div>
  `,
  styles: [`
    .user-wrapper {
      padding: 0;
      animation: fadeIn 0.4s ease-out;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    h2 { display: none; }

    .subtitle {
      color: #64748b;
      margin: 0;
      font-size: 1rem;
    }

    .btn-create {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }

    .btn-create:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.3);
    }

    .user-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .user-card {
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      transition: all 0.2s ease;
      overflow: hidden;
    }

    .user-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      border-color: #cbd5e1;
    }

    .card-header {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #f8fafc;
      border-bottom: 1px solid #f1f5f9;
      position: relative;
    }

    .user-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 700;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .user-info {
      flex: 1;
      min-width: 0;
    }

    .user-info h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.1rem;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .role-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .role-admin { background: #1e293b; color: #f8fafc; }
    .role-tecnico { background: #e0f2fe; color: #0284c7; }
    .role-lectura { background: #f1f5f9; color: #64748b; }

    .card-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid transparent;
      background: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .edit-btn:hover { background: #eff6ff; border-color: #bfdbfe; }
    .delete-btn:hover { background: #fef2f2; border-color: #fecaca; }

    .card-body {
      padding: 1.5rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      font-size: 0.9rem;
    }

    .info-row:last-child { margin-bottom: 0; }

    .label { color: #64748b; }
    .value { font-weight: 500; color: #334155; }

    .empty-state {
      text-align: center;
      padding: 4rem;
      color: #94a3b8;
      background: #f8fafc;
      border-radius: 12px;
      border: 2px dashed #cbd5e1;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class UsuarioListComponent implements OnInit {
  usuarios: Usuario[] = [];

  constructor(private usuarioService: UsuarioService) { }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.usuarioService.getAll().subscribe((data) => (this.usuarios = data));
  }

  eliminar(u: Usuario): void {
    if (!u.idUsuario) return;
    Swal.fire({
      title: '¿Eliminar usuario?',
      text: '¿Estás seguro de que deseas eliminar este usuario?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e293b',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sí, eliminar'
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.usuarioService.delete(u.idUsuario!).subscribe({
        next: () => {
          this.cargar();
          Swal.fire('Eliminado', 'Usuario borrado correctamente.', 'success');
        },
        error: () => Swal.fire('Error', 'No se puede eliminar un usuario con datos asociados.', 'error'),
      });
    });
  }

  getAvatarColor(name: string): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  getRoleClass(rol: string): string {
    switch (rol) {
      case 'ADMIN': return 'role-admin';
      case 'TÉCNICO': return 'role-tecnico';
      default: return 'role-lectura';
    }
  }
}

