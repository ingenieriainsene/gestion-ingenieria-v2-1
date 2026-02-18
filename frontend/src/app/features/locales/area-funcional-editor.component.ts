import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { AreaFuncionalService, AreaFuncional, AreaFuncionalLinea } from '../../services/area-funcional.service';
import { ProductoService } from '../../services/producto.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-area-funcional-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    template: `
    <div class="editor-wrapper">
      <div class="lines-section">
        <div class="lines-header">
          <h3>🏗️ Áreas Funcionales</h3>
          <button type="button" class="btn-create-small" (click)="addArea()">
            + Nueva Área
          </button>
        </div>

        <div class="table-responsive">
          <form [formGroup]="form">
            <table class="tree-table" formArrayName="areas">
              <thead>
                <tr>
                  <th class="col-product">Producto</th>
                  <th class="col-concept">Concepto</th>
                  <th class="col-num">Cant.</th>
                  <th class="col-action">Acción Requerida</th>
                  <th class="col-actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <ng-container *ngFor="let area of areas.controls; let i = index" [formGroupName]="i">
                   <!-- Área Row -->
                  <tr class="row-area" (click)="toggleArea(i)">
                    <td colspan="5">
                      <div class="area-header-content">
                        <button type="button" class="toggle-btn" (click)="toggleArea(i); $event.stopPropagation()">
                          {{ collapsed[i] ? '▶' : '▼' }}
                        </button>
                        <input 
                            type="text" 
                            class="form-control-flat bold area-title" 
                            formControlName="nombre" 
                            placeholder="Nombre del Área (ej. Electricidad)" 
                            (blur)="saveArea(i)"
                            (click)="$event.stopPropagation()"
                        />
                        <div class="area-actions">
                            <button type="button" class="btn-icon-add" title="Añadir Línea" (click)="addLinea(i); $event.stopPropagation()">➕</button>
                            <button type="button" class="btn-icon-delete" title="Eliminar Área" (click)="deleteArea(i); $event.stopPropagation()">🗑️</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Líneas Rows -->
                  <ng-container formArrayName="lineas" *ngIf="!collapsed[i]">
                    <tr *ngFor="let linea of getLineas(i).controls; let j = index" [formGroupName]="j" class="row-linea">
                      <td>
                        <div class="product-input-group">
                          <input
                            type="text"
                            class="form-control-flat small-text"
                            formControlName="productoTexto"
                            placeholder="Buscar producto..."
                            (input)="onProductoInput(i, j)"
                          />
                          <button type="button" class="btn-micro-search" (click)="abrirProductoModal(i, j)">🔍</button>
                        </div>
                      </td>
                      <td><input type="text" class="form-control-flat" formControlName="concepto" placeholder="Concepto" (blur)="saveLinea(i, j)" /></td>
                      <td class="num"><input type="number" class="form-control-flat num-input" formControlName="cantidad" min="0" step="0.01" (blur)="saveLinea(i, j)" /></td>
                      <td><input type="text" class="form-control-flat" formControlName="accionRequerida" placeholder="Acción (ej. Instalar)" (blur)="saveLinea(i, j)" /></td>
                      <td class="actions-cell">
                        <button type="button" class="btn-icon-delete small" (click)="deleteLinea(i, j)">🗑️</button>
                      </td>
                    </tr>
                    <tr *ngIf="getLineas(i).length === 0" class="row-empty">
                        <td colspan="5" class="empty-msg">No hay líneas en esta área. Pulsa ➕ para añadir.</td>
                    </tr>
                  </ng-container>
                </ng-container>
              </tbody>
            </table>
            <div *ngIf="areas.length === 0" class="empty-state">
              No hay áreas funcionales registradas. Añade una para comenzar.
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Producto -->
    <div class="modal-overlay" [class.active]="modalProductoVisible" (click)="cerrarProductoModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Seleccionar Producto</h3>
          <button class="close-btn" (click)="cerrarProductoModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="search-box">
             <span class="search-icon">🔍</span>
             <input
                type="text"
                class="search-input"
                placeholder="Buscar por código, nombre o descripción..."
                [(ngModel)]="productoQuery"
                (ngModelChange)="filtrarProductos()"
              />
          </div>
          <div class="product-list">
             <div
                class="product-item"
                *ngFor="let p of productosFiltrados"
                (click)="seleccionarProducto(p)"
              >
                <div class="prod-info">
                   <div class="prod-code">{{ p.codRef || '—' }}</div>
                   <div class="prod-desc">{{ p.descripcion }}</div>
                </div>
              </div>
              <div *ngIf="productosFiltrados.length === 0" class="product-empty">
                Sin resultados para "{{ productoQuery }}".
              </div>
          </div>
        </div>
        <div class="modal-footer">
           <button class="btn-cancel" (click)="cerrarProductoModal()">Cerrar</button>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .editor-wrapper { margin-top: 2rem; animation: fadeIn 0.4s ease-out; }
    .lines-section { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .lines-header { background: #f8fafc; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; }
    .lines-header h3 { margin: 0; font-size: 1.1rem; color: #334155; display: flex; align-items: center; gap: 0.5rem; }
    
    .table-responsive { overflow-x: auto; }
    .tree-table { width: 100%; min-width: 800px; border-collapse: collapse; }
    .tree-table th { background: #f1f5f9; padding: 0.75rem 0.5rem; text-align: left; font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
    .tree-table td { padding: 4px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; font-size: 0.9rem; }
    
    .col-product { width: 25%; }
    .col-concept { width: 30%; }
    .col-num { width: 10%; text-align: right; }
    .col-action { width: 25%; }
    .col-actions { width: 10%; text-align: center; }
    
    .row-area { background: #eef2ff; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .row-area:hover { background: #e0e7ff; }
    
    .area-header-content { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0; }
    .area-title { flex: 1; font-size: 1rem; color: #1e3a8a; }
    .area-actions { display: flex; gap: 0.5rem; margin-right: 1rem; }
    
    .row-linea { background: white; }
    .row-linea:hover { background: #fafafa; }
    .row-empty { background: #fafafa; }
    .empty-msg { text-align: center; color: #94a3b8; font-style: italic; padding: 1rem; font-size: 0.85rem; }
    
    .toggle-btn { background: none; border: none; font-size: 0.8rem; cursor: pointer; color: #64748b; width: 24px; text-align: center; }
    
    .form-control-flat { width: 100%; border: 1px solid transparent; background: transparent; padding: 6px 8px; border-radius: 4px; font-size: inherit; color: inherit; transition: all 0.2s; }
    .form-control-flat:hover, .form-control-flat:focus { background: white; border-color: #cbd5e1; outline: none; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .form-control-flat.bold { font-weight: 700; }
    .form-control-flat.num-input { text-align: right; }
    .form-control-flat.small-text { font-size: 0.85rem; }
    
    .product-input-group { display: flex; gap: 4px; }
    .btn-micro-search { padding: 0 6px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
    .btn-micro-search:hover { background: #e2e8f0; }

    .actions-cell { text-align: center; }
    .btn-icon-add, .btn-icon-delete { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 4px; opacity: 0.7; transition: all 0.2s; }
    .btn-icon-add:hover, .btn-icon-delete:hover { opacity: 1; transform: scale(1.1); }
    .btn-icon-add { color: #059669; }
    .btn-icon-delete { color: #ef4444; }
    
    .btn-create-small { padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 0.85rem; transition: background 0.2s; }
    .btn-create-small:hover { background: #2563eb; }

    .empty-state { padding: 3rem; text-align: center; color: #94a3b8; font-style: italic; }

    /* Modal Styles (Identical to Budget) */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
    .modal-overlay.active { display: flex; }
    .modal-card { background: white; width: 90%; max-width: 600px; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); display: flex; flex-direction: column; max-height: 80vh; }
    .modal-header { padding: 1rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; font-size: 1.1rem; color: #1e293b; }
    .close-btn { background: none; border: none; font-size: 1.25rem; color: #64748b; cursor: pointer; }
    .modal-body { padding: 1.5rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; background: #f8fafc; }
    
    .search-box { position: relative; width: 100%; }
    .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #94a3b8; }
    .search-input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.5rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; }
    
    .product-list { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; overflow-y: auto; }
    .product-item { padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; }
    .product-item:hover { border-color: #3b82f6; background: #eff6ff; }
    .prod-info { display: flex; flex-direction: column; gap: 2px; }
    .prod-code { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .prod-desc { font-weight: 600; color: #1e293b; font-size: 0.9rem; }
    .product-empty { text-align: center; color: #94a3b8; padding: 2rem; font-style: italic; }

    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class AreaFuncionalEditorComponent implements OnInit, OnChanges {
    @Input() idLocal!: number;

    form: FormGroup;
    collapsed: boolean[] = [];

    // Productos logic
    productos: any[] = [];
    productosFiltrados: any[] = [];
    modalProductoVisible = false;
    productoQuery = '';
    private productoTarget: { areaIndex: number; lineaIndex: number } | null = null;

    constructor(
        private fb: FormBuilder,
        private areaService: AreaFuncionalService,
        private productoService: ProductoService
    ) {
        this.form = this.fb.group({
            areas: this.fb.array([])
        });
    }

    ngOnInit(): void {
        this.loadProductos();
        if (this.idLocal) {
            this.loadAreas();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['idLocal'] && !changes['idLocal'].firstChange && this.idLocal) {
            this.loadAreas();
        }
    }

    get areas(): FormArray {
        return this.form.get('areas') as FormArray;
    }

    getLineas(index: number): FormArray {
        return this.areas.at(index).get('lineas') as FormArray;
    }

    loadAreas() {
        this.areaService.getByLocal(this.idLocal).subscribe({
            next: (list) => {
                this.areas.clear();
                this.collapsed = [];
                list.forEach(area => {
                    const areaGroup = this.fb.group({
                        idArea: [area.idArea],
                        nombre: [area.nombre, Validators.required],
                        lineas: this.fb.array([])
                    });

                    const lineasArray = areaGroup.get('lineas') as FormArray;
                    if (area.lineas) {
                        area.lineas.forEach(l => {
                            lineasArray.push(this.fb.group({
                                idLinea: [l.idLinea],
                                productoId: [l.productoId],
                                productoTexto: [l.productoTexto],
                                concepto: [l.concepto],
                                cantidad: [l.cantidad],
                                accionRequerida: [l.accionRequerida]
                            }));
                        });
                    }

                    this.areas.push(areaGroup);
                    this.collapsed.push(false);
                });
            },
            error: (err) => console.error('Error loading areas', err)
        });
    }

    loadProductos() {
        this.productoService.getAll().subscribe(list => {
            this.productos = list || [];
        });
    }

    // --- Actions ---

    addArea() {
        if (!this.idLocal) return;
        const newArea: AreaFuncional = {
            nombre: 'Nueva Área',
            orden: this.areas.length
        };

        this.areaService.createArea(this.idLocal, newArea).subscribe({
            next: (created) => {
                const areaGroup = this.fb.group({
                    idArea: [created.idArea],
                    nombre: [created.nombre, Validators.required],
                    lineas: this.fb.array([])
                });
                this.areas.push(areaGroup);
                this.collapsed.push(false);
                // Auto focus logic could go here
            },
            error: (e) => Swal.fire('Error', 'No se pudo crear el área', 'error')
        });
    }

    saveArea(index: number) {
        const group = this.areas.at(index);
        if (group.invalid || !group.dirty) return;

        const val = group.value;
        this.areaService.updateArea(val.idArea, { nombre: val.nombre, orden: index }).subscribe({
            next: () => group.markAsPristine(),
            error: () => Swal.fire('Error', 'Error al guardar cambios del área', 'error')
        });
    }

    deleteArea(index: number) {
        const group = this.areas.at(index);
        const id = group.value.idArea;

        Swal.fire({
            title: '¿Eliminar Área?',
            text: 'Se borrarán todas las líneas contenidas.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar'
        }).then(res => {
            if (res.isConfirmed) {
                this.areaService.deleteArea(id).subscribe({
                    next: () => {
                        this.areas.removeAt(index);
                        this.collapsed.splice(index, 1);
                    },
                    error: () => Swal.fire('Error', 'No se pudo eliminar', 'error')
                });
            }
        });
    }

    toggleArea(index: number) {
        this.collapsed[index] = !this.collapsed[index];
    }

    addLinea(areaIndex: number) {
        const areaGroup = this.areas.at(areaIndex);
        const idArea = areaGroup.value.idArea;
        const lineas = this.getLineas(areaIndex);

        const newLine: AreaFuncionalLinea = {
            concepto: '',
            cantidad: 1,
            orden: lineas.length
        };

        this.areaService.addLinea(idArea, newLine).subscribe({
            next: (created) => {
                lineas.push(this.fb.group({
                    idLinea: [created.idLinea],
                    productoId: [created.productoId],
                    productoTexto: [created.productoTexto],
                    concepto: [created.concepto],
                    cantidad: [created.cantidad],
                    accionRequerida: [created.accionRequerida]
                }));
            },
            error: () => Swal.fire('Error', 'No se pudo añadir la línea', 'error')
        });
    }

    saveLinea(areaIndex: number, lineaIndex: number) {
        const lineas = this.getLineas(areaIndex);
        const group = lineas.at(lineaIndex);
        if (!group.dirty) return;

        const val = group.value;
        this.areaService.updateLinea(val.idLinea, val).subscribe({
            next: () => group.markAsPristine(),
            error: () => console.error('Error saving linea') // Silent fail or toast
        });
    }

    deleteLinea(areaIndex: number, lineaIndex: number) {
        const lineas = this.getLineas(areaIndex);
        const id = lineas.at(lineaIndex).value.idLinea;

        this.areaService.deleteLinea(id).subscribe({
            next: () => lineas.removeAt(lineaIndex),
            error: () => Swal.fire('Error', 'No se pudo borrar la línea', 'error')
        });
    }

    // --- Producto Modal ---

    abrirProductoModal(areaIndex: number, lineaIndex: number) {
        this.productoTarget = { areaIndex, lineaIndex };
        const group = this.getLineas(areaIndex).at(lineaIndex);
        this.productoQuery = group.value.productoTexto || '';
        this.filtrarProductos();
        this.modalProductoVisible = true;
    }

    cerrarProductoModal() {
        this.modalProductoVisible = false;
        this.productoTarget = null;
    }

    filtrarProductos() {
        const term = this.productoQuery.trim().toLowerCase();
        if (!term) {
            this.productosFiltrados = this.productos.slice(0, 50);
            return;
        }
        this.productosFiltrados = this.productos.filter(p =>
            (p.codRef && p.codRef.toLowerCase().includes(term)) ||
            (p.descripcion && p.descripcion.toLowerCase().includes(term))
        ).slice(0, 50);
    }

    seleccionarProducto(p: any) {
        if (!this.productoTarget) return;

        const { areaIndex, lineaIndex } = this.productoTarget;
        const group = this.getLineas(areaIndex).at(lineaIndex);

        group.patchValue({
            productoId: p.id,
            productoTexto: p.codRef ? `[${p.codRef}] ${p.descripcion}` : p.descripcion,
            concepto: p.descripcion, // Auto-fill concepto
        });
        group.markAsDirty();
        this.saveLinea(areaIndex, lineaIndex);
        this.cerrarProductoModal();
    }

    onProductoInput(areaIndex: number, lineaIndex: number) {
        // Just mark as dirty, save on blur
        const group = this.getLineas(areaIndex).at(lineaIndex);
        group.markAsDirty();
    }
}
