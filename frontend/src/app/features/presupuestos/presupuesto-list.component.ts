import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { PresupuestoService, PresupuestoListItem } from '../../services/presupuesto.service';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-presupuesto-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="header-container">
      <h1>GESTIÓN DE PRESUPUESTOS</h1>
      <a routerLink="/presupuestos/nuevo" class="btn-primary">+ Nuevo Presupuesto</a>
    </div>

    <div class="filter-card">
      <form [formGroup]="filterForm" class="filter-toolbar">
        <div class="filter-group global-search">
          <span class="icon">🔍</span>
          <input type="text" formControlName="search" placeholder="Buscar por cliente o vivienda...">
        </div>
        
        <div class="filter-group">
          <label>Fecha</label>
          <input type="date" formControlName="fecha">
        </div>

        <div class="filter-group">
          <label>Estado</label>
          <select formControlName="estado">
            <option value="">Todos los estados</option>
            <option *ngFor="let st of states" [value]="st">{{ st }}</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Tipo</label>
          <select formControlName="tipo">
            <option value="">Todos los tipos</option>
            <option *ngFor="let t of types" [value]="t">{{ t }}</option>
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
            <th>VIVIENDA</th>
            <th>FECHA</th>
            <th>TOTAL</th>
            <th>ESTADO</th>
            <th>TIPO</th>
            <th style="text-align:right;">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let p of filteredPresupuestos" (click)="verFicha(p)" style="cursor:pointer;">
            <td data-label="ID">
              <strong [title]="p.idPresupuesto">{{ formatId(p.idPresupuesto) }}</strong>
            </td>
            <td data-label="Cliente">{{ p.clienteNombre || '—' }}</td>
            <td data-label="Vivienda">{{ p.viviendaDireccion || '—' }}</td>
            <td data-label="Fecha">{{ p.fecha | date:'dd/MM/yyyy' }}</td>
            <td data-label="Total">{{ p.total | number:'1.2-2' }} €</td>
            <td data-label="Estado">
              <span class="badge" [ngClass]="getStatusClass(p.estado)">
                {{ p.estado || '—' }}
              </span>
            </td>
            <td data-label="Tipo">{{ p.tipoPresupuesto || 'Obra' }}</td>
            <td data-label="Acciones" class="actions-cell" style="text-align:right; white-space:nowrap;">
              <a
                [routerLink]="['/presupuestos', p.idPresupuesto]"
                class="action-badge"
                style="background:#3498db;"
                title="Ver presupuesto"
                (click)="$event.stopPropagation()"
              >👁️</a>
              <a [routerLink]="['/presupuestos', p.idPresupuesto, 'editar']" class="action-badge badge-edit" title="Editar" (click)="$event.stopPropagation()">✏️</a>
              <button class="action-badge badge-delete" style="border:none; cursor:pointer;" (click)="eliminar(p); $event.stopPropagation()" title="Eliminar">🗑️</button>
            </td>
          </tr>
          <tr *ngIf="filteredPresupuestos.length === 0">
            <td colspan="8" style="text-align:center; padding:40px; color:#64748b;">
              No se han encontrado presupuestos con los filtros aplicados.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
    }
    .header-container h1 {
      margin: 0;
      color: #1e293b;
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .btn-primary {
      background: #1e293b;
      color: white;
      padding: 10px 20px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.9rem;
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
    .filter-group label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
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
    }
    .filter-group input:focus, .filter-group select:focus {
      border-color: #1e293b;
      background: white;
      box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.05);
    }
    .global-search {
      flex: 1;
      min-width: 250px;
      position: relative;
    }
    .global-search .icon {
      position: absolute;
      left: 14px;
      bottom: 11px;
      color: #94a3b8;
    }
    .global-search input {
      padding-left: 40px;
      width: 100%;
      box-sizing: border-box;
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
      border-color: #94a3b8;
    }

    .table-container {
      background: white;
      border-radius: 15px;
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
    .badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-ok { background: #dcfce7; color: #166534; }
    .badge-warn { background: #fef9c3; color: #854d0e; }
    .badge-pend { background: #fee2e2; color: #991b1b; }
    .status-default { background: #f1f5f9; color: #475569; }

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
    }
    .badge-edit { background: #f1c40f; }
    .badge-delete { background: #e74c3c; color: white; }
    .action-badge:hover {
      transform: scale(1.1);
      filter: brightness(1.1);
    }

    @media (max-width: 768px) {
      .header-container {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .filter-toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-group,
      .global-search {
        width: 100%;
        min-width: 100%;
      }

      .btn-clear {
        width: 100%;
      }
    }
  `]
})
export class PresupuestoListComponent implements OnInit, OnDestroy {
  allPresupuestos: PresupuestoListItem[] = [];
  filteredPresupuestos: PresupuestoListItem[] = [];
  filterForm: FormGroup;
  states: string[] = [];
  types: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private service: PresupuestoService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      fecha: [''],
      estado: [''],
      tipo: ['']
    });
  }

  ngOnInit(): void {
    this.service.getBudgets().subscribe({
      next: (list) => {
        this.allPresupuestos = list || [];
        this.extractFilterOptions();
        this.applyFilters();
      },
      error: () => {
        this.allPresupuestos = [];
        this.filteredPresupuestos = [];
      },
    });

    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private extractFilterOptions(): void {
    const states = new Set<string>();
    const types = new Set<string>();

    this.allPresupuestos.forEach(p => {
      if (p.estado) states.add(p.estado);
      if (p.tipoPresupuesto) types.add(p.tipoPresupuesto);
    });

    this.states = Array.from(states).sort();
    this.types = Array.from(types).sort();
  }

  private applyFilters(): void {
    const { search, fecha, estado, tipo } = this.filterForm.value;
    const searchLow = (search || '').toLowerCase();

    this.filteredPresupuestos = this.allPresupuestos.filter(p => {
      const matchesSearch = !search ||
        (p.clienteNombre || '').toLowerCase().includes(searchLow) ||
        (p.viviendaDireccion || '').toLowerCase().includes(searchLow);

      const matchesFecha = !fecha || p.fecha.startsWith(fecha);
      const matchesEstado = !estado || p.estado === estado;
      const matchesTipo = !tipo || p.tipoPresupuesto === tipo;

      return matchesSearch && matchesFecha && matchesEstado && matchesTipo;
    });
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      fecha: '',
      estado: '',
      tipo: ''
    });
  }

  getStatusClass(estado?: string): string {
    if (!estado) return 'status-default';
    const s = estado.toLowerCase();
    if (s.includes('aceptado') || s.includes('pagado')) return 'badge-ok';
    if (s.includes('pendiente') || s.includes('enviado')) return 'badge-pend';
    if (s.includes('borrador') || s.includes('estudio')) return 'badge-warn';
    return 'status-default';
  }

  formatId(id: number | string): string {
    const value = String(id);
    return value.length > 8 ? `${value.slice(0, 8)}…` : value;
  }

  verFicha(p: PresupuestoListItem): void {
    this.router.navigate(['/presupuestos', p.idPresupuesto]);
  }

  eliminar(p: PresupuestoListItem): void {
    Swal.fire({
      title: '¿Eliminar presupuesto?',
      text: `¿Seguro que deseas eliminar ${p.codigoReferencia || ('#' + p.idPresupuesto)}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e293b',
      cancelButtonText: 'Cancelar',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.service.deleteBudget(p.idPresupuesto).subscribe({
        next: () => {
          this.allPresupuestos = this.allPresupuestos.filter(x => x.idPresupuesto !== p.idPresupuesto);
          this.applyFilters();
          Swal.fire('Eliminado', 'Presupuesto borrado correctamente.', 'success');
        },
        error: () => {
          Swal.fire('Error', 'No se pudo eliminar el presupuesto.', 'error');
        }
      });
    });
  }
}
