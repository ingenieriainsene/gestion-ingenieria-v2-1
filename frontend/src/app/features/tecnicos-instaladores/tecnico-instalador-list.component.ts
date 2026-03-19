import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TecnicoInstalador, TecnicoInstaladorService } from '../../services/tecnico-instalador.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-tecnico-instalador-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="header-section">
      <h1>Técnicos Instaladores <span class="badge-contador" *ngIf="filtrados">{{ filtrados.length }} registros</span></h1>
      <button type="button" class="btn-primary" [routerLink]="['/tecnicos-instaladores/nuevo']">+ Nuevo Instalador</button>
    </div>

    <div class="search-bar">
      <input
        type="text"
        [(ngModel)]="filtro"
        (ngModelChange)="aplicarFiltro()"
        placeholder="Buscar por ID, nombre o teléfono..."
        class="search-input"
      />
      <button class="btn-search" (click)="aplicarFiltro()">🔍</button>
    </div>

    <!-- TECHNICIANS TABLE -->
    <div class="table-container">
      <table class="table-card">
        <thead>
          <tr>
            <th>ID</th>
            <th>INSTALADOR</th>
            <th>TELÉFONO</th>
            <th>FECHA ALTA</th>
            <th>ESTADO</th>
            <th style="text-align:right;">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of filtrados" class="row-card" (click)="irAFicha(t)" style="cursor:pointer;">
            <td data-label="ID"><strong>#{{ t.idTecnicoInstalador }}</strong></td>
            <td data-label="Instalador">
              <div class="client-name-cell">
                <div class="client-mini-avatar" [style.background-color]="getAvatarColor(t.nombre)">
                  {{ t.nombre.charAt(0).toUpperCase() }}
                </div>
                <span>{{ t.nombre }}</span>
              </div>
            </td>
            <td data-label="Teléfono"><code class="dni-badge">{{ t.telefono || '—' }}</code></td>
            <td data-label="Fecha alta"><small>{{ t.fechaAlta | date:'dd/MM/yyyy' }}</small></td>
            <td data-label="Estado">
              <span class="status-badge" [class.active]="t.activo">
                {{ t.activo ? 'ACTIVO' : 'INACTIVO' }}
              </span>
            </td>
            <td data-label="Acciones" class="actions-cell" style="text-align:right; white-space:nowrap;">
               <a 
                 class="action-badge badge-edit" 
                 title="Editar" 
                 (click)="$event.stopPropagation()" 
                 [routerLink]="['/tecnicos-instaladores', t.idTecnicoInstalador]"
               >✏️</a>
               <button 
                 class="action-badge badge-delete" 
                 style="border:none; cursor:pointer;" 
                 title="Eliminar" 
                 (click)="$event.stopPropagation(); eliminar(t)"
               >🗑️</button>
            </td>
          </tr>
          <tr *ngIf="filtrados.length === 0">
            <td colspan="6" style="text-align:center; padding:40px; color:#64748b;">
               No se encontraron técnicos con los criterios de búsqueda.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    
    .btn-primary {
      background: #1e293b;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      border: none;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
    }
    .btn-primary:hover { background: #334155; transform: translateY(-1px); }

    /* Search Bar */
    .search-bar {
      display: flex;
      gap: 10px;
      margin-bottom: 2rem;
    }
    .search-input {
      flex: 1;
      padding: 12px 1rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      font-size: 1rem;
    }
    .btn-search {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 0 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1.2rem;
    }

    /* Table System */
    .table-container {
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background: #f8fafc;
      padding: 14px 20px;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e2e8f0;
    }
    td {
      padding: 16px 20px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.9rem;
      color: #334155;
    }
    tr:hover td {
      background: #f8fafc;
    }

    .client-name-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .client-mini-avatar {
      width: 32px;
      height: 32px;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8rem;
    }

    .dni-badge {
      background: #f1f5f9;
      color: #475569;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-weight: 600;
    }

    .status-badge {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 12px;
      background: #fee2e2;
      color: #991b1b;
      white-space: nowrap;
    }
    .status-badge.active {
      background: #dcfce7;
      color: #166534;
    }

    .action-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      margin-left: 6px;
      text-decoration: none;
      transition: all 0.2s;
      font-size: 1.1rem;
      color: white;
    }
    .badge-edit { background: #f1c40f; }
    .badge-delete { background: #e74c3c; }
    .action-badge:hover {
      transform: scale(1.1);
      filter: brightness(1.1);
    }

    @media (max-width: 768px) {
      .header-section {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
      .search-bar {
        flex-direction: column;
      }
    }
  `]
})
export class TecnicoInstaladorListComponent implements OnInit {
  tecnicos: TecnicoInstalador[] = [];
  filtrados: TecnicoInstalador[] = [];
  filtro = '';

  constructor(
    private service: TecnicoInstaladorService,
    private router: Router
  ) { }

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.service.getAll().subscribe(data => {
      this.tecnicos = data;
      this.aplicarFiltro();
    });
  }

  aplicarFiltro() {
    const term = (this.filtro || '').toLowerCase().trim();
    if (!term) {
      this.filtrados = this.tecnicos;
      return;
    }

    this.filtrados = this.tecnicos.filter(t =>
      (t.idTecnicoInstalador?.toString().includes(term)) ||
      (t.nombre.toLowerCase().includes(term)) ||
      (t.telefono?.toLowerCase().includes(term))
    );
  }

  irAFicha(t: TecnicoInstalador) {
    if (t.idTecnicoInstalador) {
      this.router.navigate(['/tecnicos-instaladores', t.idTecnicoInstalador]);
    }
  }

  eliminar(t: TecnicoInstalador) {
    if (!t.idTecnicoInstalador) return;
    Swal.fire({
      title: '¿Eliminar instalador?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1e293b'
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
