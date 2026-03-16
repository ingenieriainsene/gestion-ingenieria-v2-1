import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ContratoService, Contrato, ClienteService, LocalService, Cliente, Local } from '../../services/domain.services';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-contrato-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="header-bar">
      <h1>Gestión de Contratos <span class="badge-contador" *ngIf="filteredContratos">{{ filteredContratos.length }} registros</span></h1>
      <a routerLink="/contratos/nuevo" class="btn-primary">+ Nuevo Contrato</a>
    </div>

    <div class="filter-card">
      <form [formGroup]="filterForm" class="filter-toolbar">
        <div class="filter-group small">
          <label>ID</label>
          <input type="text" formControlName="searchId" placeholder="Ej: #2">
        </div>
        
        <div class="filter-group search-cliente">
          <label>Cliente / DNI</label>
          <div class="input-with-icon">
            <span class="icon">🔍</span>
            <input type="text" formControlName="searchCliente" placeholder="Buscar por nombre o DNI...">
          </div>
        </div>

        <div class="filter-group search-local">
          <label>Local / Dirección</label>
          <div class="input-with-icon">
            <span class="icon">🏢</span>
            <input type="text" formControlName="searchLocal" placeholder="Buscar por dirección...">
          </div>
        </div>

        <div class="filter-group">
          <label>Tipo</label>
          <select formControlName="tipo">
            <option value="">Todos los tipos</option>
            <option *ngFor="let t of types" [value]="t">{{ t }}</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Estado</label>
          <select formControlName="estado">
            <option value="">Cualquier estado</option>
            <option value="Activo">Activo</option>
            <option value="Terminado">Terminado</option>
            <option value="Anulado">Anulado</option>
          </select>
        </div>

        <button type="button" class="btn-clear" (click)="clearFilters()" title="Limpiar filtros">
          🔄 Limpiar
        </button>
      </form>
    </div>

    <div class="table-container">
      <table class="table-card">
        <thead>
          <tr>
            <th>ID</th>
            <th>CLIENTE</th>
            <th>DNI/CIF</th>
            <th>LOCAL</th>
            <th>TIPO</th>
            <th>INICIO</th>
            <th>VENCIMIENTO</th>
            <th>ESTADO</th>
            <th style="min-width: 150px; text-align: right;">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of filteredContratos" class="row-card" (click)="verContrato(c)" style="cursor:pointer;">
            <td data-label="ID"><strong>#{{ c.idContrato }}</strong></td>
            <td data-label="Cliente">
              <a
                [routerLink]="['/clientes', c.cliente?.idCliente || c.idCliente]"
                class="entity-link"
                title="Ver ficha cliente"
              >
                👤 {{ c.cliente?.nombre }} {{ c.cliente?.apellido1 }}
              </a>
            </td>
            <td data-label="DNI/CIF">
              <span class="dni-text">{{ c.cliente?.dni || '—' }}</span>
            </td>
            <td data-label="Local">
              <a
                [routerLink]="['/locales', c.local?.idLocal || c.idLocal]"
                class="entity-link"
                title="Ver local"
              >
                🏠 {{ c.local?.direccionCompleta }}
              </a>
            </td>
            <td data-label="Tipo">
              <span class="badge-tipo">{{ c.tipoContrato }}</span>
            </td>
            <td data-label="Inicio">{{ c.fechaInicio | date:'dd/MM/yyyy' }}</td>
            <td data-label="Vencimiento">{{ c.fechaVencimiento | date:'dd/MM/yyyy' }}</td>
            <td data-label="Estado">
              <span class="status-badge" [ngClass]="c.estado?.toLowerCase() || 'activo'">
                {{ c.estado || 'Activo' }}
              </span>
            </td>
            <td data-label="Acciones" class="actions-cell">
              <a
                [routerLink]="['/contratos', c.idContrato, 'editar']"
                class="action-btn edit"
                title="Editar Datos del Contrato"
                (click)="$event.stopPropagation()"
              >✏️</a>

              <button
                class="action-btn delete"
                (click)="eliminar(c); $event.stopPropagation()"
                title="Eliminar contrato"
              >🗑️</button>
            </td>
          </tr>
          <tr *ngIf="filteredContratos.length === 0">
            <td colspan="8" class="empty-state">
              No se encontraron contratos con los filtros aplicados.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
  ,
  styles: [`
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    
    .header-bar h1 {
      font-size: 1.8rem;
      color: #1e293b;
      font-weight: 800;
      margin: 0;
    }

    .btn-primary {
      background: #1e293b;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 700;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
    }
    .btn-primary:hover {
      background: #334155;
      transform: translateY(-1px);
    }

    .filter-card {
      background: white;
      padding: 20px;
      border-radius: 15px;
      border: 1px solid #e2e8f0;
      margin-bottom: 25px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    }
    .filter-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      align-items: flex-end;
    }
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .filter-group.small { width: 80px; }
    .filter-group.search-cliente { flex: 1.5; min-width: 200px; }
    .filter-group.search-local { flex: 2; min-width: 250px; }

    .filter-group label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .input-with-icon {
      position: relative;
    }
    .input-with-icon .icon {
      position: absolute;
      left: 12px;
      top: 10px;
      color: #94a3b8;
    }
    .input-with-icon input {
      padding-left: 36px !important;
    }

    .filter-group input, .filter-group select {
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      font-size: 0.9rem;
      color: #1e293b;
      background: #f8fafc;
      transition: all 0.2s;
      outline: none;
      width: 100%;
      box-sizing: border-box;
    }
    .filter-group input:focus, .filter-group select:focus {
      border-color: #1e293b;
      background: white;
      box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.05);
    }

    .btn-clear {
      padding: 10px 16px;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      background: white;
      color: #64748b;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-clear:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .table-container {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }

    table { width: 100%; border-collapse: collapse; }
    
    th {
      background: #f8fafc;
      padding: 1rem 1.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      border-bottom: 2px solid #e2e8f0;
      text-align: left;
    }
    
    td {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
      font-size: 0.9rem;
      vertical-align: middle;
    }
    
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #f8fafc; }
    
    .entity-link {
      color: #3b82f6;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s;
      display: block;
      max-width: 250px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .entity-link:hover { color: #1d4ed8; text-decoration: underline; }

    .dni-text {
      font-weight: 700;
      color: #475569;
      font-family: monospace;
      font-size: 0.85rem;
    }

    .badge-tipo {
      background: #eff6ff;
      color: #1d4ed8;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      border: 1px solid #bfdbfe;
      white-space: nowrap;
    }

    .actions-cell {
      text-align: right;
      white-space: nowrap;
    }

    .action-btn {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      margin-left: 8px;
      text-decoration: none;
      font-size: 1rem;
      transition: all 0.2s;
      border: none;
      cursor: pointer;
    }
    
    .action-btn.edit { background: #f1c40f; color: #1e293b; }
    .action-btn.edit:hover { transform: scale(1.1); }
    
    .action-btn.view { background: #3498db; color: white; }
    .action-btn.view:hover { transform: scale(1.1); }
    
    .action-btn.delete { background: #e74c3c; color: white; }
    .action-btn.delete:hover { transform: scale(1.1); }

    .status-badge {
      padding: 4px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 700;
      text-transform: uppercase; border: 1px solid transparent; white-space: nowrap;
    }
    .status-badge.activo { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
    .status-badge.terminado { background: #e0f2fe; color: #0369a1; border-color: #bae6fd; }
    .status-badge.anulado { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #94a3b8;
      font-style: italic;
    }

    @media (max-width: 768px) {
      .header-bar {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .filter-toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-group,
      .filter-group.small,
      .filter-group.search-cliente,
      .filter-group.search-local {
        width: 100%;
        min-width: 100%;
      }

      .filter-group select,
      .filter-group input {
        width: 100%;
      }
    }
  `]
})
export class ContratoListComponent implements OnInit, OnDestroy {
  allContratos: Contrato[] = [];
  filteredContratos: Contrato[] = [];
  filterForm: FormGroup;
  types: string[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private service: ContratoService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      searchId: [''],
      searchCliente: [''],
      searchLocal: [''],
      tipo: [''],
      estado: ['']
    });
  }

  ngOnInit() {
    this.loadContratos();

    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.applyFilters());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadContratos() {
    this.service.getAll().subscribe(data => {
      this.allContratos = data || [];
      this.extractFilterOptions();
      this.applyFilters();
    });
  }

  private extractFilterOptions() {
    const typesMap = new Map<string, string>();
    this.allContratos.forEach(c => {
      if (c.tipoContrato) {
        const normalized = this.normalizeString(c.tipoContrato);
        // Priorizamos la versión que tenga acentos si hay duplicados
        const hasAccent = /[\u00C0-\u017F]/.test(c.tipoContrato);
        if (!typesMap.has(normalized) || hasAccent) {
          typesMap.set(normalized, c.tipoContrato);
        }
      }
    });
    this.types = Array.from(typesMap.values()).sort();
  }

  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private applyFilters() {
    const { searchId, searchCliente, searchLocal, tipo, estado } = this.filterForm.value;
    const sId = (searchId || '').toLowerCase().trim().replace('#', '');
    const sCli = this.normalizeString(searchCliente || '').trim();
    const sLoc = this.normalizeString(searchLocal || '').trim();

    this.filteredContratos = this.allContratos.filter(c => {
      const matchesId = !sId || String(c.idContrato) === sId;

      const matchesCliente = !sCli ||
        this.normalizeString(c.cliente?.nombre || '').includes(sCli) ||
        this.normalizeString(c.cliente?.apellido1 || '').includes(sCli) ||
        this.normalizeString(c.cliente?.dni || '').includes(sCli);

      const matchesLocal = !sLoc ||
        this.normalizeString(c.local?.direccionCompleta || '').includes(sLoc);

      const matchesTipo = !tipo || this.normalizeString(c.tipoContrato || '') === this.normalizeString(tipo);
      const matchesEstado = !estado || (c.estado || 'Activo') === estado;

      return matchesId && matchesCliente && matchesLocal && matchesTipo && matchesEstado;
    }).sort((a, b) => (b.idContrato || 0) - (a.idContrato || 0));
  }

  clearFilters() {
    this.filterForm.reset({
      searchId: '',
      searchCliente: '',
      searchLocal: '',
      tipo: '',
      estado: ''
    });
  }

  verContrato(c: Contrato) {
    if (!c.idContrato) {
      return;
    }
    this.router.navigate(['/contratos', c.idContrato]);
  }

  eliminar(c: Contrato) {
    if (!c.idContrato) return;
    Swal.fire({
      title: '¿Eliminar contrato?',
      text: `¿Seguro que deseas eliminar el contrato #${c.idContrato}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sí, eliminar'
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.service.delete(c.idContrato!).subscribe({
        next: () => {
          this.allContratos = this.allContratos.filter(x => x.idContrato !== c.idContrato);
          this.applyFilters();
          Swal.fire('Eliminado', 'Contrato borrado correctamente.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo eliminar el contrato.', 'error'),
      });
    });
  }
}
