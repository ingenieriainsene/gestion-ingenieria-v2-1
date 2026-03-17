import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarOptions, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import Swal from 'sweetalert2';
import { CitaService, ClienteService, Cita } from '../../services/domain.services';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-agendar-citas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FullCalendarModule],
  template: `
    <div class="citas-page" [class.compact]="panelVisible">
    <div class="header-section">
      <div>
        <h1>Agendar citas</h1>
        <p class="subtitle">Gestiona citas remotas con clientes, técnicos y recordatorios.</p>
      </div>
      <div class="header-actions">
        <input
          type="text"
          class="search-input"
          placeholder="Buscar cliente o técnico"
          [(ngModel)]="busqueda"
          (input)="refreshCalendar()"
        />
        <button type="button" class="btn-primary" (click)="abrirNuevo()">+ Nueva cita</button>
      </div>
    </div>

    <div class="stats-row" *ngIf="!panelVisible">
      <div class="stat-card">
        <span class="stat-label">Total</span>
        <span class="stat-value">{{ stats.total }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Programadas</span>
        <span class="stat-value">{{ stats.programadas }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Confirmadas</span>
        <span class="stat-value">{{ stats.confirmadas }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Canceladas</span>
        <span class="stat-value">{{ stats.canceladas }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Realizadas</span>
        <span class="stat-value">{{ stats.realizadas }}</span>
      </div>
    </div>

    <div class="filter-bar">
      <span class="filter-label">Filtrar:</span>
      <button class="filter-chip" [class.active]="estadoFiltro === 'Todas'" (click)="setFiltro('Todas')">Todas</button>
      <button class="filter-chip" [class.active]="estadoFiltro === 'Programada'" (click)="setFiltro('Programada')">Programadas</button>
      <button class="filter-chip" [class.active]="estadoFiltro === 'Confirmada'" (click)="setFiltro('Confirmada')">Confirmadas</button>
      <button class="filter-chip" [class.active]="estadoFiltro === 'Cancelada'" (click)="setFiltro('Cancelada')">Canceladas</button>
      <button class="filter-chip" [class.active]="estadoFiltro === 'Realizada'" (click)="setFiltro('Realizada')">Realizadas</button>

      <div class="legend" *ngIf="!panelVisible">
        <span class="legend-item programada">Programada</span>
        <span class="legend-item confirmada">Confirmada</span>
        <span class="legend-item cancelada">Cancelada</span>
        <span class="legend-item realizada">Realizada</span>
      </div>
    </div>

    <div class="calendar-layout" [class.with-panel]="panelVisible">
      <div class="calendar-wrap">
        <full-calendar [options]="calendarOptions"></full-calendar>
      </div>
      <aside *ngIf="panelVisible" class="detail-panel">
        <div class="panel-header">
          <div>
            <h3>Detalle de cita</h3>
            <p *ngIf="panelVisible">Edita la cita y guarda cambios.</p>
            <p *ngIf="!panelVisible">Selecciona una cita del calendario.</p>
          </div>
          <button type="button" class="close-btn" (click)="cerrarPanel()">✕</button>
        </div>

        <div *ngIf="panelVisible" class="panel-body">
          <div class="modal-grid">
            <div class="modal-field">
              <label>Cliente *</label>
              <input type="text" [(ngModel)]="form.clienteLabel" name="clienteLabelPanel" list="clientes-list" (input)="onClienteInput()" />
            </div>
            <div class="modal-field">
              <label>Técnico *</label>
              <input type="text" [(ngModel)]="form.usuarioLabel" name="usuarioLabelPanel" list="usuarios-list" (input)="onUsuarioInput()" />
            </div>
            <div class="modal-field">
              <label>Título *</label>
              <input type="text" [(ngModel)]="form.titulo" name="tituloPanel" required />
            </div>
            <div class="modal-field">
              <label>Estado</label>
              <select [(ngModel)]="form.estado" name="estadoPanel">
                <option value="Programada">Programada</option>
                <option value="Confirmada">Confirmada</option>
                <option value="Cancelada">Cancelada</option>
                <option value="Realizada">Realizada</option>
              </select>
            </div>
            <div class="modal-field">
              <label>Inicio *</label>
              <input type="datetime-local" [(ngModel)]="form.fechaInicio" name="fechaInicioPanel" required />
            </div>
            <div class="modal-field">
              <label>Fin *</label>
              <input type="datetime-local" [(ngModel)]="form.fechaFin" name="fechaFinPanel" required />
            </div>
            <div class="modal-field">
              <label>Enlace remoto</label>
              <input type="text" [(ngModel)]="form.enlaceRemoto" name="enlaceRemotoPanel" placeholder="https://meet.google.com/..." />
            </div>
            <div class="modal-field">
              <label>Recordatorio (min)</label>
              <input type="number" min="0" [(ngModel)]="form.recordatorioMin" name="recordatorioMinPanel" />
            </div>
            <div class="modal-field full">
              <label>Notas</label>
              <textarea rows="1" [(ngModel)]="form.notas" name="notasPanel"></textarea>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" (click)="cerrarPanel()">Cerrar</button>
            <button type="button" class="btn-primary" (click)="guardar()">Guardar cambios</button>
            <button type="button" class="btn-danger" (click)="eliminar()">Eliminar</button>
          </div>
        </div>
      </aside>
    </div>
    </div>

    <div class="modal-overlay" *ngIf="modalVisible" (click)="onOverlayClick($event)">
      <div class="modal-bubble" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ editando ? 'Editar cita' : 'Nueva cita' }}</h2>
          <button type="button" class="close-btn" (click)="cerrarModal()">✕</button>
        </div>
        <form (ngSubmit)="guardar()">
          <div class="modal-grid">
            <div class="modal-field">
              <label>Cliente *</label>
              <input type="text" [(ngModel)]="form.clienteLabel" name="clienteLabel" list="clientes-list" (input)="onClienteInput()" />
              <datalist id="clientes-list">
                <option *ngFor="let c of clientesOptions" [value]="c.label"></option>
              </datalist>
            </div>
            <div class="modal-field">
              <label>Técnico *</label>
              <input type="text" [(ngModel)]="form.usuarioLabel" name="usuarioLabel" list="usuarios-list" (input)="onUsuarioInput()" />
              <datalist id="usuarios-list">
                <option *ngFor="let u of usuariosOptions" [value]="u.label"></option>
              </datalist>
            </div>
            <div class="modal-field">
              <label>Título *</label>
              <input type="text" [(ngModel)]="form.titulo" name="titulo" required />
            </div>
            <div class="modal-field">
              <label>Estado</label>
              <select [(ngModel)]="form.estado" name="estado">
                <option value="Programada">Programada</option>
                <option value="Confirmada">Confirmada</option>
                <option value="Cancelada">Cancelada</option>
                <option value="Realizada">Realizada</option>
              </select>
            </div>
            <div class="modal-field">
              <label>Inicio *</label>
              <input type="datetime-local" [(ngModel)]="form.fechaInicio" name="fechaInicio" required />
            </div>
            <div class="modal-field">
              <label>Fin *</label>
              <input type="datetime-local" [(ngModel)]="form.fechaFin" name="fechaFin" required />
            </div>
            <div class="modal-field">
              <label>Enlace remoto</label>
              <input type="text" [(ngModel)]="form.enlaceRemoto" name="enlaceRemoto" placeholder="https://meet.google.com/..." />
            </div>
            <div class="modal-field">
              <label>Recordatorio (min)</label>
              <input type="number" min="0" [(ngModel)]="form.recordatorioMin" name="recordatorioMin" />
            </div>
            <div class="modal-field full">
              <label>Notas</label>
              <textarea rows="3" [(ngModel)]="form.notas" name="notas"></textarea>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" (click)="cerrarModal()">Cancelar</button>
            <button type="submit" class="btn-primary">{{ editando ? 'Guardar cambios' : 'Crear cita' }}</button>
            <button *ngIf="editando" type="button" class="btn-danger" (click)="eliminar()">Eliminar</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .citas-page {
      display: flex;
      flex-direction: column;
      gap: 10px;
      height: 100vh;
      overflow: hidden;
    }
    .citas-page.compact {
      gap: 6px;
    }
    .header-bar {
      display: none;
    }
    .citas-page.compact .header-bar { margin-bottom: 2px; }
    .header-actions { display: flex; gap: 12px; align-items: center; }
    .search-input {
      padding: 0.65rem 0.85rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      min-width: 260px;
      font-family: inherit;
    }
    .subtitle {
      margin: 4px 0 0;
      color: #64748b;
      font-size: 0.9rem;
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 8px;
    }
    .citas-page.compact .filter-bar { margin-bottom: 4px; }
    .stat-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .stat-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #94a3b8;
      font-weight: 700;
    }
    .stat-value {
      font-size: 1.2rem;
      font-weight: 800;
      color: #0f172a;
    }
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      flex-wrap: wrap;
    }
    .filter-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .filter-chip {
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #1e293b;
      padding: 6px 12px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.75rem;
      cursor: pointer;
    }
    .filter-chip.active {
      background: #1e293b;
      color: #f8fafc;
      border-color: #1e293b;
    }
    .legend {
      margin-left: auto;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .legend-item {
      font-size: 0.7rem;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 999px;
      border: 1px solid transparent;
    }
    .legend-item.programada { background: #e0f2fe; color: #0c4a6e; border-color: #bae6fd; }
    .legend-item.confirmada { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
    .legend-item.cancelada { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
    .legend-item.realizada { background: #e2e8f0; color: #0f172a; border-color: #cbd5e1; }
    :host {
      display: block;
      overflow-x: hidden;
    }
    .calendar-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
      width: 100%;
      max-width: 100%;
      flex: 1;
      min-height: 0;
    }
    .calendar-layout.with-panel {
      grid-template-columns: minmax(0, 1fr) 360px;
    }
    .calendar-wrap {
      background: white;
      padding: 12px;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
      min-width: 0;
      overflow: hidden;
      height: 100%;
    }
    .citas-page.compact .calendar-wrap { padding: 10px; }
    .detail-panel {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 12px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
      min-height: 0;
      height: 100%;
      overflow: hidden;
      min-width: 360px;
    }
    .panel-body {
      overflow: hidden;
      padding-right: 2px;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .panel-header h3 { margin: 0; color: #0f172a; }
    .panel-header p { margin: 4px 0 0; color: #64748b; font-size: 0.85rem; }
    .modal-bubble { text-align: left; overflow: hidden; }
    .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .modal-field.full { grid-column: span 2; }
    .modal-field { display: flex; flex-direction: column; gap: 0.25rem; }
    .modal-field input, .modal-field select, .modal-field textarea {
      padding: 0.5rem; border-radius: 10px; border: 1px solid #e2e8f0; font-family: inherit;
      font-size: 0.85rem;
    }
    .modal-actions {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      align-items: center;
      margin-top: 12px;
    }
    .modal-actions button {
      min-height: 38px;
      font-size: 0.8rem;
      padding: 0.5rem 0.7rem;
    }
    .btn-danger { background: #ef4444; color: white; border: none; padding: 0.75rem 1.2rem; border-radius: 10px; }
    :host ::ng-deep .fc {
      font-family: inherit;
      height: 100%;
    }
    :host ::ng-deep .fc .fc-view-harness {
      height: 100% !important;
    }
    :host ::ng-deep .fc .fc-toolbar-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0f172a;
    }
    :host ::ng-deep .fc .fc-button {
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      background: #fff;
      color: #0f172a;
      font-weight: 700;
      padding: 6px 12px;
    }
    :host ::ng-deep .fc .fc-button-primary:not(:disabled).fc-button-active {
      background: #1e293b;
      border-color: #1e293b;
    }
    :host ::ng-deep .fc .fc-daygrid-day.fc-day-today {
      background: #f8fafc;
    }
    :host ::ng-deep .fc-event {
      border-radius: 8px;
      border: none;
      padding: 2px 6px;
      font-weight: 700;
    }
    :host ::ng-deep .evt-programada { background: #38bdf8; color: #0f172a; }
    :host ::ng-deep .evt-confirmada { background: #22c55e; color: #052e16; }
    :host ::ng-deep .evt-cancelada { background: #ef4444; color: #fff; }
    :host ::ng-deep .evt-realizada { background: #94a3b8; color: #0f172a; }
  `]
})
export class AgendarCitasComponent implements OnInit {
  calendarOptions: CalendarOptions;
  modalVisible = false;
  editando = false;
  citaId: number | null = null;
  estadoFiltro: 'Todas' | 'Programada' | 'Confirmada' | 'Cancelada' | 'Realizada' = 'Todas';
  stats = { total: 0, programadas: 0, confirmadas: 0, canceladas: 0, realizadas: 0 };
  citasCache: Cita[] = [];
  busqueda = '';
  panelVisible = false;

