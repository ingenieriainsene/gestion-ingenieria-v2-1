import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  TramiteService,
  SeguimientoService,
  ContratoService,
  TramiteDetalleResponse,
  Seguimiento,
} from '../../services/domain.services';
import { UsuarioService as UsuarioApi, Usuario } from '../../services/usuario.service';
import { ProveedorService, ProveedorDTO } from '../../services/proveedor.service';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';

interface ArchivoTramite {
  idArchivoT?: number;
  nombreVisible: string;
  nombreFisico: string;
  tipoArchivo?: string;
  fechaSubida?: string;
}

@Component({
  selector: 'app-tramite-detalle',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './tramite-detalle.component.html',
  styleUrls: ['./tramite-detalle.component.css'],
})
export class TramiteDetalleComponent implements OnInit {
  detalle: TramiteDetalleResponse | null = null;
  hitos: Seguimiento[] = [];
  tecnicos: Usuario[] = [];
  proveedores: { id: number; nombre: string }[] = [];
  archivos: ArchivoTramite[] = [];
  showNuevoHito = false;
  idTramite: number | null = null;
  loading = true;

  formInfo: FormGroup;
  formHito: FormGroup;
  filesToUpload: File[] = [];
  nombreVisibleUpload = '';
  private archivosBaseUrl = 'http://localhost:8081/api/archivos';

