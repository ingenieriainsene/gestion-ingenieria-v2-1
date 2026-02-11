import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

interface AuditoriaSesion {
  idSesion: number;
  idUsuario: number;
  nombreUsuario: string;
  fechaInicio: string;
  fechaFin?: string;
  ipAcceso: string;
  estado: string;
}

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Historial de Inicios y Cierres de Sesión</h2>

    <div class="audit-container">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Inicio de sesión</th>
            <th>Cierre de sesión</th>
            <th style="text-align: center;">Estado</th>
            <th>IP Acceso</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let s of sesiones">
            <td><strong>{{ s.nombreUsuario }}</strong></td>
            <td>{{ s.fechaInicio | date : 'dd/MM/yyyy HH:mm:ss' }}</td>
            <td>
              {{
                s.fechaFin
                  ? (s.fechaFin | date : 'dd/MM/yyyy HH:mm:ss')
                  : 'Conexión abierta'
              }}
            </td>
            <td style="text-align: center;">
              <span
                class="status-pill"
                [ngClass]="
                  s.estado === 'Conectado' && !s.fechaFin ? 'online' : 'offline'
                "
              >
                {{ s.estado === 'Conectado' && !s.fechaFin ? 'Activo' : 'Finalizada' }}
              </span>
            </td>
            <td><code>{{ s.ipAcceso }}</code></td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [
    `
      .audit-container {
        border-radius: 12px;
        background: #fff;
        border: 1px solid #e2e8f0;
        padding: 20px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      .status-pill {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
      }
      .online {
        background: #dcfce7;
        color: #166534;
        border: 1px solid #bbf7d0;
      }
      .offline {
        background: #f1f5f9;
        color: #475569;
        border: 1px solid #e2e8f0;
      }
      h2 {
        margin-bottom: 20px;
        color: #1e293b;
      }
    `,
  ],
})
export class AuditoriaComponent implements OnInit {
  sesiones: AuditoriaSesion[] = [];

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.cargarSesiones();
  }

  cargarSesiones(): void {
    this.api
      .get<AuditoriaSesion[]>('auditoria-sesiones')
      .subscribe((data: AuditoriaSesion[]) => (this.sesiones = data));
  }
}
