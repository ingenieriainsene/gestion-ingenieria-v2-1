import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PresupuestoService, PresupuestoLineaDTO } from '../../services/presupuesto.service';
import { ClienteService, LocalService, Cliente, Local } from '../../services/domain.services';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-presupuesto-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="mb-3">
      <a [routerLink]="idPresupuesto ? ['/presupuestos', idPresupuesto] : ['/presupuestos']" class="direct-link">
        &larr; {{ idPresupuesto ? 'Volver a la ficha' : 'Volver al listado' }}
      </a>
    </div>

    <div class="main-container">
      <h1>{{ idPresupuesto ? 'Editar Presupuesto' : 'Nuevo Presupuesto' }}</h1>

      <form [formGroup]="form" (ngSubmit)="guardar()">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Cliente *</label>
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
          <div class="form-group">
            <label class="form-label">Vivienda *</label>
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
          <div class="form-group">
            <label class="form-label">Código referencia</label>
            <input type="text" class="form-control" formControlName="codigoReferencia" placeholder="PRES-0001" />
          </div>
          <div class="form-group">
            <label class="form-label">Fecha *</label>
            <input type="date" class="form-control" formControlName="fecha" />
          </div>
          <div class="form-group">
            <label class="form-label">Estado</label>
            <select class="form-control" formControlName="estado">
              <option value="Borrador">Borrador</option>
              <option value="Enviado">Enviado</option>
              <option value="Aceptado">Aceptado</option>
              <option value="Rechazado">Rechazado</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Total</label>
            <input type="text" class="form-control" [value]="totalPresupuesto | number:'1.2-2'" disabled />
          </div>
        </div>

        <div class="lineas-header">
          <h2>Líneas de presupuesto</h2>
          <button type="button" class="btn-primary" (click)="addLinea()">+ Añadir línea</button>
        </div>

        <div class="lineas-table" formArrayName="lineas">
          <div class="linea-row" *ngFor="let linea of lineas.controls; let i = index" [formGroupName]="i">
            <div class="col col-prod">
              <label>Producto</label>
              <input type="text" class="form-control" formControlName="productoTexto" placeholder="Producto libre" />
            </div>
            <div class="col col-concepto">
              <label>Tipo de linea</label>
              <input type="text" class="form-control" formControlName="concepto" />
            </div>
            <div class="col col-cantidad">
              <label>Cant.</label>
              <input type="number" class="form-control" formControlName="cantidad" min="0" step="0.01" />
            </div>
            <div class="col col-precio">
              <label>Precio</label>
              <input type="number" class="form-control" formControlName="precioUnitario" min="0" step="0.01" />
            </div>
            <div class="col col-total">
              <label>Total</label>
              <input type="text" class="form-control" [value]="getLineaTotal(i) | number:'1.2-2'" disabled />
            </div>
            <div class="col col-actions">
              <label>&nbsp;</label>
              <button type="button" class="btn-secondary" (click)="removeLinea(i)">Eliminar</button>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-primary" [disabled]="form.invalid || lineas.length === 0 || guardando">
            Guardar presupuesto
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #64748b; }
    .lineas-header { display: flex; justify-content: space-between; align-items: center; margin: 24px 0 12px; }
    .lineas-table { display: flex; flex-direction: column; gap: 12px; }
    .linea-row {
      display: grid;
      grid-template-columns: 1.3fr 2fr 0.6fr 0.8fr 0.8fr 0.6fr;
      gap: 10px;
      align-items: end;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 12px;
      border-radius: 12px;
    }
    .col label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; display:block; }
    .form-actions { margin-top: 20px; }
    .btn-secondary {
      background: #94a3b8;
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-weight: 600;
      width: 100%;
    }
    @media (max-width: 1200px) {
      .form-grid { grid-template-columns: 1fr 1fr; }
      .linea-row { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class PresupuestoFormComponent implements OnInit {
  form: FormGroup;
  clientes: Cliente[] = [];
  locales: Local[] = [];
  clientesOptions: { id: number; label: string }[] = [];
  localesOptions: { id: number; label: string }[] = [];
  clientesOptionsView: { id: number; label: string }[] = [];
  localesOptionsView: { id: number; label: string }[] = [];
  totalPresupuesto = 0;
  guardando = false;
  idPresupuesto: number | null = null;
  private pendingClienteId: number | null = null;
  private pendingViviendaId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private service: PresupuestoService,
    private clienteService: ClienteService,
    private localService: LocalService,
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
      lineas: this.fb.array([])
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
        if (this.lineas.length === 0) this.addLinea();
      }
    });

    this.clienteService.getAll().subscribe((list) => {
      this.clientes = list || [];
      this.clientesOptions = this.clientes
        .filter((c) => typeof c.idCliente === 'number')
        .map((c) => ({
          id: c.idCliente!,
          label: this.buildClienteLabel(c),
        }));
      this.refreshClienteOptions('');
      if (this.pendingClienteId) {
        this.setClienteLabelById(this.pendingClienteId);
        this.pendingClienteId = null;
      }
    });
    this.localService.getAll().subscribe((list) => {
      this.locales = list || [];
      this.localesOptions = this.locales
        .filter((l) => typeof l.idLocal === 'number')
        .map((l) => ({
          id: l.idLocal!,
          label: this.buildLocalLabel(l),
        }));
      this.refreshViviendaOptions('');
      if (this.pendingViviendaId) {
        this.setViviendaLabelById(this.pendingViviendaId);
        this.pendingViviendaId = null;
      }
    });
    this.lineas.valueChanges.subscribe(() => this.recalcularTotales());
  }

  get lineas(): FormArray {
    return this.form.get('lineas') as FormArray;
  }

  private buildLineaGroup(value?: any): FormGroup {
    return this.fb.group({
      orden: [null],
      productoTexto: [''],
      concepto: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
      precioUnitario: [0, [Validators.required, Validators.min(0)]],
      totalLinea: [0]
    });
  }

  addLinea(): void {
    const linea = this.buildLineaGroup();
    linea.valueChanges.subscribe(() => this.recalcularTotales());
    this.lineas.push(linea);
    this.recalcularTotales();
  }

  removeLinea(index: number): void {
    this.lineas.removeAt(index);
    this.recalcularTotales();
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

  private cargarPresupuesto(): void {
    if (!this.idPresupuesto) return;
    this.service.getById(this.idPresupuesto).subscribe({
      next: (p) => {
        this.form.patchValue({
          clienteId: p.clienteId,
          viviendaId: p.viviendaId,
          codigoReferencia: p.codigoReferencia || '',
          fecha: p.fecha,
          estado: p.estado || 'Borrador',
        });
        this.setClienteLabelById(p.clienteId);
        this.setViviendaLabelById(p.viviendaId);

        this.lineas.clear();
        (p.lineas || []).forEach((l) => {
          const linea = this.buildLineaGroup();
          linea.patchValue({
            orden: l.orden ?? null,
            productoTexto: l.productoTexto || '',
            concepto: l.concepto,
            cantidad: l.cantidad,
            precioUnitario: l.precioUnitario,
            totalLinea: l.totalLinea ?? 0
          }, { emitEvent: false });
          linea.valueChanges.subscribe(() => this.recalcularTotales());
          this.lineas.push(linea);
        });
        if (this.lineas.length === 0) this.addLinea();
        this.recalcularTotales();
      },
      error: () => {
        this.router.navigate(['/presupuestos']);
      }
    });
  }

  getLineaTotal(index: number): number {
    const linea = this.lineas.at(index).value;
    const cantidad = Number(linea.cantidad || 0);
    const precio = Number(linea.precioUnitario || 0);
    return cantidad * precio;
  }

  private recalcularTotales(): void {
    let total = 0;
    this.lineas.controls.forEach((ctrl, idx) => {
      const val = ctrl.value;
      const cantidad = Number(val.cantidad || 0);
      const precio = Number(val.precioUnitario || 0);
      const totalLinea = cantidad * precio;
      total += totalLinea;
      ctrl.patchValue({ totalLinea }, { emitEvent: false });
    });
    this.totalPresupuesto = total;
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
    if (this.form.invalid || this.guardando || this.lineas.length === 0) return;
    this.guardando = true;
    const raw = this.form.getRawValue();
    const lineas: PresupuestoLineaDTO[] = this.lineas.controls.map((ctrl, i) => {
      const v = ctrl.value;
      return {
        orden: i + 1,
        productoId: null,
        productoTexto: v.productoTexto,
        concepto: v.concepto,
        cantidad: Number(v.cantidad),
        precioUnitario: Number(v.precioUnitario),
        totalLinea: Number(v.totalLinea)
      };
    });
    const payload = {
      clienteId: raw.clienteId,
      viviendaId: raw.viviendaId,
      codigoReferencia: raw.codigoReferencia,
      fecha: raw.fecha,
      estado: raw.estado,
      total: this.totalPresupuesto,
      lineas
    };
    const request$ = this.idPresupuesto
      ? this.service.updateBudget(this.idPresupuesto, payload)
      : this.service.createBudget(payload);
    request$.subscribe({
      next: () => {
        this.guardando = false;
        const msg = this.idPresupuesto ? 'Presupuesto actualizado correctamente.' : 'Presupuesto creado correctamente.';
        const route = this.idPresupuesto ? ['/presupuestos', this.idPresupuesto] : ['/presupuestos'];
        Swal.fire('Guardado', msg, 'success')
          .then(() => this.router.navigate(route));
      },
      error: (e) => {
        this.guardando = false;
        const msg = e?.error?.message ?? e?.error?.error ?? 'No se pudo guardar el presupuesto.';
        Swal.fire('Error', msg, 'error');
      }
    });
  }
}