  constructor(
    private tramiteService: TramiteService,
    private seguimientoService: SeguimientoService,
    private contratoService: ContratoService,
    private usuarioService: UsuarioApi,
    private proveedorService: ProveedorService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.formInfo = this.fb.group({
      estado: ['Pendiente', Validators.required],
      esUrgente: [false],
      detalleSeguimiento: [''],
      fechaSeguimiento: [''],
      observacionesContrato: [''],
      // Checkboxes información general (legacy detalle_tramite.php)
      cePrevio: [false],
      cePost: [false],
      mtd: [false],
      planos: [false],
      enviadoCeePost: [false],
      licenciaObras: [false],
      subvencionEstado: [false],
      libroEdifIncluido: [false],
    });
    this.formHito = this.fb.group({
      comentario: ['', Validators.required],
      fechaSeguimiento: [''],
      estado: ['Pendiente'],
      esUrgente: [false],
      idUsuarioAsignado: [null as number | null],
      idProveedor: [null as number | null],
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!id || isNaN(id)) {
        this.loading = false;
        return;
      }
      this.idTramite = id;
      this.cargarDetalle();
      this.cargarHitos();
      this.cargarTecnicos();
      this.cargarProveedores();
      this.cargarArchivos();
    });
  }

  cargarDetalle() {
    if (!this.idTramite) return;
    this.loading = true;
    this.tramiteService.getDetalle(this.idTramite).subscribe({
      next: (d) => {
        this.detalle = d;
        this.loading = false;
        let fStr = '';
        const fs = d.fechaSeguimiento;
        if (typeof fs === 'string') fStr = fs.slice(0, 10);
        this.formInfo.patchValue({
          estado: d.estado || 'Pendiente',
          esUrgente: !!d.esUrgente,
          detalleSeguimiento: d.detalleSeguimiento || '',
          fechaSeguimiento: fStr || '',
          observacionesContrato: d.observacionesContrato || '',
          cePrevio: d.cePrevio === 'Realizado',
          cePost: d.cePost === 'Realizado',
          mtd: !!d.mtd,
          planos: !!d.planos,
          enviadoCeePost: !!d.enviadoCeePost,
          licenciaObras: d.licenciaObras === 'Concedida',
          subvencionEstado: d.subvencionEstado === 'Concedida',
          libroEdifIncluido: !!d.libroEdifIncluido,
        });
      },
      error: (err) => {
        this.loading = false;
        const status = err?.status;
        const url = err?.url ?? `GET /api/tramites/${this.idTramite}/detalle`;
        const body = err?.error && typeof err.error === 'object' ? err.error : {};
        const msg = body['message'] ?? body['error'] ?? (typeof err?.error === 'string' ? err.error : null) ?? err?.message;
        console.error('[TramiteDetalle] Error al cargar detalle:', { status, url, id: this.idTramite, message: msg, error: err });
        let userMsg: string;
        if (status === 404) {
          userMsg = (typeof msg === 'string' && msg) ? msg : 'Trámite no encontrado o ya no existe. Comprueba que el enlace sea correcto.';
        } else if (status === 500) {
          userMsg = 'Error del servidor al obtener el detalle. Revisa la consola del navegador (F12) para más información.';
        } else if (status >= 400 && status < 500) {
          userMsg = typeof msg === 'string' ? msg : 'Solicitud incorrecta. Ver consola para detalles.';
        } else {
          userMsg = 'No se pudo cargar el detalle del trámite. Comprueba la conexión y que el backend esté en marcha (puerto 8081).';
        }
        Swal.fire('Error', userMsg, 'error');
      },
    });
  }

  cargarHitos() {
    if (!this.idTramite) return;
    this.seguimientoService.getByTramite(this.idTramite).subscribe({
      next: (list) => (this.hitos = list || []),
      error: () => {},
    });
  }

  cargarTecnicos() {
    this.usuarioService.getTecnicos().subscribe({
      next: (list) => (this.tecnicos = list || []),
      error: () => {},
    });
  }

  cargarProveedores() {
    this.proveedorService.getAll().subscribe({
      next: (list: ProveedorDTO[] | any[]) => {
        const raw = Array.isArray(list) ? list : [];
        this.proveedores = raw
          .map((p: any) => ({
            id: p.idProveedor ?? p.id,
            nombre: p.nombreComercial ?? p.razonSocial ?? 'Proveedor',
          }))
          .filter((p: any) => typeof p.id === 'number');
      },
      error: () => {},
    });
  }

  cargarArchivos() {
    if (!this.idTramite) return;
    this.http.get<ArchivoTramite[]>(`${this.archivosBaseUrl}/tramite/${this.idTramite}`).subscribe({
      next: (list) => (this.archivos = list || []),
      error: () => {},
    });
  }

  guardarInfo() {
    if (!this.detalle || !this.idTramite) return;
    const v = this.formInfo.value;
    const tramitePayload = {
      estado: v.estado,
      esUrgente: v.esUrgente,
      detalleSeguimiento: v.detalleSeguimiento || null,
      fechaSeguimiento: v.fechaSeguimiento || null,
    };
    this.tramiteService.update(this.idTramite, tramitePayload).subscribe({
      next: () => {
        const idCon = this.detalle?.idContrato;
        if (idCon) {
          this.contratoService.getById(idCon).subscribe((c) => {
            const body: Record<string, unknown> = {
              idCliente: c.idCliente ?? c.cliente?.idCliente,
              idLocal: c.idLocal ?? c.local?.idLocal,
              fechaInicio: c.fechaInicio,
              fechaVencimiento: c.fechaVencimiento,
              tipoContrato: c.tipoContrato,
              cePrevio: v.cePrevio ? 'Realizado' : 'Pendiente',
              cePost: v.cePost ? 'Realizado' : 'Pendiente',
              enviadoCeePost: !!v.enviadoCeePost,
              licenciaObras: v.licenciaObras ? 'Concedida' : 'No requerida',
              mtd: !!v.mtd,
              planos: !!v.planos,
              subvencionEstado: v.subvencionEstado ? 'Concedida' : 'No solicitada',
              libroEdifIncluido: !!v.libroEdifIncluido,
              observaciones: v.observacionesContrato ?? c.observaciones,
            };
            this.contratoService.update(idCon, body).subscribe({
              next: () => { this.finGuardarInfo(); },
              error: (e) => Swal.fire('Error', e?.error?.message || 'Error al guardar datos del contrato.', 'error'),
            });
          });
        } else {
          this.finGuardarInfo();
        }
      },
      error: (e) =>
        Swal.fire('Error', e?.error?.message || 'No se pudieron guardar los cambios.', 'error'),
    });
  }

  private finGuardarInfo() {
    this.cargarDetalle();
    Swal.fire('Guardado', 'Datos técnicos y observaciones guardados correctamente.', 'success');
  }

  toggleNuevoHito() {
    this.showNuevoHito = !this.showNuevoHito;
    if (this.showNuevoHito) {
      const hoy = new Date().toISOString().slice(0, 10);
      this.formHito.patchValue({
        comentario: '',
        fechaSeguimiento: hoy,
        estado: 'Pendiente',
        esUrgente: false,
        idUsuarioAsignado: this.tecnicos[0]?.idUsuario ?? null,
        idProveedor: null,
      });
    }
  }

  guardarHito() {
    if (this.formHito.invalid || !this.idTramite) return;
    const v = this.formHito.value;
    const payload: Seguimiento = {
      idTramite: this.idTramite,
      comentario: v.comentario,
      fechaSeguimiento: v.fechaSeguimiento || new Date().toISOString().slice(0, 10),
      estado: v.estado || 'Pendiente',
      esUrgente: !!v.esUrgente,
      idUsuarioAsignado: v.idUsuarioAsignado ?? undefined,
      idProveedor: v.idProveedor ?? undefined,
    };
    this.seguimientoService.create(payload).subscribe({
      next: () => {
        this.cargarHitos();
        this.formHito.reset({ estado: 'Pendiente' });
        this.showNuevoHito = false;
        Swal.fire('Registrado', 'Hito de seguimiento añadido correctamente.', 'success');
      },
      error: (e) => {
        const msg = (e?.error && (e.error['message'] ?? e.error['error'])) || 'No se pudo guardar el hito.';
        Swal.fire('Error', msg, 'error');
      },
    });
  }

  eliminarHito(s: Seguimiento, idx: number) {
    if (!s.idSeguimiento) return;
    Swal.fire({
      title: '¿Borrar hito?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e293b',
      cancelButtonText: 'Cancelar',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.seguimientoService.delete(s.idSeguimiento!).subscribe({
        next: () => {
          this.hitos.splice(idx, 1);
          Swal.fire('Eliminado', 'Hito borrado correctamente.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo eliminar el hito.', 'error'),
      });
    });
  }

  onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.filesToUpload = input.files ? Array.from(input.files) : [];
  }

  subirArchivos() {
    if (!this.idTramite || !this.filesToUpload.length) {
      Swal.fire('Aviso', 'Selecciona al menos un archivo.', 'warning');
      return;
    }
    const base = 'http://localhost:8081/api/archivos';
    const reqs = this.filesToUpload.map((f) => {
      const fd = new FormData();
      fd.append('file', f);
      return this.http.post<ArchivoTramite>(`${base}/tramite/${this.idTramite}`, fd);
    });
    Promise.all(reqs.map((r) => r.toPromise()))
      .then((results) => {
        this.archivos = [...(results as ArchivoTramite[]).filter(Boolean), ...this.archivos];
        this.filesToUpload = [];
        this.nombreVisibleUpload = '';
        Swal.fire('Subido', 'Archivos subidos correctamente.', 'success');
        this.cargarArchivos();
      })
      .catch(() => Swal.fire('Error', 'No se pudieron subir los archivos.', 'error'));
  }

  volverAlContrato() {
    if (this.detalle?.idContrato) {
      this.router.navigate(['/contratos', this.detalle.idContrato]);
    } else {
      this.router.navigate(['/contratos']);
    }
  }

  getIconoArchivo(f: ArchivoTramite): string {
    const n = (f.nombreVisible || f.nombreFisico || '').toLowerCase();
    const ext = n.split('.').pop() || '';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '🖼️';
    if (ext === 'pdf') return '📄';
    return '📁';
  }
}
