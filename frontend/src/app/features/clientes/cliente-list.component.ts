import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Cliente, ClienteService } from '../../services/domain.services';
import { environment } from '../../../environments/environments';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  template: `
    <div class="header-section">
      <h1>Gestión de Clientes</h1>
      <button type="button" class="btn-primary" (click)="abrirModalNuevo()">+ Nuevo Cliente</button>
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

    <!-- CLIENTS GRID -->
    <div class="client-grid">
      <div 
        *ngFor="let c of filtrados" 
        class="client-card fade-in" 
        (click)="irAFicha(c)"
      >
        <div class="card-content">
          <div class="client-avatar">
            #{{ c.idCliente }}
          </div>
          <div class="client-info">
            <h3>{{ c.nombre }} {{ c.apellido1 }} {{ c.apellido2 || '' }}</h3>
            <span class="client-dni">{{ c.dni }}</span>
            <p class="client-address" *ngIf="c.direccionFiscalCompleta">
              📍 {{ c.direccionFiscalCompleta }}
            </p>
          </div>
        </div>
        
        <div class="card-actions">
           <button 
             class="btn-icon btn-edit" 
             title="Editar" 
             (click)="$event.stopPropagation()" 
             [routerLink]="['/clientes', c.idCliente, 'editar']"
           >✏️</button>
           
           <button 
             class="btn-icon btn-files" 
             title="Archivos" 
             (click)="$event.stopPropagation(); abrirArchivos(c)"
           >📂</button>
           
           <button 
             class="btn-icon btn-delete" 
             title="Eliminar" 
             (click)="$event.stopPropagation(); eliminar(c)"
           >🗑️</button>
        </div>
      </div>
      
      <!-- Empty State -->
      <div *ngIf="filtrados.length === 0" class="empty-state">
         No se encontraron clientes con los criterios de búsqueda.
      </div>
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
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
      transition: transform 0.2s;
    }
    .btn-primary:active { transform: translateY(1px); }

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

    /* Grid System */
    .client-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    
    .client-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      cursor: pointer; /* Indicates interactivity */
      transition: all 0.2s ease-out;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: fadeIn 0.4s ease-out;
    }
    
    .client-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      border-color: #3b82f6;
    }
    
    .card-content {
      padding: 1.5rem;
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      flex: 1;
    }
    
    .client-avatar {
      width: 48px;
      height: 48px;
      background: #eff6ff;
      color: #3b82f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.2rem;
      flex-shrink: 0;
    }
    
    .client-info {
      overflow: hidden;
    }
    
    .client-info h3 {
      margin: 0 0 0.25rem 0;
      font-size: 1.1rem;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .client-dni {
      display: inline-block;
      background: #f1f5f9;
      color: #64748b;
      font-size: 0.8rem;
      padding: 2px 6px;
      border-radius: 4px;
      margin-bottom: 0.5rem;
      font-weight: 600;
      font-family: monospace;
    }
    
    .client-address {
      margin: 0.5rem 0 0 0;
      font-size: 0.85rem;
      color: #64748b;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .card-actions {
      border-top: 1px solid #f1f5f9;
      padding: 0.75rem 1.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      background: #fcfcfc;
    }
    
    .btn-icon {
      background: none;
      border: 1px solid transparent;
      border-radius: 6px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
    }
    
    .btn-icon:hover { background: #f1f5f9; border-color: #e2e8f0; }
    
    .btn-edit:hover { color: #2563eb; background: #eff6ff; border-color: #bfdbfe; }
    .btn-files:hover { color: #d97706; background: #fffbeb; border-color: #fcd34d; }
    .btn-delete:hover { color: #dc2626; background: #fee2e2; border-color: #fecaca; }
    
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      color: #94a3b8;
      background: #f8fafc;
      border-radius: 12px;
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
  `]
})
export class ClienteListComponent implements OnInit {
  clientes: Cliente[] = [];
  filtrados: Cliente[] = [];
  filtro = '';
  modalVisible = false;
  guardando = false;
  formModal: FormGroup;

  // Archivos variables
  modalArchivosVisible = false;
  clienteSeleccionado: Cliente | null = null;
  listaArchivos: import('../../services/domain.services').ArchivoCliente[] = [];
  subiendoArchivo = false;

  constructor(
    private service: ClienteService,
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
    });
  }

  ngOnInit() {
    this.service.getAll().subscribe(data => {
      this.clientes = data;
      this.filtrados = data;
    });
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

    // Prioridad 1: Si el término es un número y coincide EXACTAMENTE con un ID
    const exactIdMatch = this.clientes.find(c =>
      c.idCliente && c.idCliente.toString() === term
    );
    if (exactIdMatch) {
      this.filtrados = [exactIdMatch];
      return;
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
