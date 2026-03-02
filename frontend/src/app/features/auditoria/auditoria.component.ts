import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

interface AuditoriaSesion {
  idSesion: number;
  idUsuario: number;
  nombreUsuario: string;
  fechaInicio: string; // ISO string
  fechaFin?: string;   // ISO string
  fechaUltimaActividad: string; // ISO string
  ipAcceso: string;
  estado: string;
}

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="audit-wrapper">
      <div class="header-section">
        <h2>📊 Auditoría de Accesos</h2>
        <p class="subtitle">Registro detallado de conexiones y actividad de usuarios</p>
      </div>

      <div class="audit-card">
        <div class="table-responsive">
          <table class="modern-table table-card">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Estado</th>
                <th>Inicio de Sesión</th>
                <th>Fin de Sesión</th>
                <th>Tiempo Conectado</th>
                <th>Última Actividad</th>
                <th>IP de Origen</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of sesiones" [class.active-row]="isActive(s)">
                <td data-label="Usuario">
                  <div class="user-cell">
                    <div class="user-avatar" [ngStyle]="{'background-color': getAvatarColor(s.nombreUsuario)}">
                      {{ s.nombreUsuario.charAt(0).toUpperCase() }}
                    </div>
                    <span class="username">{{ s.nombreUsuario }}</span>
                  </div>
                </td>
                <td data-label="Estado">
                  <span class="status-badge" [ngClass]="isActive(s) ? 'status-online' : 'status-offline'">
                    <span class="status-dot"></span>
                    {{ isActive(s) ? 'En Línea' : 'Desconectado' }}
                  </span>
                </td>
                <td data-label="Inicio" class="time-cell">
                  {{ s.fechaInicio | date : 'dd MMM yyyy, HH:mm:ss' }}
                </td>
                <td data-label="Fin" class="time-cell">
                  <span *ngIf="s.fechaFin">{{ s.fechaFin | date : 'dd MMM yyyy, HH:mm:ss' }}</span>
                  <span *ngIf="!s.fechaFin" class="text-muted">En uso...</span>
                </td>
                <td data-label="Tiempo" class="duration-cell">
                  <span class="duration-badge" [class.active-duration]="isActive(s)">
                    ⏱️ {{ calculateDuration(s) }}
                  </span>
                </td>
                <td data-label="Última actividad" class="activity-cell">
                  <span class="activity-badge" [class.active-activity]="isActive(s)">
                    {{ formatLastActivity(s) }}
                  </span>
                </td>
                <td data-label="IP" class="ip-cell">
                  <span class="ip-badge">{{ s.ipAcceso }}</span>
                </td>
              </tr>
              <tr *ngIf="sesiones.length === 0">
                <td colspan="6" class="empty-state">No hay registros de auditoría disponibles.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .audit-wrapper {
      padding: 0;
      animation: fadeIn 0.4s ease-out;
    }

    .header-section {
      margin-bottom: 2rem;
    }

    h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #64748b;
      font-size: 1rem;
    }

    .audit-card {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .modern-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .modern-table th {
      background: #f8fafc;
      padding: 1rem 1.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }

    .modern-table td {
      padding: 1rem 1.5rem;
      vertical-align: middle;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      font-size: 0.9rem;
    }

    .modern-table tr:last-child td {
      border-bottom: none;
    }

    .modern-table tr:hover {
      background-color: #f8fafc;
    }

    .active-row {
      background-color: #f0fdf4 !important;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.85rem;
      text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .username {
      font-weight: 600;
      color: #0f172a;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-online {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }

    .status-offline {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }

    .time-cell {
      font-family: 'Inter', system-ui, sans-serif;
      font-variant-numeric: tabular-nums;
      color: #475569;
    }

    .text-muted {
      color: #94a3b8;
      font-style: italic;
      font-size: 0.85rem;
    }

    .duration-cell {
      font-weight: 500;
    }

    .duration-badge {
      display: inline-block;
      padding: 4px 8px;
      background: #f1f5f9;
      border-radius: 6px;
      color: #334155;
      font-size: 0.85rem;
      font-variant-numeric: tabular-nums;
      font-weight: 500;
    }

    .active-duration {
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .activity-badge {
      display: inline-block;
      padding: 4px 8px;
      background: #f8fafc;
      border-radius: 6px;
      color: #64748b;
      font-size: 0.8rem;
      border: 1px solid #e2e8f0;
    }

    .active-activity {
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .ip-badge {
      font-family: monospace;
      background: #f1f5f9;
      padding: 2px 6px;
      border-radius: 4px;
      color: #64748b;
      font-size: 0.8rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem !important;
      color: #94a3b8;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 768px) {
      .header-section {
        text-align: left;
      }

      .user-cell {
        flex-direction: column;
        align-items: flex-start;
      }

      .table-responsive {
        overflow-x: auto;
      }
    }
  `]
})
export class AuditoriaComponent implements OnInit {
  sesiones: AuditoriaSesion[] = [];
  now: Date = new Date();

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.cargarSesiones();
    // Update 'now' every second to keep active durations live
    setInterval(() => {
      this.now = new Date();
    }, 1000);
  }

  cargarSesiones(): void {
    this.api
      .get<AuditoriaSesion[]>('auditoria-sesiones')
      .subscribe((data: AuditoriaSesion[]) => {
        // Sort by start date desc
        this.sesiones = data.sort((a, b) =>
          new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
        );
      });
  }

  isActive(s: AuditoriaSesion): boolean {
    return s.estado === 'Conectado' && !s.fechaFin;
  }

  calculateDuration(s: AuditoriaSesion): string {
    const start = new Date(s.fechaInicio).getTime();
    const end = s.fechaFin ? new Date(s.fechaFin).getTime() : this.now.getTime();

    const diffMs = end - start;
    if (diffMs < 0) return '0s';

    const seconds = Math.floor((diffMs / 1000) % 60);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
  }

  formatLastActivity(s: AuditoriaSesion): string {
    if (s.fechaFin) return 'Sesión finalizada';

    const last = new Date(s.fechaUltimaActividad).getTime();
    const diffMs = this.now.getTime() - last;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    return `Hace ${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;
  }

  getAvatarColor(name: string): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}
