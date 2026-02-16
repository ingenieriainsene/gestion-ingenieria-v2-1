import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PresupuestoService, PresupuestoLineaDTO } from '../../services/presupuesto.service';
import { ClienteService, LocalService, Cliente, Local, TramiteService, ContratoService } from '../../services/domain.services';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../models/producto.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-presupuesto-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="ficha-wrapper">
      <div class="header-section">
        <a [routerLink]="tramiteId ? ['/tramites', tramiteId] : (idPresupuesto ? ['/presupuestos', idPresupuesto] : ['/presupuestos'])" class="back-link">
          <span class="icon">←</span> {{ tramiteId ? 'Volver a la Intervención' : (idPresupuesto ? 'Volver a la ficha' : 'Volver al listado') }}
        </a>
        <h2>{{ idPresupuesto ? 'Editar Presupuesto' : 'Nuevo Presupuesto' }}</h2>
        <div *ngIf="tramiteId" class="banner-intervention">
          🔗 Vinculado a Intervención #{{ tramiteId }}
        </div>
        <p class="subtitle">Gestión detallada del presupuesto, capítulos y partidas.</p>
      </div>

      <div class="form-card">
        <form [formGroup]="form" (ngSubmit)="guardar()" class="modern-form">
          
          <!-- Cabecera del Presupuesto -->
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Cliente <span class="required">*</span></label>
              <div class="input-wrapper">
                <span class="input-icon">👤</span>
                <input
                  type="text"
                  class="form-control"
                  formControlName="clienteLabel"
                  list="clientes-presupuestos-list"
                  placeholder="Busca por nombre o DNI"
                  (input)="onClienteInput()"
                />
                <datalist id="clientes-presupuestos-list">
                  <option *ngFor="let c of clientesOptionsView" [value]="c.label"></option>
                </datalist>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Vivienda <span class="required">*</span></label>
              <div class="input-wrapper">
                <span class="input-icon">🏠</span>
                <input
                  type="text"
                  class="form-control"
                  formControlName="viviendaLabel"
                  list="viviendas-presupuestos-list"
                  placeholder="Busca por dirección o CUPS"
                  (input)="onViviendaInput()"
                />
                <datalist id="viviendas-presupuestos-list">
                  <option *ngFor="let l of localesOptionsView" [value]="l.label"></option>
                </datalist>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Fecha <span class="required">*</span></label>
              <div class="input-wrapper">
                <span class="input-icon">📅</span>
                <input type="date" class="form-control" formControlName="fecha" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Estado</label>
              <div class="input-wrapper">
                <span class="input-icon">📊</span>
                <select class="form-control" formControlName="estado">
                  <option value="Borrador">Borrador</option>
                  <option value="Enviado">Enviado</option>
                  <option value="Aceptado">Aceptado</option>
                  <option value="Rechazado">Rechazado</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Tipo</label>
              <div class="input-wrapper">
                <span class="input-icon">🏷️</span>
                <select class="form-control" formControlName="tipoPresupuesto">
                  <option value="Obra">Obra</option>
                  <option value="Correctivo">Correctivo</option>
                  <option value="Preventivo">Preventivo</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Código Ref.</label>
              <div class="input-wrapper">
                <span class="input-icon">🔖</span>
                 <input type="text" class="form-control" formControlName="codigoReferencia" placeholder="Automático si vacío" />
              </div>
            </div>
          </div>

          <!-- Líneas del Presupuesto -->
          <div class="lines-section">
            <div class="lines-header">
              <h3>📦 Capítulos y Partidas</h3>
              <button type="button" class="btn-create-small" (click)="addCapitulo()">
                + Nuevo Capítulo
              </button>
            </div>

            <div class="table-responsive">
              <table class="tree-table" formArrayName="capitulos">
                <thead>
                  <tr>
                    <th class="col-code">Cód.</th>
                    <th class="col-product">Producto</th>
                    <th class="col-concept">Concepto</th>
                    <th class="col-num">Cant.</th>
                    <th class="col-num">Coste U.</th>
                    <th class="col-num">Total Coste</th>
                    <th class="col-num">Mg.</th>
                    <th class="col-num">PVP U.</th>
                    <th class="col-num" *ngIf="form.get('tipoPresupuesto')?.value === 'Preventivo'">Visitas</th>
                    <th class="col-num">IVA %</th>
                    <th class="col-num">Imp. IVA</th>
                    <th class="col-num">Total</th>
                    <th class="col-actions">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <ng-container *ngFor="let cap of capitulos.controls; let i = index" [formGroupName]="i">
                     <!-- Capítulo Row -->
                    <tr class="row-capitulo" (click)="selectCapitulo(i)" [class.selected]="selectedCapituloIndex === i">
                      <td class="code-cell">{{ cap.get('codigoVisual')?.value }}</td>
                      <td></td>
                      <td>
                        <div class="capitulo-concept">
                          <button type="button" class="toggle-btn" (click)="toggleCapitulo(i); $event.stopPropagation()">
                            {{ collapsed[i] ? '▶' : '▼' }}
                          </button>
                          <input type="text" class="form-control-flat bold" formControlName="concepto" placeholder="Nombre del capítulo" />
                        </div>
                      </td>
                      <td></td>
                      <td></td>
                      <td class="num readonly-cell">{{ getCapituloTotalCoste(i) | number:'1.2-2' }} €</td>
                      <td></td>
                      <td class="num readonly-cell">{{ getCapituloTotalPvp(i) | number:'1.2-2' }} €</td>
                      <td class="num" *ngIf="form.get('tipoPresupuesto')?.value === 'Preventivo'"></td>
                      <td></td>
                      <td class="num readonly-cell">{{ getCapituloImporteIva(i) | number:'1.2-2' }} €</td>
                      <td class="num readonly-cell bold">{{ getCapituloTotalFinal(i) | number:'1.2-2' }} €</td>
                      <td class="actions-cell">
                        <button type="button" class="btn-icon-add" title="Añadir Partida" (click)="addPartida(i); $event.stopPropagation()">➕</button>
                        <button type="button" class="btn-icon-delete" title="Eliminar Capítulo" (click)="removeCapitulo(i); $event.stopPropagation()">🗑️</button>
                      </td>
                    </tr>
                    
                    <!-- Partidas Rows -->
                    <ng-container formArrayName="partidas" *ngIf="!collapsed[i]">
                      <tr *ngFor="let part of getPartidas(i).controls; let j = index" [formGroupName]="j" class="row-partida">
                        <td class="code-cell indent">{{ part.get('codigoVisual')?.value }}</td>
                        <td>
                          <div class="product-input-group">
                            <input
                              type="text"
                              class="form-control-flat small-text"
                              formControlName="productoTexto"
                              placeholder="Buscar..."
                              (input)="onProductoInput(i, j)"
                            />
                            <button type="button" class="btn-micro-search" (click)="abrirProductoModal(i, j)">🔍</button>
                          </div>
                        </td>
                        <td><input type="text" class="form-control-flat" formControlName="concepto" placeholder="Concepto partida" /></td>
                        <td class="num"><input type="number" class="form-control-flat num-input" formControlName="cantidad" min="0" step="0.01" /></td>
                        <td class="num"><input type="number" class="form-control-flat num-input" formControlName="costeUnitario" min="0" step="0.01" /></td>
                        <td class="num readonly-cell light">{{ getPartidaTotalCoste(i, j) | number:'1.2-2' }} €</td>
                        <td class="num"><input type="number" class="form-control-flat num-input" formControlName="factorMargen" min="1" step="0.01" /></td>
                        <td class="num readonly-cell light">{{ getPartidaTotalPvp(i, j) | number:'1.2-2' }} €</td>
                        <td class="num" *ngIf="form.get('tipoPresupuesto')?.value === 'Preventivo'">
                          <input type="number" class="form-control-flat num-input" formControlName="numVisitas" min="0" step="1" placeholder="0" />
                        </td>
                        <td class="num"><input type="number" class="form-control-flat num-input" formControlName="ivaPorcentaje" min="0" step="1" /></td>
                        <td class="num readonly-cell light">{{ getPartidaImporteIva(i, j) | number:'1.2-2' }} €</td>
                        <td class="num readonly-cell">{{ getPartidaTotalFinal(i, j) | number:'1.2-2' }} €</td>
                        <td class="actions-cell">
                          <button type="button" class="btn-icon-delete small" (click)="removePartida(i, j)">🗑️</button>
                        </td>
                      </tr>
                    </ng-container>
                  </ng-container>
                </tbody>
              </table>
              <div *ngIf="capitulos.length === 0" class="empty-state">
                No hay capítulos. Añade uno para comenzar.
              </div>
            </div>
          </div>

          <!-- Resumen Totales -->
          <div class="totales-section">
            <div class="resumen-card">
              <div class="resumen-row">
                <span>Base Imponible</span>
                <strong>{{ totalSinIva | number:'1.2-2' }} €</strong>
              </div>
              <div class="resumen-row">
                <span>Total IVA</span>
                <strong>{{ totalIva | number:'1.2-2' }} €</strong>
              </div>
              <div class="resumen-row total">
                <span>TOTAL PRESUPUESTO</span>
                <strong>{{ totalConIva | number:'1.2-2' }} €</strong>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" [routerLink]="tramiteId ? ['/tramites', tramiteId] : (idPresupuesto ? ['/presupuestos', idPresupuesto] : ['/presupuestos'])" class="btn-cancel">Cancelar</button>
            <button type="submit" class="btn-save" [disabled]="guardando || form.invalid">
              {{ idPresupuesto ? 'Guardar Cambios' : 'Crear Presupuesto' }}
            </button>
          </div>

        </form>
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
                <div class="prod-price">{{ p.coste | number:'1.2-2' }} €</div>
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
    .ficha-wrapper { max-width: 1400px; margin: 0 auto; animation: fadeIn 0.4s ease-out; }
    .header-section { margin-bottom: 2rem; text-align: center; }
    .back-link { display: inline-flex; align-items: center; gap: 0.5rem; color: #64748b; text-decoration: none; font-weight: 500; font-size: 0.9rem; margin-bottom: 1rem; transition: color 0.2s; }
    .back-link:hover { color: #3b82f6; }
    h2 { font-size: 2rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem 0; }
    .banner-intervention { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; display: inline-block; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.5rem; }
    .subtitle { color: #64748b; font-size: 1.1rem; }
    
    .form-card { background: white; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; overflow: hidden; }
    .modern-form { padding: 2rem; display: flex; flex-direction: column; gap: 2rem; }
    
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    
    .lines-section { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
    .lines-header { background: #f8fafc; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; }
    .lines-header h3 { margin: 0; font-size: 1.1rem; color: #334155; }
    
    /* Table Styles */
    .table-responsive { overflow-x: auto; }
    .tree-table { width: 100%; min-width: 1000px; border-collapse: collapse; }
    .tree-table th { background: #f1f5f9; padding: 0.75rem 0.5rem; text-align: left; font-size: 0.7rem; text-transform: uppercase; color: #64748b; font-weight: 700; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
    .tree-table td { padding: 4px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; font-size: 0.85rem; }
    
    .col-code { width: 70px; }
    .col-product { width: 180px; }
    .col-concept { width: 250px; }
    .col-num { width: 80px; text-align: right; }
    .col-actions { width: 90px; text-align: center; }
    
    .row-capitulo { background: #f8fafc; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .row-capitulo:hover { background: #f1f5f9; }
    .row-capitulo.selected { background: #e0f2fe; }
    
    .row-partida { background: white; }
    .row-partida:hover { background: #fafafa; }
    
    .code-cell { font-family: monospace; color: #475569; }
    .indent { padding-left: 20px; color: #64748b; }
    .capitulo-concept { display: flex; align-items: center; gap: 0.5rem; }
    .toggle-btn { background: none; border: none; font-size: 0.8rem; cursor: pointer; color: #64748b; width: 20px; text-align: center; }
    
    .form-control-flat { width: 100%; border: 1px solid transparent; background: transparent; padding: 4px 6px; border-radius: 4px; font-size: inherit; color: inherit; transition: all 0.2s; }
    .form-control-flat:hover, .form-control-flat:focus { background: white; border-color: #cbd5e1; outline: none; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
    .form-control-flat.bold { font-weight: 700; color: #1e293b; }
    .form-control-flat.num-input { text-align: right; }
    .form-control-flat.small-text { font-size: 0.8rem; }
    
    .readonly-cell { text-align: right; padding-right: 8px; color: #334155; }
    .readonly-cell.bold { font-weight: 700; color: #0f172a; }
    .readonly-cell.light { color: #64748b; }
    
    .table-responsive::-webkit-scrollbar { height: 8px; }
    .table-responsive::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    
    .product-input-group { display: flex; gap: 4px; }
    .btn-micro-search { padding: 0 4px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
    .btn-micro-search:hover { background: #e2e8f0; }

    .actions-cell { text-align: center; }
    .btn-icon-add, .btn-icon-delete { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 4px; opacity: 0.7; transition: opacity 0.2s; }
    .btn-icon-add:hover, .btn-icon-delete:hover { opacity: 1; transform: scale(1.1); }
    .btn-icon-delete.small { font-size: 0.9rem; }

    .empty-state { padding: 3rem; text-align: center; color: #94a3b8; font-style: italic; }

    /* Totales */
    .totales-section { display: flex; justify-content: flex-end; margin-top: 1rem; }
    .resumen-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; min-width: 300px; display: flex; flex-direction: column; gap: 0.75rem; }
    .resumen-row { display: flex; justify-content: space-between; align-items: center; color: #475569; font-size: 0.95rem; }
    .resumen-row strong { color: #1e293b; font-weight: 600; }
    .resumen-row.total { border-top: 1px solid #cbd5e1; padding-top: 0.75rem; margin-top: 0.5rem; color: #0f172a; font-size: 1.1rem; }
    .resumen-row.total strong { color: #2563eb; font-weight: 800; }

    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid #f1f5f9; padding-top: 1.5rem; }
    
    /* Common Inputs (Header) */
    .form-label { font-size: 0.85rem; font-weight: 600; color: #334155; margin-bottom: 0.25rem; }
    .required { color: #ef4444; }
    .input-wrapper { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 0.75rem; font-size: 1rem; color: #94a3b8; pointer-events: none; }
    .form-control { width: 100%; padding: 0.6rem 0.75rem 0.6rem 2.25rem; font-size: 0.9rem; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; transition: all 0.2s; }
    .form-control:focus { outline: none; border-color: #3b82f6; background: white; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
    
    .btn-create-small { padding: 0.5rem 1rem; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; width: auto; font-size: 0.85rem; }
    .btn-create-small:hover { background: #059669; }
    
    .btn-cancel { padding: 0.75rem 1.5rem; background: white; border: 1px solid #cbd5e1; color: #64748b; font-weight: 600; border-radius: 8px; cursor: pointer; text-decoration: none; display: inline-block; }
    .btn-cancel:hover { background: #f1f5f9; }
    .btn-save { padding: 0.75rem 2rem; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; font-weight: 600; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
    .btn-save:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.3); }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: none; align-items: center; justify-content: center; z-index: 100; animation: fadeIn 0.2s; }
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
    .search-input:focus { outline: none; border-color: #3b82f6; }
    
    .product-list { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; overflow-y: auto; }
    .product-item { padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; }
    .product-item:hover { border-color: #3b82f6; background: #eff6ff; }
    .prod-info { display: flex; flex-direction: column; gap: 2px; }
    .prod-code { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .prod-desc { font-weight: 600; color: #1e293b; font-size: 0.9rem; }
    .prod-price { font-weight: 700; color: #059669; font-size: 0.95rem; }
    .product-empty { text-align: center; color: #94a3b8; padding: 2rem; font-style: italic; }

    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class PresupuestoFormComponent implements OnInit {
  form: FormGroup;
  clientes: Cliente[] = [];
  locales: Local[] = [];
  productos: Producto[] = [];
  productosOptions: { id: number; label: string; coste: number; descripcion: string; codRef: string }[] = [];
  productosFiltrados: { id: number; label: string; coste: number; descripcion: string; codRef: string }[] = [];
  modalProductoVisible = false;
  productoQuery = '';
  private productoTarget: { capIndex: number; partIndex: number } | null = null;
  clientesOptions: { id: number; label: string }[] = [];
  localesOptions: { id: number; label: string }[] = [];
  clientesOptionsView: { id: number; label: string }[] = [];
  localesOptionsView: { id: number; label: string }[] = [];
  totalSinIva = 0;
  totalConIva = 0;
  totalIva = 0;
  guardando = false;
  idPresupuesto: number | null = null;
  private pendingClienteId: number | null = null;
  private pendingViviendaId: number | null = null;
  collapsed: boolean[] = [];
  selectedCapituloIndex: number | null = null;
  tramiteId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private service: PresupuestoService,
    private clienteService: ClienteService,
    private localService: LocalService,
    private productoService: ProductoService,
    private tramiteService: TramiteService,
    private contratoService: ContratoService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      clienteLabel: [''],
      viviendaLabel: [''],
      clienteId: [null, Validators.required],
      viviendaId: [null, Validators.required],
      codigoReferencia: [''],
      fecha: [new Date().toISOString().slice(0, 10), Validators.required],
      estado: ['Borrador'],
      tipoPresupuesto: ['Obra'],
      capitulos: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id && id !== 'nuevo') {
        this.idPresupuesto = +id;
        this.cargarPresupuesto();
      } else {
        this.idPresupuesto = null;
        if (this.capitulos.length === 0) this.addCapitulo();
      }
    });

    this.route.queryParams.subscribe((params) => {
      const tid = params['tramiteId'];
      console.log('[PresupuestoForm] tramiteId from queryParams:', tid);
      if (tid) {
        this.tramiteId = +tid;
        this.tramiteService.getDetalle(this.tramiteId).subscribe((t) => {
          console.log('[PresupuestoForm] Tramite detalle:', t);
          if (t.idContrato) {
            this.contratoService.getById(t.idContrato).subscribe(c => {
              console.log('[PresupuestoForm] Contrato:', c);
              if (c.idCliente) {
                this.form.patchValue({ clienteId: c.idCliente });
                console.log('[PresupuestoForm] clientesOptions.length:', this.clientesOptions.length);
                if (this.clientesOptions.length > 0) {
                  console.log('[PresupuestoForm] Setting cliente label immediately');
                  this.setClienteLabelById(c.idCliente);
                } else {
                  console.log('[PresupuestoForm] Setting pendingClienteId:', c.idCliente);
                  this.pendingClienteId = c.idCliente;
                }
              }
              if (c.idLocal) {
                this.form.patchValue({ viviendaId: c.idLocal });
                console.log('[PresupuestoForm] localesOptions.length:', this.localesOptions.length);
                if (this.localesOptions.length > 0) {
                  console.log('[PresupuestoForm] Setting vivienda label immediately');
                  this.setViviendaLabelById(c.idLocal);
                } else {
                  console.log('[PresupuestoForm] Setting pendingViviendaId:', c.idLocal);
                  this.pendingViviendaId = c.idLocal;
                }
              }
            });
          }
          this.form.patchValue({ tipoPresupuesto: 'Correctivo' });
        });
      }
    });


    this.clienteService.getAll().subscribe({
      next: (list) => {
        this.clientes = list || [];
        this.clientesOptions = this.clientes
          .filter((c) => typeof c.idCliente === 'number')
          .map((c) => ({
            id: c.idCliente!,
            label: this.buildClienteLabel(c),
          }));
        console.log('[PresupuestoForm] Clientes loaded, count:', this.clientesOptions.length);
        this.refreshClienteOptions('');
        if (this.pendingClienteId) {
          console.log('[PresupuestoForm] Processing pendingClienteId:', this.pendingClienteId);
          this.setClienteLabelById(this.pendingClienteId);
          this.pendingClienteId = null;
        }
      },
      error: (err) => {
        console.error('[PresupuestoForm] Error loading clientes:', err);
        this.clientes = [];
        this.clientesOptions = [];
      }
    });
    this.localService.getAll().subscribe({
      next: (list) => {
        this.locales = list || [];
        this.localesOptions = this.locales
          .filter((l) => typeof l.idLocal === 'number')
          .map((l) => ({
            id: l.idLocal!,
            label: this.buildLocalLabel(l),
          }));
        console.log('[PresupuestoForm] Locales loaded, count:', this.localesOptions.length);
        this.refreshViviendaOptions('');
        if (this.pendingViviendaId) {
          console.log('[PresupuestoForm] Processing pendingViviendaId:', this.pendingViviendaId);
          this.setViviendaLabelById(this.pendingViviendaId);
          this.pendingViviendaId = null;
        }
      },
      error: (err) => {
        console.error('[PresupuestoForm] Error loading locales:', err);
        this.locales = [];
        this.localesOptions = [];
      }
    });
    this.productoService.getAll().subscribe((list) => {
      this.productos = list || [];
      this.productosOptions = this.productos
        .filter((p) => typeof p.id === 'number')
        .map((p) => ({
          id: p.id!,
          label: this.buildProductoLabel(p),
          coste: Number(p.coste ?? 0),
          descripcion: p.descripcion ?? '',
          codRef: p.codRef ?? '',
        }));
      this.filtrarProductos();
    });
    this.capitulos.valueChanges.subscribe(() => this.recalcularTotales());
  }

  get capitulos(): FormArray {
    return this.form.get('capitulos') as FormArray;
  }

  private buildCapituloGroup(codigo: string): FormGroup {
    return this.fb.group({
      tipoJerarquia: ['CAPITULO'],
      codigoVisual: [codigo],
      concepto: ['', Validators.required],
      totalCoste: [0],
      totalPvp: [0],
      importeIva: [0],
      totalFinal: [0],
      totalLinea: [0],
      partidas: this.fb.array([])
    });
  }

  private buildPartidaGroup(codigo: string): FormGroup {
    return this.fb.group({
      tipoJerarquia: ['PARTIDA'],
      codigoVisual: [codigo],
      productoId: [null],
      productoTexto: [''],
      concepto: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
      costeUnitario: [0, [Validators.required, Validators.min(0)]],
      factorMargen: [1.00, [Validators.min(1)]],
      ivaPorcentaje: [21, [Validators.min(0)]],
      numVisitas: [0, [Validators.min(0)]],
      totalCoste: [0],
      pvpUnitario: [0],
      totalPvp: [0],
      importeIva: [0],
      totalFinal: [0],
      totalLinea: [0]
    });
  }

  addCapitulo(): void {
    const codigo = String(this.capitulos.length + 1).padStart(2, '0');
    const cap = this.buildCapituloGroup(codigo);
    this.capitulos.push(cap);
    this.collapsed.push(false);
    this.selectCapitulo(this.capitulos.length - 1);
    this.recalcularTotales();
  }

  addPartida(capIndex: number): void {
    const cap = this.capitulos.at(capIndex);
    const codigoCap = cap.get('codigoVisual')?.value || String(capIndex + 1);
    const partidas = this.getPartidas(capIndex);
    const next = partidas.length + 1;
    const codigo = `${codigoCap}.${String(next).padStart(2, '0')}`;
    const part = this.buildPartidaGroup(codigo);
    part.valueChanges.subscribe(() => this.recalcularTotales());
    partidas.push(part);
    this.recalcularTotales();
  }

  removeCapitulo(index: number): void {
    this.capitulos.removeAt(index);
    this.collapsed.splice(index, 1);
    if (this.selectedCapituloIndex === index) {
      this.selectedCapituloIndex = null;
    }
    this.recalcularTotales();
  }

  removePartida(capIndex: number, partIndex: number): void {
    this.getPartidas(capIndex).removeAt(partIndex);
    this.recalcularTotales();
  }

  selectCapitulo(index: number): void {
    this.selectedCapituloIndex = index;
  }

  toggleCapitulo(index: number): void {
    this.collapsed[index] = !this.collapsed[index];
  }

  getPartidas(index: number): FormArray {
    return this.capitulos.at(index).get('partidas') as FormArray;
  }

  getPartidaTotalCoste(capIndex: number, partIndex: number): number {
    const part = this.getPartidas(capIndex).at(partIndex).value;
    return this.calcPartidaValues(part).totalCoste;
  }

  getPartidaTotalPvp(capIndex: number, partIndex: number): number {
    const part = this.getPartidas(capIndex).at(partIndex).value;
    return this.calcPartidaValues(part).totalPvp;
  }

  getPartidaImporteIva(capIndex: number, partIndex: number): number {
    const part = this.getPartidas(capIndex).at(partIndex).value;
    return this.calcPartidaValues(part).importeIva;
  }

  getPartidaTotalFinal(capIndex: number, partIndex: number): number {
    const part = this.getPartidas(capIndex).at(partIndex).value;
    return this.calcPartidaValues(part).totalFinal;
  }

  getCapituloTotalCoste(index: number): number {
    return this.round2(this.sumCapitulo(index, 'totalCoste'));
  }

  getCapituloTotalPvp(index: number): number {
    return this.round2(this.sumCapitulo(index, 'totalPvp'));
  }

  getCapituloImporteIva(index: number): number {
    return this.round2(this.sumCapitulo(index, 'importeIva'));
  }

  getCapituloTotalFinal(index: number): number {
    return this.round2(this.sumCapitulo(index, 'totalFinal'));
  }

  private sumCapitulo(index: number, field: 'totalCoste' | 'totalPvp' | 'importeIva' | 'totalFinal'): number {
    const partidas = this.getPartidas(index).controls;
    let total = 0;
    partidas.forEach((ctrl) => {
      const vals = this.calcPartidaValues(ctrl.value);
      total += vals[field];
    });
    return total;
  }

  private calcPartidaValues(part: any): { totalCoste: number; pvpUnitario: number; totalPvp: number; importeIva: number; totalFinal: number } {
    const cantidad = Number(part.cantidad || 0);
    const coste = Number(part.costeUnitario || 0);
    const factorRaw = Number(part.factorMargen);
    const factor = !Number.isNaN(factorRaw) && factorRaw > 0 ? factorRaw : 1;
    const totalCoste = this.round2(cantidad * coste);
    const pvpUnitario = this.round2(coste * factor);
    const totalPvp = this.round2(totalCoste * factor);
    const iva = Number(part.ivaPorcentaje ?? 21);
    const importeIva = this.round2(totalPvp * (iva / 100));
    const totalFinal = this.round2(totalPvp + importeIva);
    return { totalCoste, pvpUnitario, totalPvp, importeIva, totalFinal };
  }

  private recalcularTotales(): void {
    let subtotal = 0;
    let totalConIva = 0;

    this.capitulos.controls.forEach((capCtrl, capIndex) => {
      const partidas = this.getPartidas(capIndex).controls;
      let capCoste = 0;
      let capPvp = 0;
      let capIva = 0;
      let capFinal = 0;
      partidas.forEach((ctrl) => {
        const val = ctrl.value;
        const calc = this.calcPartidaValues(val);
        capCoste += calc.totalCoste;
        capPvp += calc.totalPvp;
        capIva += calc.importeIva;
        capFinal += calc.totalFinal;
        subtotal += calc.totalPvp;
        totalConIva += calc.totalFinal;
        ctrl.patchValue({
          totalCoste: calc.totalCoste,
          pvpUnitario: calc.pvpUnitario,
          totalPvp: calc.totalPvp,
          importeIva: calc.importeIva,
          totalFinal: calc.totalFinal,
          totalLinea: calc.totalPvp
        }, { emitEvent: false });
      });
      capCtrl.patchValue({
        totalCoste: this.round2(capCoste),
        totalPvp: this.round2(capPvp),
        importeIva: this.round2(capIva),
        totalFinal: this.round2(capFinal),
        totalLinea: this.round2(capPvp)
      }, { emitEvent: false });
    });

    this.totalSinIva = this.round2(subtotal);
    this.totalConIva = this.round2(totalConIva);
    this.totalIva = this.round2(this.totalConIva - this.totalSinIva);
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  onClienteInput(): void {
    const label = String(this.form.get('clienteLabel')?.value || '').trim();
    const match = this.clientesOptions.find((c) => c.label === label);
    this.form.patchValue({ clienteId: match?.id ?? null }, { emitEvent: false });
    this.refreshClienteOptions(label);
  }

  onViviendaInput(): void {
    const label = String(this.form.get('viviendaLabel')?.value || '').trim();
    const match = this.localesOptions.find((l) => l.label === label);
    this.form.patchValue({ viviendaId: match?.id ?? null }, { emitEvent: false });
    this.refreshViviendaOptions(label);
  }

  abrirProductoModal(capIndex: number, partIndex: number): void {
    this.productoTarget = { capIndex, partIndex };
    const part = this.getPartidas(capIndex).at(partIndex) as FormGroup;
    this.productoQuery = String(part.get('productoTexto')?.value || '').trim();
    this.filtrarProductos();
    this.modalProductoVisible = true;
  }

  cerrarProductoModal(): void {
    this.modalProductoVisible = false;
    this.productoTarget = null;
  }

  filtrarProductos(): void {
    const term = this.productoQuery.trim().toLowerCase();
    const base = this.productosOptions;
    if (!term) {
      this.productosFiltrados = base.slice(0, 50);
      return;
    }
    this.productosFiltrados = base.filter((p) => {
      const cod = p.codRef?.toLowerCase() ?? '';
      const desc = p.descripcion?.toLowerCase() ?? '';
      const label = p.label?.toLowerCase() ?? '';
      return cod.includes(term) || desc.includes(term) || label.includes(term);
    }).slice(0, 50);
  }

  seleccionarProducto(p: { id: number; label: string; coste: number; descripcion: string }): void {
    if (!this.productoTarget) return;
    const part = this.getPartidas(this.productoTarget.capIndex).at(this.productoTarget.partIndex) as FormGroup;
    const patch: Record<string, unknown> = {
      productoId: p.id,
      productoTexto: p.label,
    };
    const concepto = String(part.get('concepto')?.value || '').trim();
    if (!concepto) patch['concepto'] = p.descripcion;
    const costeRaw = Number(part.get('costeUnitario')?.value || 0);
    if (!costeRaw) patch['costeUnitario'] = p.coste;
    part.patchValue(patch, { emitEvent: false });
    this.modalProductoVisible = false;
    this.productoTarget = null;
    this.recalcularTotales();
  }

  onProductoInput(capIndex: number, partIndex: number): void {
    const part = this.getPartidas(capIndex).at(partIndex) as FormGroup;
    const raw = String(part.get('productoTexto')?.value || '').trim();
    if (!raw) {
      part.patchValue({ productoId: null }, { emitEvent: false });
      return;
    }
    const match = this.productosOptions.find((p) => p.label === raw || p.codRef === raw);
    if (!match) {
      part.patchValue({ productoId: null }, { emitEvent: false });
      return;
    }
    const patch: Record<string, unknown> = {
      productoId: match.id,
      productoTexto: match.label,
    };
    const concepto = String(part.get('concepto')?.value || '').trim();
    if (!concepto) patch['concepto'] = match.descripcion;
    const costeRaw = Number(part.get('costeUnitario')?.value || 0);
    if (!costeRaw) patch['costeUnitario'] = match.coste;
    part.patchValue(patch, { emitEvent: false });
    this.recalcularTotales();
  }

  private cargarPresupuesto(): void {
    if (!this.idPresupuesto) return;
    this.service.getById(this.idPresupuesto).subscribe({
      next: (p) => {
        if (p.tramiteId) this.tramiteId = p.tramiteId;
        this.form.patchValue({
          clienteId: p.clienteId,
          viviendaId: p.viviendaId,
          codigoReferencia: p.codigoReferencia || '',
          fecha: p.fecha,
          estado: p.estado || 'Borrador',
          tipoPresupuesto: p.tipoPresupuesto || 'Obra',
        });
        this.setClienteLabelById(p.clienteId);
        this.setViviendaLabelById(p.viviendaId);

        this.capitulos.clear();
        this.collapsed = [];
        (p.lineas || []).forEach((cap) => {
          const codigo = cap.codigoVisual || String(this.capitulos.length + 1).padStart(2, '0');
          const capGroup = this.buildCapituloGroup(codigo);
          capGroup.patchValue({
            concepto: cap.concepto || '',
            totalCoste: cap.totalCoste ?? 0,
            totalPvp: cap.totalPvp ?? 0,
            importeIva: cap.importeIva ?? 0,
            totalFinal: cap.totalFinal ?? 0,
            totalLinea: cap.totalLinea ?? 0
          }, { emitEvent: false });
          const partidasArr = capGroup.get('partidas') as FormArray;
          (cap.hijos || []).forEach((part) => {
            const partCode = part.codigoVisual || `${codigo}.${String(partidasArr.length + 1).padStart(2, '0')}`;
            const partGroup = this.buildPartidaGroup(partCode);
            partGroup.patchValue({
              productoId: part.productoId ?? null,
              productoTexto: part.productoTexto ?? '',
              concepto: part.concepto,
              cantidad: part.cantidad,
              numVisitas: part.numVisitas ?? 0,
              costeUnitario: part.costeUnitario ?? part.precioUnitario ?? 0,
              factorMargen: part.factorMargen ?? 1,
              ivaPorcentaje: part.ivaPorcentaje ?? 21,
              totalCoste: part.totalCoste ?? 0,
              pvpUnitario: part.pvpUnitario ?? part.precioUnitario ?? 0,
              totalPvp: part.totalPvp ?? part.totalLinea ?? 0,
              importeIva: part.importeIva ?? 0,
              totalFinal: part.totalFinal ?? 0,
              totalLinea: part.totalLinea ?? 0
            }, { emitEvent: false });
            partGroup.valueChanges.subscribe(() => this.recalcularTotales());
            partidasArr.push(partGroup);
          });
          this.capitulos.push(capGroup);
          this.collapsed.push(false);
        });
        if (this.capitulos.length === 0) this.addCapitulo();
        this.recalcularTotales();
      },
      error: () => {
        this.router.navigate(['/presupuestos']);
      }
    });
  }

  private refreshClienteOptions(term: string): void {
    const t = term.toLowerCase();
    this.clientesOptionsView = this.clientesOptions
      .filter((c) => c.label.toLowerCase().includes(t))
      .slice(0, 100);
  }

  private refreshViviendaOptions(term: string): void {
    const t = term.toLowerCase();
    this.localesOptionsView = this.localesOptions
      .filter((l) => l.label.toLowerCase().includes(t))
      .slice(0, 100);
  }

  private buildClienteLabel(c: Cliente): string {
    const nombre = `${c.nombre} ${c.apellido1}${c.apellido2 ? ' ' + c.apellido2 : ''}`.trim();
    const dni = c.dni ? ` (${c.dni})` : '';
    return `${nombre}${dni}`;
  }

  private buildLocalLabel(l: Local): string {
    const dir = l.direccionCompleta || 'Local sin dirección';
    const cups = l.cups ? ` · ${l.cups}` : '';
    return `${dir}${cups}`;
  }

  private buildProductoLabel(p: Producto): string {
    const cod = (p.codRef || '').trim();
    const desc = (p.descripcion || '').trim();
    if (cod && desc) return `${cod} - ${desc}`;
    return cod || desc || `Producto ${p.id}`;
  }

  private setClienteLabelById(id: number | null): void {
    if (!id) return;
    const match = this.clientesOptions.find((c) => c.id === id);
    if (match) {
      this.form.patchValue({ clienteLabel: match.label }, { emitEvent: false });
    } else {
      this.pendingClienteId = id;
    }
  }

  private setViviendaLabelById(id: number | null): void {
    if (!id) return;
    const match = this.localesOptions.find((l) => l.id === id);
    if (match) {
      this.form.patchValue({ viviendaLabel: match.label }, { emitEvent: false });
    } else {
      this.pendingViviendaId = id;
    }
  }

  guardar(): void {
    if (this.guardando) return;
    if (this.form.invalid || this.capitulos.length === 0) {
      const msg = !this.form.get('clienteId')?.value || !this.form.get('viviendaId')?.value
        ? 'Debes seleccionar un cliente y una vivienda válidos del listado.'
        : 'Completa cliente, vivienda y conceptos de capítulo/partida.';
      Swal.fire('Revisa el formulario', msg, 'warning');
      return;
    }
    if (!this.hasPartidas()) {
      Swal.fire('Faltan partidas', 'Añade al menos una partida a un capítulo.', 'warning');
      return;
    }
    this.guardando = true;
    const raw = this.form.getRawValue();
    const lineas: PresupuestoLineaDTO[] = this.capitulos.controls.map((capCtrl, i) => {
      const capVal = capCtrl.value;
      const partidas = (capCtrl.get('partidas') as FormArray).controls.map((pCtrl, j) => {
        const v = pCtrl.value;
        return {
          tipoJerarquia: 'PARTIDA',
          codigoVisual: v.codigoVisual,
          productoId: v.productoId ?? null,
          productoTexto: v.productoTexto,
          concepto: v.concepto,
          cantidad: Number(v.cantidad),
          numVisitas: Number(v.numVisitas ?? 0),
          costeUnitario: Number(v.costeUnitario),
          factorMargen: Number(v.factorMargen ?? 1),
          ivaPorcentaje: Number(v.ivaPorcentaje ?? 21),
          totalCoste: Number(v.totalCoste),
          pvpUnitario: Number(v.pvpUnitario),
          totalPvp: Number(v.totalPvp),
          importeIva: Number(v.importeIva),
          totalFinal: Number(v.totalFinal),
          precioUnitario: Number(v.pvpUnitario),
          totalLinea: Number(v.totalPvp)
        } as PresupuestoLineaDTO;
      });
      return {
        tipoJerarquia: 'CAPITULO',
        codigoVisual: capVal.codigoVisual,
        concepto: capVal.concepto,
        totalCoste: Number(capVal.totalCoste),
        totalPvp: Number(capVal.totalPvp),
        importeIva: Number(capVal.importeIva),
        totalFinal: Number(capVal.totalFinal),
        totalLinea: Number(capVal.totalLinea),
        hijos: partidas
      } as PresupuestoLineaDTO;
    });
    const payload = {
      clienteId: raw.clienteId,
      viviendaId: raw.viviendaId,
      codigoReferencia: raw.codigoReferencia,
      fecha: raw.fecha,
      estado: raw.estado,
      tipoPresupuesto: raw.tipoPresupuesto,
      tramiteId: this.tramiteId ?? undefined,
      total: this.totalConIva,
      totalSinIva: this.totalSinIva,
      totalConIva: this.totalConIva,
      lineas
    };
    const request$ = this.idPresupuesto
      ? this.service.updateBudget(this.idPresupuesto, payload)
      : this.service.createBudget(payload);
    request$.subscribe({
      next: () => {
        this.guardando = false;
        const msg = this.idPresupuesto ? 'Presupuesto actualizado correctamente.' : 'Presupuesto creado correctamente.';

        // Si hay tramiteId, volver a la intervención; si no, ir a la lista de presupuestos
        const route = this.tramiteId
          ? ['/tramite-detalle', this.tramiteId]
          : (this.idPresupuesto ? ['/presupuestos', this.idPresupuesto] : ['/presupuestos']);

        Swal.fire('Guardado', msg, 'success')
          .then(() => this.router.navigate(route));
      },
      error: (e) => {
        this.guardando = false;
        const msg = typeof e?.error === 'string'
          ? e.error
          : (e?.error?.message ?? e?.error?.error ?? 'No se pudo guardar el presupuesto.');
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  private hasPartidas(): boolean {
    return this.capitulos.controls.some((capCtrl) => (capCtrl.get('partidas') as FormArray).length > 0);
  }
}
