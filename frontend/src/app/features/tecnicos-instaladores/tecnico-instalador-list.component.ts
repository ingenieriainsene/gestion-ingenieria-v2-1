import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TecnicoInstalador, TecnicoInstaladorService } from '../../services/tecnico-instalador.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-tecnico-instalador-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="wrapper">
      <div class="header-section">
        <h1>Técnicos Instaladores <span class="badge-contador" *ngIf="tecnicos">{{ tecnicos.length }} registros</span></h1>
        <p class="subtitle">Gestiona el equipo de montaje e instalaciones</p>
      </div>
      <div style="margin-bottom: 20px;">
        <a routerLink="/tecnicos-instaladores/nuevo" class="btn-create">
          <span class="icon">+</span> Nuevo Instalador
        </a>
      </div>

      <div class="grid">
        <div class="card" *ngFor="let t of tecnicos">
          <div class="card-header">
            <div class="avatar" [style.background-color]="getAvatarColor(t.nombre)">
              {{ t.nombre.charAt(0).toUpperCase() }}
            </div>
            <div class="info">
              <h3>{{ t.nombre }}</h3>
              <span class="status-badge" [class.active]="t.activo">
                {{ t.activo ? 'ACTIVO' : 'INACTIVO' }}
              </span>
            </div>
            <div class="actions">
              <button [routerLink]="['/tecnicos-instaladores', t.idTecnicoInstalador]" class="action-btn" title="Editar">
                ✏️
              </button>
              <button (click)="eliminar(t)" class="action-btn delete" title="Eliminar">
                🗑️
              </button>
            </div>
          </div>
          
          <div class="card-body">
            <div class="info-row">
              <span class="label">Teléfono:</span>
              <span class="value">{{ t.telefono || 'No disponible' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Alta:</span>
              <span class="value">{{ t.fechaAlta | date:'shortDate' }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div *ngIf="tecnicos.length === 0" class="empty-state">
        <p>No hay instaladores registrados</p>
      </div>
    </div>
  `,
    styles: [`
    .wrapper { animation: fadeIn 0.4s ease-out; }
    .header-section {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0;
    }
    h2 { display: none; }
    .subtitle { color: #64748b; margin: 0; }
    .btn-create {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white; padding: 0.75rem 1.5rem; border-radius: 8px;
      font-weight: 600; text-decoration: none; display: flex; align-items: center; gap: 8px;
    }
    .grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;
    }
    .card {
      background: white; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;
      transition: transform 0.2s;
    }
    .card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    .card-header {
      padding: 1.5rem; display: flex; align-items: center; gap: 1rem;
      background: #f8fafc; border-bottom: 1px solid #f1f5f9;
    }
    .avatar {
      width: 48px; height: 48px; border-radius: 50%; color: white;
      display: flex; align-items: center; justify-content: center; font-weight: 700;
    }
    .info { flex: 1; }
    .info h3 { margin: 0; font-size: 1.1rem; color: #0f172a; }
    .status-badge {
      font-size: 0.7rem; font-weight: 800; padding: 2px 8px; border-radius: 10px;
      background: #fee2e2; color: #991b1b;
    }
    .status-badge.active { background: #dcfce7; color: #166534; }
    .actions { display: flex; gap: 0.5rem; }
    .action-btn {
      width: 32px; height: 32px; border-radius: 6px; border: 1px solid #e2e8f0;
      background: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .action-btn:hover { background: #f1f5f9; }
    .action-btn.delete:hover { background: #fef2f2; border-color: #fecaca; }
    .card-body { padding: 1.5rem; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem; }
    .label { color: #64748b; }
    .value { font-weight: 500; color: #334155; }
    .empty-state { text-align: center; padding: 3rem; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class TecnicoInstaladorListComponent implements OnInit {
    tecnicos: TecnicoInstalador[] = [];
    constructor(private service: TecnicoInstaladorService) { }
    ngOnInit() { this.cargar(); }
    cargar() { this.service.getAll().subscribe(data => this.tecnicos = data); }
    eliminar(t: TecnicoInstalador) {
        if (!t.idTecnicoInstalador) return;
        Swal.fire({
            title: '¿Eliminar instalador?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(res => {
            if (res.isConfirmed) {
                this.service.delete(t.idTecnicoInstalador!).subscribe(() => {
                    this.cargar();
                    Swal.fire('Eliminado', 'El técnico ha sido eliminado', 'success');
                });
            }
        });
    }
    getAvatarColor(name: string): string {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    }
}
