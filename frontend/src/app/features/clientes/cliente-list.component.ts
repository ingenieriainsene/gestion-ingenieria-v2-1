import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, Subscription } from 'rxjs';
import { Cliente, ClienteService } from '../../services/domain.services';
import { ApiService } from '../../services/api.service';
import { environment } from '../../../environments/environments';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  template: `
    <div class="header-section">
      <h1>Gestión de Clientes <span class="badge-contador" *ngIf="filtrados">{{ filtrados.length }} registros</span></h1>
      <div style="display:flex; gap:10px;">
        <button type="button" class="btn-export" (click)="exportarPDF()">📄 Exportar PDF</button>
        <button type="button" class="btn-primary" (click)="abrirModalNuevo()">+ Nuevo Cliente</button>
      </div>
    </div>

    <div class="search-bar">
      <input
        type="text"
        [(ngModel)]="filtro"
        (ngModelChange)="aplicarFiltro()"
        placeholder="Buscar por ID, nombre, apellido o DNI..."
        class="search-input"
      />
      <button class="btn-search" (click)="aplicarFiltro()">🔍</button>
    </div>

    <!-- CLIENTS TABLE (LIST MODE) -->
    <div class="table-container">
      <table class="table-card">
        <thead>
          <tr>
            <th>ID</th>
            <th>CLIENTE</th>
            <th>DNI/CIF</th>
            <th>DIRECCIÓN FISCAL</th>
            <th>FECHA ALTA</th>
            <th style="text-align:right;">ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of filtrados" class="row-card" (click)="irAFicha(c)" style="cursor:pointer;">
            <td data-label="ID"><strong>#{{ c.idCliente }}</strong></td>
            <td data-label="Cliente">
              <div class="client-name-cell">
                <div class="client-mini-avatar">{{ getInitials(c) }}</div>
                <span>{{ c.nombre }} {{ c.apellido1 }} {{ c.apellido2 || '' }}</span>
              </div>
            </td>
            <td data-label="DNI/CIF"><code class="dni-badge">{{ c.dni }}</code></td>
            <td data-label="Dirección fiscal"><small>{{ c.direccionFiscalCompleta || '—' }}</small></td>
            <td data-label="Fecha alta"><small>{{ c.fechaAlta | date:'dd/MM/yyyy' }}</small></td>
            <td data-label="Acciones" class="actions-cell" style="text-align:right; white-space:nowrap;">
               <a 
                 class="action-badge badge-edit" 
                 title="Editar" 
                 (click)="$event.stopPropagation()" 
                 [routerLink]="['/clientes', c.idCliente, 'editar']"
               >✏️</a>
               <button 
                 class="action-badge" 
                 style="background: #f39c12; border:none; cursor:pointer;" 
                 title="Archivos" 
                 (click)="$event.stopPropagation(); abrirArchivos(c)"
               >📂</button>
               <button 
                 class="action-badge badge-delete" 
                 style="border:none; cursor:pointer;" 
                 title="Eliminar" 
                 (click)="$event.stopPropagation(); eliminar(c)"
               >🗑️</button>
            </td>
          </tr>
          <tr *ngIf="filtrados.length === 0">
            <td colspan="6" style="text-align:center; padding:40px; color:#64748b;">
               No se encontraron clientes con los criterios de búsqueda.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL NUEVO CLIENTE -->
    <div class="modal-overlay" *ngIf="modalVisible" (click)="onOverlayClick($event)">
      <div class="modal-bubble modal-form" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Nuevo Cliente</h2>
          <button type="button" class="close-btn" (click)="cerrarModal()">✕</button>
        </div>
        <form [formGroup]="formModal" (ngSubmit)="guardarNuevo()">
          <div class="modal-grid">
            <div class="modal-field">
              <label>Nombre *</label>
              <input type="text" formControlName="nombre" />
            </div>
            <div class="modal-field">
              <label>Primer apellido *</label>
              <input type="text" formControlName="apellido1" />
            </div>
            <div class="modal-field">
              <label>Segundo apellido</label>
              <input type="text" formControlName="apellido2" />
            </div>
            <div class="modal-field">
              <label>DNI/CIF *</label>
              <input type="text" formControlName="dni" />
            </div>
            <div class="modal-field">
              <label>Código postal</label>
              <input type="text" formControlName="codigoPostal" />
            </div>
            <div class="modal-field full">
              <label>Dirección fiscal completa</label>
              <input type="text" formControlName="direccionFiscalCompleta" />
            </div>
            <div class="modal-field full">
              <label>Cuenta bancaria (IBAN)</label>
              <input type="text" formControlName="cuentaBancaria" />
            </div>
            <div class="modal-field full">
              <label>Correo electrónico</label>
              <input type="email" formControlName="email" placeholder="ejemplo@correo.com" />
            </div>

            <!-- DYNAMIC PHONES -->
            <div class="modal-field full">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <label>Teléfonos</label>
                <button type="button" class="btn-add-phone" (click)="addTelefono()">+ Añadir</button>
              </div>
              <div formArrayName="telefonos" *ngFor="let t of telefonosArr.controls; let i=index" class="phone-row">
                <div [formGroupName]="i" style="display:flex; gap:8px; margin-top:8px;">
                  <input type="text" formControlName="telefono" placeholder="Número" style="flex:2;" />
                  <input type="text" formControlName="descripcion" placeholder="Etiqueta (Móvil, etc)" style="flex:1;" />
                  <button type="button" class="btn-remove-phone" (click)="removeTelefono(i)">✕</button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" (click)="cerrarModal()">Cancelar</button>
            <button type="submit" class="btn-primary" [disabled]="formModal.invalid || guardando">Guardar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL ARCHIVOS -->
    <div class="modal-overlay" *ngIf="modalArchivosVisible" (click)="onOverlayClick($event)">
      <div class="modal-bubble modal-form" (click)="$event.stopPropagation()">
        <div class="modal-header">
            <h3>Archivos: {{ clienteSeleccionado?.nombre }} {{ clienteSeleccionado?.apellido1 }}</h3>
            <button type="button" class="close-btn" (click)="cerrarModalArchivos()">✕</button>
        </div>
        
        <div style="margin: 20px 0; display:flex; gap:10px; align-items:center;">
            <label class="btn-primary" style="cursor: pointer; display: inline-block;">
                + Subir Archivo
                <input type="file" (change)="onFileSelected($event)" hidden>
            </label>
            <span *ngIf="subiendoArchivo" style="color:#666; font-size:0.9em;">Subiendo...</span>
        </div>

        <div style="max-height: 400px; overflow-y: auto; border: 1px solid #eee; border-radius: 8px;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f8f9fa;">
                    <tr style="border-bottom: 1px solid #eee; text-align:left;">
                        <th style="padding:10px;">Nombre</th>
                        <th style="padding:10px;">Fecha</th>
                        <th style="padding:10px; text-align:right;">Acción</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let f of listaArchivos" style="border-bottom: 1px solid #f9f9f9;">
                        <td style="padding:10px;">
                            <a [href]="descargarUrl(f.url)" target="_blank" style="color:#3498db; text-decoration:none; font-weight:500;">
                                📄 {{ f.nombreVisible }}
                            </a>
                        </td>
                        <td style="padding:10px; font-size:0.85em; color:#666;">{{ f.fechaSubida | date:'dd/MM/yyyy HH:mm' }}</td>
                        <td style="padding:10px; text-align:right;">
                             <button style="border:none; background:none; cursor:pointer; font-size:1.1em;" (click)="borrarArchivo(f)" title="Borrar">🗑️</button>
                        </td>
                    </tr>
                    <tr *ngIf="listaArchivos.length === 0">
                        <td colspan="3" style="text-align: center; padding: 30px; color: #999;">No hay archivos guardados.</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="modal-actions">
           <button class="btn-secondary" (click)="cerrarModalArchivos()">Cerrar</button>
        </div>
      </div>
    </div>
  `
  ,
  styles: [`
    .header-section {
      /* Uses global styles */
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
    .btn-primary:active { transform: translateY(1px); }

    .btn-export {
      background: #f8fafc;
      color: #1e293b;
      padding: 0.75rem 1.25rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn-export:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

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
      background: #eff6ff;
      color: #3b82f6;
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
    .badge-delete { background: #e74c3c; color: white !important; }
    .action-badge:hover {
      transform: scale(1.1);
      filter: brightness(1.1);
    }

    /* Modal Styles (Legacy) */
    .modal-form { max-width: 680px; width: 90%; text-align: left; background: white; border-radius: 12px; overflow: hidden; height: auto; padding: 20px;}
    .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
    .modal-field { display: flex; flex-direction: column; gap: 6px; }
    .modal-field.full { grid-column: span 2; }
    .modal-field input {
      padding: 0.75rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      font-family: inherit;
      width: 100%;
      box-sizing: border-box;
    }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 1.5rem; }
    .btn-secondary {
      background: #94a3b8;
      color: white;
      padding: 10px 18px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      font-weight: 600;
    }
    .modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px; }
    .close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b; }
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
      animation: fadeIn 0.2s;
    }
    
    @keyframes fadeIn {
       from { opacity: 0; transform: translateY(10px); }
       to { opacity: 1; transform: translateY(0); }
    }

    .btn-add-phone {
      background: #ecf3ff;
      color: #3b82f6;
      border: 1px solid #d0e1fd;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-remove-phone {
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fecaca;
      width: 32px;
      border-radius: 6px;
      cursor: pointer;
    }
    .phone-row { display: flex; flex-direction: column; }

    @media (max-width: 768px) {
      .header-section {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .search-bar {
        flex-direction: column;
      }

      .modal-grid {
        grid-template-columns: 1fr;
      }

      .modal-actions {
        flex-direction: column;
      }
    }
  `]
})
export class ClienteListComponent implements OnInit, OnDestroy {
  clientes: Cliente[] = [];
  filtrados: Cliente[] = [];
  filtro = '';
  modalVisible = false;
  guardando = false;
  formModal: FormGroup;
  private dniSub?: Subscription;

