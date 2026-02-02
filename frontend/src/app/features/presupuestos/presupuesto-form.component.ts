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
            <input type="text" class="form-control" [value]="totalConIva | number:'1.2-2'" disabled />
          </div>
        </div>

        <div class="lineas-header">
          <h2>Capítulos y partidas</h2>
          <button type="button" class="btn-primary" (click)="addCapitulo()">+ Nuevo Capítulo</button>
        </div>

        <table class="tree-table" formArrayName="capitulos">
          <thead>
            <tr>
              <th style="width:90px;">CÓDIGO</th>
              <th>CONCEPTO</th>
              <th style="width:80px; text-align:right;">CANT.</th>
              <th style="width:110px; text-align:right;">P. COSTE</th>
              <th style="width:120px; text-align:right;">TOT. COSTE</th>
              <th style="width:90px; text-align:right;">MARGEN</th>
              <th style="width:120px; text-align:right;">TOT. PVP</th>
              <th style="width:80px; text-align:right;">% IVA</th>
              <th style="width:120px; text-align:right;">IMP. IVA</th>
              <th style="width:120px; text-align:right;">TOTAL</th>
              <th style="width:140px; text-align:right;">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let cap of capitulos.controls; let i = index" [formGroupName]="i">
              <tr class="row-capitulo" (click)="selectCapitulo(i)">
                <td class="code-cell">{{ cap.get('codigoVisual')?.value }}</td>
                <td>
                  <button type="button" class="toggle-btn" (click)="toggleCapitulo(i); $event.stopPropagation()">
                    {{ collapsed[i] ? '▶' : '▼' }}
                  </button>
                  <input type="text" class="form-control flat-input" formControlName="concepto" placeholder="Nombre del capítulo" />
                </td>
                <td></td>
                <td></td>
                <td class="num readonly-cell">{{ getCapituloTotalCoste(i) | number:'1.2-2' }} €</td>
                <td></td>
                <td class="num readonly-cell">{{ getCapituloTotalPvp(i) | number:'1.2-2' }} €</td>
                <td></td>
                <td class="num readonly-cell">{{ getCapituloImporteIva(i) | number:'1.2-2' }} €</td>
                <td class="num readonly-cell">{{ getCapituloTotalFinal(i) | number:'1.2-2' }} €</td>
                <td class="actions">
                  <button type="button" class="btn-secondary" *ngIf="selectedCapituloIndex === i" (click)="addPartida(i); $event.stopPropagation()">+ Partida</button>
                  <button type="button" class="btn-secondary" (click)="removeCapitulo(i); $event.stopPropagation()">Eliminar</button>
                </td>
              </tr>
              <ng-container formArrayName="partidas" *ngIf="!collapsed[i]">
                <tr *ngFor="let part of getPartidas(i).controls; let j = index" [formGroupName]="j" class="row-partida">
                  <td class="code-cell indent">{{ part.get('codigoVisual')?.value }}</td>
                  <td><input type="text" class="form-control flat-input" formControlName="concepto" placeholder="Concepto de partida" /></td>
                  <td class="num"><input type="number" class="form-control flat-input num" formControlName="cantidad" min="0" step="0.01" /></td>
                  <td class="num"><input type="number" class="form-control flat-input num" formControlName="costeUnitario" min="0" step="0.01" /></td>
                  <td class="num readonly-cell">{{ getPartidaTotalCoste(i, j) | number:'1.2-2' }} €</td>
                  <td class="num"><input type="number" class="form-control flat-input num" formControlName="factorMargen" min="1" step="0.01" /></td>
                  <td class="num readonly-cell">{{ getPartidaTotalPvp(i, j) | number:'1.2-2' }} €</td>
                  <td class="num"><input type="number" class="form-control flat-input num" formControlName="ivaPorcentaje" min="0" step="0.01" /></td>
                  <td class="num readonly-cell">{{ getPartidaImporteIva(i, j) | number:'1.2-2' }} €</td>
                  <td class="num readonly-cell">{{ getPartidaTotalFinal(i, j) | number:'1.2-2' }} €</td>
                  <td class="actions">
                    <button type="button" class="btn-secondary" (click)="removePartida(i, j)">Eliminar</button>
                  </td>
                </tr>
              </ng-container>
            </ng-container>
          </tbody>
        </table>

        <div class="form-actions">
          <button type="submit" class="btn-primary" [disabled]="guardando">
            Guardar presupuesto
          </button>
        </div>
        <div class="totales-resumen">
          <div class="resumen-item">
            <span>Total sin IVA</span>
            <strong>{{ totalSinIva | number:'1.2-2' }} €</strong>
          </div>
          <div class="resumen-item">
            <span>IVA total</span>
            <strong>{{ totalIva | number:'1.2-2' }} €</strong>
          </div>
          <div class="resumen-item total">
            <span>TOTAL con IVA</span>
            <strong>{{ totalConIva | number:'1.2-2' }} €</strong>
          </div>
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
    .tree-table { width: 100%; border-collapse: collapse; }
    .tree-table th {
      background: #f1f5f9;
      padding: 12px;
      text-align: left;
      font-size: 0.7rem;
      text-transform: uppercase;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }
    .tree-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .row-capitulo { background: #f8fafc; font-weight: 700; }
    .row-partida { background: #fff; }
    .toggle-btn {
      border: none;
      background: transparent;
      margin-right: 6px;
      cursor: pointer;
      font-weight: 700;
      color: #334155;
    }
    .flat-input {
      width: 100%;
      padding: 6px 8px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      font-family: inherit;
      box-sizing: border-box;
    }
    .num { text-align: right; }
    .readonly-cell { background: #f1f5f9; }
    .actions { text-align: right; }
    .code-cell { white-space: nowrap; color: #0f172a; }
    .indent { padding-left: 24px; }
    .form-actions { margin-top: 20px; }
    .totales-resumen {
      margin-top: 24px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 16px;
      border-radius: 12px;
    }
    .resumen-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
      color: #1e293b;
    }
    .resumen-item span {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      font-weight: 700;
    }
    .resumen-item.total strong {
      font-size: 1.1rem;
      color: #0f172a;
    }
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
      .tree-table th, .tree-table td { font-size: 0.8rem; }
      .totales-resumen { grid-template-columns: 1fr; }
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
  totalSinIva = 0;
  totalConIva = 0;
  totalIva = 0;
  guardando = false;
  idPresupuesto: number | null = null;
  private pendingClienteId: number | null = null;
  private pendingViviendaId: number | null = null;
  collapsed: boolean[] = [];
  selectedCapituloIndex: number | null = null;

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
      concepto: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
      costeUnitario: [0, [Validators.required, Validators.min(0)]],
      factorMargen: [1.00, [Validators.min(1)]],
      ivaPorcentaje: [21, [Validators.min(0)]],
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
              concepto: part.concepto,
              cantidad: part.cantidad,
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
          concepto: v.concepto,
          cantidad: Number(v.cantidad),
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
        const route = this.idPresupuesto ? ['/presupuestos', this.idPresupuesto] : ['/presupuestos'];
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
