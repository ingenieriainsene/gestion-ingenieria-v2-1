import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

interface AuditoriaSistema {
  idLog: number;
  tablaAfectada: string;
  idRegistro: number;
  campoModificado: string;
  valorAnterior: string;
  valorNuevo: string;
  fechaCambio: string;
  usuarioBd: string;
}

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
    <h2>Registro de Auditoría</h2>

    <nav class="audit-nav">
      <button
        class="audit-tab"
        [class.active]="tab === 'movimientos'"
        (click)="tab = 'movimientos'"
      >
        🛠️ Movimientos de Datos
      </button>
      <button
        class="audit-tab"
        [class.active]="tab === 'sesiones'"
        (click)="tab = 'sesiones'"
      >
        👤 Control de Accesos
      </button>
    </nav>

    <div *ngIf="tab === 'movimientos'">
      <div class="mb-3">
        <button class="btn-primary" (click)="filtro = ''; cargarMovimientos()">
          📂 Todo
        </button>
        <button
          class="btn-primary"
          (click)="filtro = 'CLIENTES'; cargarMovimientos()"
        >
          👤 Clientes
        </button>
        <button
          class="btn-primary"
          (click)="filtro = 'LOCALES'; cargarMovimientos()"
        >
          🏢 Locales
        </button>
        <button
          class="btn-primary"
          (click)="filtro = 'CONTRATOS'; cargarMovimientos()"
        >
          📋 Contratos
        </button>
      </div>

      <table class="table table-striped">
        <thead>
          <tr>
            <th>Fecha y Hora</th>
            <th>Módulo</th>
            <th>Campo</th>
            <th>Cambio realizado</th>
            <th>Usuario</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let m of movimientos">
            <td>
              <strong>{{ m.fechaCambio | date : 'dd/MM/yyyy' }}</strong><br />
              <small>{{ m.fechaCambio | date : 'HH:mm:ss' }}</small>
            </td>
            <td>
              <span class="badge-modulo">{{ m.tablaAfectada }}</span>
              <small>ID: #{{ m.idRegistro }}</small>
            </td>
            <td><strong>{{ m.campoModificado }}</strong></td>
            <td>
              <span class="diff-old">{{ m.valorAnterior }}</span>
              →
              <span class="diff-new">{{ m.valorNuevo }}</span>
            </td>
            <td><strong>{{ m.usuarioBd }}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div *ngIf="tab === 'sesiones'">
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
      .audit-nav {
        display: flex;
        gap: 20px;
        margin-bottom: 30px;
        border-bottom: 2px solid #e2e8f0;
      }
      .audit-tab {
        padding: 15px 30px;
        border: none;
        background: transparent;
        cursor: pointer;
        color: #64748b;
        font-weight: 700;
        font-size: 0.9rem;
        border-bottom: 4px solid transparent;
        text-transform: uppercase;
      }
      .audit-tab.active {
        color: #1e293b;
        border-bottom-color: #f1c40f;
        background: rgba(241, 196, 15, 0.05);
      }
      .badge-modulo {
        background: #1e293b;
        color: white;
        padding: 5px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: bold;
        display: inline-block;
        margin-bottom: 4px;
      }
      .diff-old {
        color: #ef4444;
        text-decoration: line-through;
        font-size: 0.85em;
      }
      .diff-new {
        color: #10b981;
        font-weight: bold;
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
    `,
  ],
})
export class AuditoriaComponent implements OnInit {
  tab: 'movimientos' | 'sesiones' = 'movimientos';
  filtro = '';
  movimientos: AuditoriaSistema[] = [];
  sesiones: AuditoriaSesion[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.cargarMovimientos();
    this.cargarSesiones();
  }

  cargarMovimientos(): void {
    this.api
      .get<AuditoriaSistema[]>('auditoria')
      .subscribe((data: AuditoriaSistema[]) => {
        this.movimientos = this.filtro
          ? data.filter((m: AuditoriaSistema) => m.tablaAfectada === this.filtro)
          : data;
      });
  }

  cargarSesiones(): void {
    this.api
      .get<AuditoriaSesion[]>('auditoria-sesiones')
      .subscribe((data: AuditoriaSesion[]) => (this.sesiones = data));
  }
}