  // Archivos variables
  modalArchivosVisible = false;
  clienteSeleccionado: Cliente | null = null;
  listaArchivos: import('../../services/domain.services').ArchivoCliente[] = [];
  subiendoArchivo = false;

  constructor(
    private service: ClienteService,
    private api: ApiService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.formModal = this.fb.group({
      nombre: ['', Validators.required],
      apellido1: ['', Validators.required],
      apellido2: [''],
      dni: ['', Validators.required],
      codigoPostal: [''],
      direccionFiscalCompleta: [''],
      cuentaBancaria: [''],
      email: ['', Validators.email],
      telefonos: this.fb.array([])
    });
  }

  get telefonosArr() {
    return this.formModal.get('telefonos') as import('@angular/forms').FormArray;
  }

  addTelefono() {
    this.telefonosArr.push(this.fb.group({
      telefono: ['', Validators.required],
      descripcion: ['']
    }));
  }

  removeTelefono(i: number) {
    this.telefonosArr.removeAt(i);
  }

  ngOnInit() {
    this.service.getAll().subscribe(data => {
      this.clientes = data;
      this.filtrados = data;
    });

    this.dniSub = this.formModal.get('dni')!.valueChanges.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      switchMap(dni => {
        if (!dni || dni.length < 5 || !this.modalVisible) return of(null);
        return this.service.checkDni(dni).pipe(
          catchError(() => of(null))
        );
      })
    ).subscribe(existente => {
      if (existente && existente.idCliente) {
        Swal.fire({
          title: 'DNI ya registrado',
          html: `Ya existe un cliente con este DNI: <b>${existente.nombre} ${existente.apellido1}</b>.<br><br>¿Deseas ir a su ficha?`,
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Ver Ficha',
          confirmButtonColor: '#2563eb',
          cancelButtonText: 'Seguir aquí'
        }).then(res => {
          if (res.isConfirmed) {
            this.cerrarModal();
            this.irAFicha(existente);
          }
        });
      }
    });
  }

  ngOnDestroy() {
    this.dniSub?.unsubscribe();
  }

  irAFicha(c: Cliente) {
    if (c.idCliente) {
      this.router.navigate(['/clientes', c.idCliente]);
    }
  }

  getInitials(c: Cliente): string {
    const n = (c.nombre || '').charAt(0);
    const a = (c.apellido1 || '').charAt(0);
    return (n + a).toUpperCase();
  }

  abrirModalNuevo() {
    this.guardando = false;
    this.formModal.reset();
    this.modalVisible = true;
  }

  cerrarModal() {
    this.modalVisible = false;
  }

  onOverlayClick(e: Event) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cerrarModal();
      this.cerrarModalArchivos();
    }
  }

  guardarNuevo() {
    if (this.formModal.invalid || this.guardando) return;
    this.guardando = true;
    const payload = this.formModal.value;
    this.service.create(payload).subscribe({
      next: (created) => {
        this.guardando = false;
        this.cerrarModal();
        this.clientes = [created, ...this.clientes];
        this.aplicarFiltro();
        Swal.fire('Guardado', 'Cliente creado correctamente.', 'success');
      },
      error: (e) => {
        this.guardando = false;
        Swal.fire('Error', e?.error?.message || 'No se pudo crear el cliente.', 'error');
      }
    });
  }

  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  aplicarFiltro() {
    const term = this.normalizeString(this.filtro || '').trim();
    if (!term) {
      this.filtrados = this.clientes;
      return;
    }

    // Prioridad 1: Si el término es un número, buscar por ID real
    const num = Number(term);
    if (!isNaN(num)) {
      const exactIdMatch = this.clientes.find(c =>
        c.idCliente && c.idCliente.toString() === term
      );
      if (exactIdMatch) {
        this.filtrados = [exactIdMatch];
        return;
      }
    }

    // Prioridad 2: Búsqueda general por substring (insensible a tildes)
    this.filtrados = this.clientes.filter(c =>
      (c.idCliente && c.idCliente.toString().includes(term)) ||
      (this.normalizeString(c.nombre || '').includes(term)) ||
      (this.normalizeString(c.apellido1 || '').includes(term)) ||
      (this.normalizeString(c.apellido2 || '').includes(term)) ||
      (this.normalizeString(c.dni || '').includes(term))
    );
  }

  eliminar(c: Cliente) {
    if (!c.idCliente) return;
    Swal.fire({
      title: '¿Eliminar cliente?',
      text: `¿Seguro que deseas eliminar al cliente ${c.nombre} ${c.apellido1}? Se borrarán también sus contratos y locales vinculados.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e293b',
      cancelButtonText: 'Cancelar',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.service.delete(c.idCliente!).subscribe({
        next: () => {
          this.clientes = this.clientes.filter(x => x.idCliente !== c.idCliente);
          this.aplicarFiltro();
          Swal.fire('Eliminado', 'Cliente borrado correctamente.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo eliminar el cliente.', 'error'),
      });
    });
  }

  exportarPDF() {
    Swal.fire({
      title: 'Generando PDF',
      text: 'Espere un momento...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    this.api.getBlob('export/clientes').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `listado-clientes-${new Date().getTime()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        Swal.close();
      },
      error: () => {
        Swal.fire('Error', 'No se pudo generar el PDF.', 'error');
      }
    });
  }

  // --- LOGICA DE ARCHIVOS ---

  abrirArchivos(c: Cliente) {
    this.clienteSeleccionado = c;
    this.listaArchivos = [];
    this.modalArchivosVisible = true;
    this.cargarArchivos();
  }

  cerrarModalArchivos() {
    this.modalArchivosVisible = false;
    this.clienteSeleccionado = null;
  }

  cargarArchivos() {
    if (!this.clienteSeleccionado?.idCliente) return;
    this.service.getArchivos(this.clienteSeleccionado.idCliente).subscribe(list => {
      this.listaArchivos = list;
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file && this.clienteSeleccionado?.idCliente) {
      this.subiendoArchivo = true;
      this.service.subirArchivo(this.clienteSeleccionado.idCliente, file).subscribe({
        next: (nuevo) => {
          this.subiendoArchivo = false;
          this.listaArchivos.push(nuevo);
          Swal.fire('Subido', 'Archivo guardado correctamente.', 'success');
        },
        error: () => {
          this.subiendoArchivo = false;
          Swal.fire('Error', 'No se pudo subir el archivo.', 'error');
        }
      });
    }
  }

  borrarArchivo(archivo: import('../../services/domain.services').ArchivoCliente) {
    Swal.fire({
      title: '¿Borrar archivo?',
      text: `¿Eliminar ${archivo.nombreVisible}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
    }).then((res) => {
      if (res.isConfirmed) {
        this.service.deleteArchivo(archivo.idArchivo).subscribe({
          next: () => {
            this.listaArchivos = this.listaArchivos.filter(a => a.idArchivo !== archivo.idArchivo);
            Swal.fire('Borrado', 'Archivo eliminado.', 'success');
          },
          error: () => Swal.fire('Error', 'No se pudo borrar.', 'error')
        });
      }
    });
  }

  descargarUrl(url: string): string {
    const baseUrl = environment.apiUrl.replace('/api', '');
    return baseUrl + (url.startsWith('/') ? '' : '/') + url;
  }
}