  clientesOptions: { id: number; label: string }[] = [];
  usuariosOptions: { id: number; label: string }[] = [];

  form: any = {
    clienteId: null,
    usuarioId: null,
    clienteLabel: '',
    usuarioLabel: '',
    titulo: '',
    estado: 'Programada',
    enlaceRemoto: '',
    notas: '',
    fechaInicio: '',
    fechaFin: '',
    recordatorioMin: 15,
  };

  constructor(
    private citas: CitaService,
    private clientes: ClienteService,
    private usuarios: UsuarioService,
  ) {
    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      locale: esLocale,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      selectable: true,
      select: (arg: DateSelectArg) => this.onSelect(arg),
      eventClick: (arg: EventClickArg) => this.onEventClick(arg),
      editable: true,
      eventDrop: (arg: any) => this.onMoveEvent(arg),
      eventResize: (arg: any) => this.onMoveEvent(arg),
      eventClassNames: (arg: any) => {
        const estado = ((arg.event.extendedProps as any)?.['estado'] ?? 'Programada').toString().toLowerCase();
        if (estado === 'confirmada') return ['evt-confirmada'];
        if (estado === 'cancelada') return ['evt-cancelada'];
        if (estado === 'realizada') return ['evt-realizada'];
        return ['evt-programada'];
      },
      eventDidMount: (arg: any) => {
        const usuarioId = (arg.event.extendedProps as any)?.['usuarioId'];
        const color = this.getColorByUsuario(usuarioId);
        if (color) {
          arg.el.style.borderLeft = `4px solid ${color}`;
        }
      },
      eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
      events: (info: any, success: any) => {
        const from = info.startStr;
        const to = info.endStr;
        this.citas.listByRange(from, to).subscribe({
          next: (list) => {
            const raw = list || [];
            this.citasCache = raw;
            this.actualizarStats(raw);
            const filtered = this.aplicarFiltros(raw);
            success((filtered || []).map(c => ({
              id: String(c.idCita),
              title: c.titulo,
              start: c.fechaInicio,
              end: c.fechaFin,
              extendedProps: c,
            })));
          },
          error: () => success([]),
        });
      }
    };
  }

  ngOnInit(): void {
    this.clientes.getAll().subscribe((list: any[]) => {
      this.clientesOptions = (list || []).map((c: any) => ({
        id: c.idCliente!,
        label: `${c.nombre} ${c.apellido1}${c.apellido2 ? ' ' + c.apellido2 : ''}`.trim()
      }));
    });
    this.usuarios.getAll().subscribe((list: any[]) => {
      this.usuariosOptions = (list || []).map((u: any) => ({
        id: u.idUsuario!,
        label: u.nombreUsuario
      }));
    });
  }

  abrirNuevo(): void {
    this.resetForm();
    this.modalVisible = true;
  }

  setFiltro(estado: 'Todas' | 'Programada' | 'Confirmada' | 'Cancelada' | 'Realizada') {
    this.estadoFiltro = estado;
    this.calendarOptions = { ...this.calendarOptions };
  }

  onSelect(arg: DateSelectArg): void {
    this.resetForm();
    this.form.fechaInicio = this.toLocalInput(arg.start);
    this.form.fechaFin = this.toLocalInput(arg.end);
    this.modalVisible = true;
  }

  onEventClick(arg: EventClickArg): void {
    const cita: Cita = arg.event.extendedProps as any;
    this.editando = true;
    this.citaId = cita.idCita || null;
    this.form = {
      ...this.form,
      clienteId: cita.clienteId,
      usuarioId: cita.usuarioId,
      clienteLabel: this.getClienteLabel(cita.clienteId),
      usuarioLabel: this.getUsuarioLabel(cita.usuarioId),
      titulo: cita.titulo,
      estado: cita.estado || 'Programada',
      enlaceRemoto: cita.enlaceRemoto || '',
      notas: cita.notas || '',
      fechaInicio: this.toLocalInput(new Date(cita.fechaInicio)),
      fechaFin: this.toLocalInput(new Date(cita.fechaFin)),
      recordatorioMin: cita.recordatorioMin ?? 15,
    };
    this.panelVisible = true;
  }

  onOverlayClick(e: Event) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.cerrarModal();
    }
  }

  cerrarModal(): void {
    this.modalVisible = false;
  }

  cerrarPanel(): void {
    this.panelVisible = false;
  }

  onClienteInput() {
    const label = String(this.form.clienteLabel || '').trim();
    const match = this.clientesOptions.find(c => c.label === label);
    this.form.clienteId = match?.id ?? null;
  }

  onUsuarioInput() {
    const label = String(this.form.usuarioLabel || '').trim();
    const match = this.usuariosOptions.find(u => u.label === label);
    this.form.usuarioId = match?.id ?? null;
  }

  guardar(): void {
    if (!this.form.clienteId || !this.form.usuarioId || !this.form.titulo || !this.form.fechaInicio || !this.form.fechaFin) {
      Swal.fire('Datos incompletos', 'Completa cliente, técnico, título y fechas.', 'warning');
      return;
    }
    const payload: Cita = {
      clienteId: this.form.clienteId,
      usuarioId: this.form.usuarioId,
      titulo: this.form.titulo,
      estado: this.form.estado,
      enlaceRemoto: this.form.enlaceRemoto || undefined,
      notas: this.form.notas || undefined,
      fechaInicio: this.fromLocalInput(this.form.fechaInicio),
      fechaFin: this.fromLocalInput(this.form.fechaFin),
      recordatorioMin: this.form.recordatorioMin,
    };
    const req = this.editando && this.citaId
      ? this.citas.update(this.citaId, { ...payload, idCita: this.citaId })
      : this.citas.create(payload);

    req.subscribe({
      next: () => {
        Swal.fire('Guardado', 'La cita se ha guardado correctamente.', 'success');
        this.modalVisible = false;
        this.panelVisible = false;
        this.refreshCalendar();
      },
      error: (err) => {
        Swal.fire('Error', err?.error || 'No se pudo guardar la cita.', 'error');
      }
    });
  }

  eliminar(): void {
    if (!this.citaId) return;
    this.citas.delete(this.citaId).subscribe({
      next: () => {
        Swal.fire('Eliminado', 'Cita eliminada.', 'success');
        this.modalVisible = false;
        this.panelVisible = false;
        this.refreshCalendar();
      },
      error: () => {
        Swal.fire('Error', 'No se pudo eliminar la cita.', 'error');
      }
    });
  }

  private resetForm() {
    this.editando = false;
    this.citaId = null;
    this.panelVisible = false;
    this.form = {
      clienteId: null,
      usuarioId: null,
      clienteLabel: '',
      usuarioLabel: '',
      titulo: '',
      estado: 'Programada',
      enlaceRemoto: '',
      notas: '',
      fechaInicio: '',
      fechaFin: '',
      recordatorioMin: 15,
    };
  }

  private toLocalInput(date: Date) {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  private fromLocalInput(value: string) {
    return new Date(value).toISOString();
  }

  private getClienteLabel(id?: number) {
    const match = this.clientesOptions.find(c => c.id === id);
    return match?.label || '';
  }

  private getUsuarioLabel(id?: number) {
    const match = this.usuariosOptions.find(u => u.id === id);
    return match?.label || '';
  }

  private actualizarStats(list: Cita[]) {
    const count = (estado: string) => list.filter(c => (c.estado || 'Programada') === estado).length;
    this.stats = {
      total: list.length,
      programadas: count('Programada'),
      confirmadas: count('Confirmada'),
      canceladas: count('Cancelada'),
      realizadas: count('Realizada'),
    };
  }

  private aplicarFiltros(list: Cita[]) {
    const byEstado = this.estadoFiltro === 'Todas'
      ? list
      : list.filter(c => (c.estado || 'Programada') === this.estadoFiltro);
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return byEstado;
    return byEstado.filter(c => {
      const cliente = this.getClienteLabel(c.clienteId).toLowerCase();
      const usuario = this.getUsuarioLabel(c.usuarioId).toLowerCase();
      const titulo = (c.titulo || '').toLowerCase();
      return cliente.includes(q) || usuario.includes(q) || titulo.includes(q);
    });
  }

  refreshCalendar() {
    this.calendarOptions = { ...this.calendarOptions };
  }

  private getColorByUsuario(usuarioId?: number) {
    if (!usuarioId) return '#94a3b8';
    const palette = ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#eab308', '#ef4444', '#14b8a6'];
    return palette[usuarioId % palette.length];
  }

  private onMoveEvent(arg: any) {
    const cita: Cita = arg.event.extendedProps as any;
    if (!cita?.idCita || !arg.event.start || !arg.event.end) return;
    const payload: Cita = {
      clienteId: cita.clienteId,
      usuarioId: cita.usuarioId,
      titulo: cita.titulo,
      estado: cita.estado || 'Programada',
      enlaceRemoto: cita.enlaceRemoto,
      notas: cita.notas,
      fechaInicio: arg.event.start.toISOString(),
      fechaFin: arg.event.end.toISOString(),
      recordatorioMin: cita.recordatorioMin ?? 15,
    };
    this.citas.update(cita.idCita, { ...payload, idCita: cita.idCita }).subscribe({
      next: () => {
        this.refreshCalendar();
      },
      error: (err) => {
        arg.revert();
        Swal.fire('Error', err?.error || 'No se pudo reprogramar la cita.', 'error');
      }
    });
  }
}
