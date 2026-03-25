import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  TramiteService,
  SeguimientoService,
  ContratoService,
  TramiteDetalleResponse,
  Seguimiento,
  VentaDocumentoDTO,
  VentaDocumentoCreateRequest,
  LegalizacionBTService,
  LegalizacionBT,
  CieRequest
} from '../../services/domain.services';
import { PresupuestoService, PresupuestoListItem } from '../../services/presupuesto.service';
import { AlbaranVentaService, AlbaranVentaDTO } from '../../services/albaran-venta.service';
import { DocumentosService } from '../../services/documentos.service';
import { ComprasService, CompraDocumentoDTO, CompraDocumentoCreateRequest } from '../../services/compras.service';
import { UsuarioService as UsuarioApi, Usuario } from '../../services/usuario.service';
import { TecnicoInstaladorService, TecnicoInstalador } from '../../services/tecnico-instalador.service';
import { ProveedorService, ProveedorDTO } from '../../services/proveedor.service';
import { HttpClient } from '@angular/common/http';
import { AuditStampComponent } from '../../layout/audit-stamp.component';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environments';
import { VentaDocumentosService } from '../../services/venta-documentos.service';

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
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, AuditStampComponent],
  templateUrl: './tramite-detalle.component.html',
  styleUrls: ['./tramite-detalle.component.css'],
})
export class TramiteDetalleComponent implements OnInit {
  detalle: TramiteDetalleResponse | null = null;
  hitos: Seguimiento[] = [];
  tecnicos: Usuario[] = [];
  instaladores: TecnicoInstalador[] = [];
  proveedores: { id: number; nombre: string }[] = [];
  archivos: ArchivoTramite[] = [];
  showNuevoHito = false;
  idTramite: number | null = null;
  loading = true;
  activeTab = 'general';
  private hasAskedFacturado = false;
  presupuestos: PresupuestoListItem[] = [];
  albaranesVenta: AlbaranVentaDTO[] = [];
  cargandoAlbaranes = false;
  descargandoDocs: Record<string, boolean> = {};
  documentosCompra: CompraDocumentoDTO[] = [];
  cargandoCompras = false;
  eliminandoDocsCompra: Record<string, boolean> = {};
  activeComprasTab: 'ALBARAN' | 'FACTURA' = 'ALBARAN';
  showCompraForm = false;

  documentosVenta: VentaDocumentoDTO[] = [];
  cargandoVentas = false;
  activeVentasTab: 'ALBARAN' | 'FACTURA' = 'ALBARAN';
  showVentaForm = false;
  formVenta: FormGroup;

  // Refactor Legalización BT
  legalizacionBT: LegalizacionBT | null = null;
  showLegalizacionForm = false;
  cie: CieRequest = this.getEmptyCie();

  showModalVincularP = false;
  presupuestosCandidatos: PresupuestoListItem[] = [];
  cargandoCandidatos = false;

  // Provider Modal
  modalProveedorVisible = false;
  proveedorQuery = '';
  proveedoresCompletos: any[] = [];
  proveedoresFiltrados: any[] = [];

  formInfo: FormGroup;
  formHito: FormGroup;
  formCompra: FormGroup;
  filesToUpload: File[] = [];
  nombreVisibleUpload = '';
  private archivosBaseUrl = `${environment.apiUrl}/archivos`;
  private isPatchingForm = false;

  constructor(
    private tramiteService: TramiteService,
    private seguimientoService: SeguimientoService,
    private contratoService: ContratoService,
    private usuarioService: UsuarioApi,
    private proveedorService: ProveedorService,
    private presupuestoService: PresupuestoService,
    private albaranVentaService: AlbaranVentaService,
    private documentosService: DocumentosService,
    private comprasService: ComprasService,
    private ventaDocumentosService: VentaDocumentosService,
    private tecnicoInstaladorService: TecnicoInstaladorService,
    private legalizacionBTService: LegalizacionBTService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.formInfo = this.fb.group({
      estado: ['Pendiente', Validators.required],
      esUrgente: [false],
      facturado: [false],
      descripcion: [''],
      fechaSeguimiento: [''],
    });
    this.formHito = this.fb.group({
      comentario: ['', Validators.required],
      fechaSeguimiento: [''],
      estado: ['Pendiente'],
      esUrgente: [false],
      idsUsuariosAsignados: [[] as number[]],
      idProveedor: [null as number | null],
      proveedorLabel: [''],
      idUsuarioAsignado: [null as number | null],
    });
    this.formCompra = this.fb.group({
      tipo: ['ALBARAN', Validators.required],
      idProveedor: [null, Validators.required],
      numeroDocumento: ['', Validators.required],
      fecha: [new Date().toISOString().slice(0, 10), Validators.required],
      importe: [0, [Validators.min(0)]],
      estado: ['Pendiente'],
      notas: [''],
      lineas: this.fb.array([])
    });
    this.formCompra.get('lineas')?.valueChanges.subscribe(() => this.recalcularTotalCompra());
    this.agregarLineaCompra();

    this.formVenta = this.fb.group({
      tipo: ['ALBARAN', Validators.required],
      numeroDocumento: ['', Validators.required],
      fecha: [new Date().toISOString().slice(0, 10), Validators.required],
      importe: [0, [Validators.required, Validators.min(0)]],
      notas: [''],
      presupuestoId: [null as number | null],
      lineas: this.fb.array([])
    });
    this.formVenta.get('lineas')?.valueChanges.subscribe(() => this.recalcularTotalVenta());
    this.agregarLineaVenta();
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
      this.cargarInstaladores();
      this.cargarProveedores();
      this.cargarArchivos();
      this.cargarPresupuestos();
      this.cargarAlbaranesVenta();
      this.cargarCompras();
      this.cargarVentas();
      this.cargarLegalizacion();
    });

    // Configurar autoguardado para Información y Estado
    this.formInfo.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    ).subscribe(() => {
      if (!this.isPatchingForm && this.formInfo.valid) {
        this.guardarInfo(true);
      }
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

        this.isPatchingForm = true;
        this.formInfo.patchValue({
          estado: d.estado || 'Pendiente',
          esUrgente: !!d.esUrgente,
          facturado: !!d.facturado,
          descripcion: d.descripcion || '',
          fechaSeguimiento: fStr || '',
        }, { emitEvent: false });
        this.isPatchingForm = false;
        // Si ya tenemos ventas cargadas, evaluamos posible marcado de facturación
        this.evaluarFacturacionIntervencion();
        this.preRellenarCie();
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
          userMsg = 'No se pudo cargar el detalle del trámite. Comprueba la conexión y que el backend esté en marcha.';
        }
        Swal.fire('Error', userMsg, 'error');
      },
    });
  }

  cargarHitos() {
    if (!this.idTramite) return;
    this.seguimientoService.getByTramite(this.idTramite).subscribe({
      next: (list) => {
        const data = list || [];
        if (!data.length) {
          this.crearHitoInicial();
        } else {
          this.hitos = data;
        }
      },
      error: () => { },
    });
  }

  cargarTecnicos() {
    this.usuarioService.getAll().subscribe({
      next: (list) => (this.tecnicos = list || []),
      error: () => { },
    });
  }

  cargarInstaladores() {
    this.tecnicoInstaladorService.getActivos().subscribe({
      next: (list: TecnicoInstalador[]) => (this.instaladores = list || []),
      error: () => { },
    });
  }

  cargarProveedores() {
    this.proveedorService.getAll().subscribe({
      next: (list: any[]) => {
        this.proveedoresCompletos = Array.isArray(list) ? list : [];
        this.proveedores = this.proveedoresCompletos
          .map((p: any) => ({
            id: p.idProveedor ?? p.id,
            nombre: p.nombreComercial ?? p.razonSocial ?? 'Proveedor',
          }))
          .filter((p: any) => typeof p.id === 'number');
        this.filtrarProveedores();
      },
      error: () => { },
    });
  }

  cargarArchivos() {
    if (!this.idTramite) return;
    this.http.get<ArchivoTramite[]>(`${this.archivosBaseUrl}/tramite/${this.idTramite}`).subscribe({
      next: (list) => (this.archivos = list || []),
      error: () => { },
    });
  }

  cargarPresupuestos() {
    if (!this.idTramite) return;
    this.presupuestoService.getByTramite(this.idTramite).subscribe({
      next: (list) => (this.presupuestos = list || []),
      error: () => { },
    });
  }

  cargarAlbaranesVenta() {
    if (!this.idTramite) return;
    this.cargandoAlbaranes = true;
    this.albaranVentaService.getByTramite(this.idTramite).subscribe({
      next: (list) => {
        this.albaranesVenta = list || [];
        this.cargandoAlbaranes = false;
      },
      error: () => {
        this.albaranesVenta = [];
        this.cargandoAlbaranes = false;
      }
    });
  }

  cargarCompras() {
    if (!this.idTramite) return;
    this.cargandoCompras = true;
    this.comprasService.getDocumentosByTramite(this.idTramite).subscribe({
      next: (list) => {
        this.documentosCompra = list || [];
        this.cargandoCompras = false;
      },
      error: () => {
        this.documentosCompra = [];
        this.cargandoCompras = false;
      }
    });
  }

  cargarVentas() {
    if (!this.idTramite) return;
    this.cargandoVentas = true;
    this.ventaDocumentosService.getByTramite(this.idTramite).subscribe({
      next: (list) => {
        this.documentosVenta = list || [];
        this.cargandoVentas = false;
        this.evaluarFacturacionIntervencion();
      },
      error: () => {
        this.documentosVenta = [];
        this.cargandoVentas = false;
      }
    });
  }

  private crearHitoInicial() {
    if (!this.idTramite) return;

    const hoyStr = new Date().toISOString().slice(0, 10);
    const payload: Seguimiento = {
      idTramite: this.idTramite,
      comentario: 'Iniciar Actividad',
      fechaSeguimiento: hoyStr,
      esUrgente: false,
      estado: 'Pendiente',
      idsTecnicosInstaladores: [],
      idsUsuariosAsignados: [],
    } as any;

    this.seguimientoService.create(payload).subscribe({
      next: (res) => {
        // Insertamos el nuevo hito al inicio para que se vea sin recargar
        this.hitos = [res, ...this.hitos];
      },
      error: () => {
        // Si falla, dejamos la lista como esté para no bloquear la pantalla
      }
    });
  }

  setComprasTab(tab: 'ALBARAN' | 'FACTURA') {
    this.activeComprasTab = tab;
    this.formCompra.patchValue({ tipo: tab });
  }

  toggleCompraForm() {
    this.showCompraForm = !this.showCompraForm;
  }

  crearAlbaranCompra() {
    if (!this.idTramite || this.formCompra.invalid) {
      this.formCompra.markAllAsTouched();
      return;
    }
    if (this.lineasCompra.length === 0) {
      Swal.fire('Aviso', 'Añade al menos una línea al albarán de compra.', 'warning');
      return;
    }
    const v = this.formCompra.value;
    const lineas = this.lineasCompra.value || [];
    const payload: CompraDocumentoCreateRequest = {
      tipo: this.activeComprasTab,
      idProveedor: Number(v.idProveedor),
      numeroDocumento: String(v.numeroDocumento).trim(),
      fecha: String(v.fecha),
      importe: undefined,
      estado: null,
      notas: v.notas ? String(v.notas).trim() : null,
      lineas
    };
    this.comprasService.crearDocumento(this.idTramite, payload).subscribe({
      next: () => {
        Swal.fire('Guardado', `${this.activeComprasTab === 'ALBARAN' ? 'Albarán' : 'Factura'} registrada correctamente.`, 'success');
        this.formCompra.patchValue({
          tipo: this.activeComprasTab,
          numeroDocumento: '',
          fecha: new Date().toISOString().slice(0, 10),
          importe: 0,
          estado: 'Pendiente',
          notas: ''
        });
        this.lineasCompra.clear();
        this.agregarLineaCompra();
        this.cargarCompras();
      },
      error: (e) => {
        let msg = 'No se pudo registrar el albarán.';
        if (typeof e?.error === 'string') msg = e.error;
        else if (e?.error?.message) msg = e.error.message;
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  generarFacturaDesdeAlbaran(doc: CompraDocumentoDTO) {
    if (!doc?.idDocumento || doc.tipo !== 'ALBARAN') return;
    Swal.fire({
      title: 'Generar factura',
      text: 'Se generará una única factura que agrupará todos los albaranes de este proveedor en este trámite.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Generar factura',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1e293b',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.comprasService.generarFacturaDesdeAlbaran(doc.idDocumento).subscribe({
        next: (factura) => {
          // Añadimos la factura a la colección y marcamos el albarán con su factura asociada
          this.documentosCompra.push(factura);
          if (factura && factura.idDocumento) {
            doc.facturaId = factura.idDocumento;
            doc.estado = 'Facturado';
          }
          Swal.fire('Generada', 'Factura generada correctamente a partir del albarán.', 'success');
          // Recargamos para asegurar que los datos quedan sincronizados con backend
          this.cargarCompras();
          this.setComprasTab('FACTURA');
        },
        error: (e) => {
          let msg = 'No se pudo generar la factura.';
          if (typeof e?.error === 'string') msg = e.error;
          else if (e?.error?.message) msg = e.error.message;
          Swal.fire('Error', msg, 'error');
        }
      });
    });
  }

  generarFacturaGlobalAlbaranes() {
    // Solo trabajamos con albaranes que aún no tienen factura asociada
    const albaranes = this.documentosCompra.filter(d => d.tipo === 'ALBARAN' && !d.facturaId);
    if (!albaranes.length) {
      Swal.fire('Aviso', 'Todos los albaranes ya están facturados para esta intervención.', 'info');
      return;
    }

    // Agrupar por proveedor
    const proveedoresMap = new Map<number, string>();
    for (const a of albaranes) {
      if (a.idProveedor != null) {
        proveedoresMap.set(a.idProveedor, a.proveedorNombre || `Proveedor #${a.idProveedor}`);
      }
    }

    const proveedores = Array.from(proveedoresMap.entries()).map(([id, nombre]) => ({ id, nombre }));

    if (!proveedores.length) {
      Swal.fire('Aviso', 'Los albaranes no tienen proveedor asociado correctamente.', 'warning');
      return;
    }

    const generarParaProveedor = (idProveedor: number) => {
      const albaranBase = albaranes.find(a => a.idProveedor === idProveedor);
      if (!albaranBase) {
        Swal.fire('Aviso', 'No se ha encontrado un albarán válido para el proveedor seleccionado.', 'warning');
        return;
      }

      Swal.fire({
        title: 'Generar factura agrupada',
        text: 'Se generará una única factura que agrupará todos los albaranes de este proveedor en este trámite.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Generar factura',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#1e293b',
      }).then((res) => {
        if (!res.isConfirmed) return;
        this.comprasService.generarFacturaDesdeAlbaran(albaranBase.idDocumento).subscribe({
          next: (factura) => {
            this.documentosCompra.push(factura);
            Swal.fire('Generada', 'Factura generada correctamente agrupando todos los albaranes del proveedor.', 'success');
            this.setComprasTab('FACTURA');
            this.cargarCompras();
          },
          error: (e) => {
            let msg = 'No se pudo generar la factura.';
            if (typeof e?.error === 'string') msg = e.error;
            else if (e?.error?.message) msg = e.error.message;
            Swal.fire('Error', msg, 'error');
          }
        });
      });
    };

    // Si solo hay un proveedor, no pedimos selección
    if (proveedores.length === 1) {
      generarParaProveedor(proveedores[0].id);
      return;
    }

    // Varios proveedores: preguntamos por cuál queremos facturar
    const inputOptions = proveedores.reduce((acc: Record<string, string>, p) => {
      acc[String(p.id)] = p.nombre;
      return acc;
    }, {});

    Swal.fire({
      title: 'Seleccionar proveedor',
      text: 'Elige el proveedor para generar la factura agrupando todos sus albaranes en este trámite.',
      input: 'select',
      inputOptions,
      inputPlaceholder: 'Selecciona proveedor',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) return 'Debes seleccionar un proveedor.';
        return null;
      }
    }).then((result) => {
      if (!result.isConfirmed) return;
      const idProveedor = Number(result.value);
      if (!idProveedor) return;
      generarParaProveedor(idProveedor);
    });
  }

  eliminarDocumentoCompra(doc: CompraDocumentoDTO, index: number) {
    if (!doc?.idDocumento || !doc?.tipo) return;
    const tipo = String(doc.tipo).toUpperCase() as 'ALBARAN' | 'FACTURA';
    const key = `${tipo}-${doc.idDocumento}`;
    if (this.eliminandoDocsCompra[key]) return;

    const etiqueta = tipo === 'FACTURA' ? 'factura' : 'albarán';
    Swal.fire({
      title: `¿Eliminar ${etiqueta}?`,
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1e293b',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.eliminandoDocsCompra[key] = true;
      this.comprasService.eliminarDocumento(tipo, doc.idDocumento).subscribe({
        next: () => {
          this.eliminandoDocsCompra[key] = false;
          // Eliminamos el documento de la colección completa,
          // usando idDocumento y tipo en lugar del índice filtrado.
          this.documentosCompra = this.documentosCompra.filter(d =>
            !(d.tipo === tipo && d.idDocumento === doc.idDocumento)
          );

          // Si borramos una FACTURA, los albaranes del mismo proveedor
          // deben volver a estado "Pendiente" y sin factura asociada.
          if (tipo === 'FACTURA' && doc.idProveedor != null) {
            this.documentosCompra.forEach(d => {
              if (d.tipo === 'ALBARAN' && d.idProveedor === doc.idProveedor) {
                d.facturaId = null;
                d.estado = 'Pendiente';
              }
            });
          }

          Swal.fire('Eliminado', `${etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1)} eliminado correctamente.`, 'success');
        },
        error: (e) => {
          this.eliminandoDocsCompra[key] = false;
          let msg = `No se pudo eliminar el ${etiqueta}.`;
          if (typeof e?.error === 'string') msg = e.error;
          else if (e?.error?.message) msg = e.error.message;
          Swal.fire('Error', msg, 'error');
        }
      });
    });
  }

  crearPresupuesto() {
    if (!this.idTramite) return;
    this.router.navigate(['/presupuestos/nuevo'], { queryParams: { tramiteId: this.idTramite } });
  }

  abrirModalVincularP() {
    if (!this.detalle?.idCliente) {
      Swal.fire('Error', 'No se puede vincular: falta el ID del cliente.', 'error');
      return;
    }
    this.showModalVincularP = true;
    this.cargandoCandidatos = true;
    this.presupuestoService.getByCliente(this.detalle.idCliente).subscribe({
      next: (list) => {
        // Filtrar los que ya están en este trámite para no repetirlos en la lista de selección
        const yaVinculados = new Set(this.presupuestos.map(p => p.idPresupuesto));
        this.presupuestosCandidatos = (list || []).filter(p => !yaVinculados.has(p.idPresupuesto));
        this.cargandoCandidatos = false;
      },
      error: () => {
        this.cargandoCandidatos = false;
        Swal.fire('Error', 'No se pudieron cargar los presupuestos del cliente.', 'error');
      }
    });
  }

  vincularPresupuesto(idPresupuesto: number) {
    if (!this.idTramite) return;
    Swal.fire({
      title: '¿Vincular presupuesto?',
      text: 'El presupuesto quedará asociado a esta intervención y a su contrato.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, vincular',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.presupuestoService.vincularTramite(idPresupuesto, this.idTramite!).subscribe({
          next: () => {
            Swal.fire('Vinculado', 'Presupuesto vinculado correctamente.', 'success');
            this.showModalVincularP = false;
            this.cargarPresupuestos();
            this.cargarAlbaranesVenta(); // Por si el presupuesto ya tenía albaranes
          },
          error: (e) => {
            let msg = 'Hubo un error al vincular el presupuesto.';
            if (e?.error) msg = e.error;
            Swal.fire('Error', msg, 'error');
          }
        });
      }
    });
  }

  cerrarModalVincularP() {
    this.showModalVincularP = false;
  }

  descargarDocumento(tipo: 'albaran' | 'factura', p: PresupuestoListItem) {
    if (!p?.idPresupuesto) return;
    if (p.estado !== 'Aceptado') {
      Swal.fire('Aviso', 'Solo se pueden descargar documentos de presupuestos aceptados.', 'warning');
      return;
    }
    const key = `${tipo}-${p.idPresupuesto}`;
    if (this.descargandoDocs[key]) return;
    this.descargandoDocs[key] = true;

    const req = tipo === 'albaran'
      ? this.documentosService.descargarAlbaran(p.idPresupuesto)
      : this.documentosService.descargarFactura(p.idPresupuesto);

    req.subscribe({
      next: (blob) => {
        this.descargandoDocs[key] = false;
        const nombre = p.codigoReferencia ? p.codigoReferencia : `presupuesto_${p.idPresupuesto}`;
        const filename = `${tipo}_${nombre}.pdf`;
        void this.descargarBlob(blob, filename);
        this.cargarAlbaranesVenta();
      },
      error: (e) => {
        this.descargandoDocs[key] = false;
        let msg = 'No se pudo descargar el documento.';
        if (typeof e?.error === 'string') msg = e.error;
        else if (e?.error?.message) msg = e.error.message;
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  descargarAlbaranVenta(a: AlbaranVentaDTO) {
    if (!a?.idAlbaran) return;
    const key = `albaran-venta-${a.idAlbaran}`;
    if (this.descargandoDocs[key]) return;
    this.descargandoDocs[key] = true;
    this.documentosService.descargarAlbaranVenta(a.idAlbaran).subscribe({
      next: (blob) => {
        this.descargandoDocs[key] = false;
        const nombre = a.numeroAlbaran ? a.numeroAlbaran.replace(/[^\w\-]/g, '_') : `albaran_${a.idAlbaran}`;
        void this.descargarBlob(blob, `${nombre}.pdf`);
      },
      error: (e) => {
        this.descargandoDocs[key] = false;
        let msg = 'No se pudo descargar el albarán.';
        if (typeof e?.error === 'string') msg = e.error;
        else if (e?.error?.message) msg = e.error.message;
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  private async descargarBlob(blob: Blob, filename: string): Promise<void> {
    const w = window as any;
    const safeName = (filename || 'documento.pdf').trim();

    // En navegadores compatibles (Chrome/Edge), abre "Guardar como..."
    if (typeof w.showSaveFilePicker === 'function') {
      try {
        const handle = await w.showSaveFilePicker({
          suggestedName: safeName,
          types: [
            {
              description: 'Documento PDF',
              accept: { 'application/pdf': ['.pdf'] }
            }
          ]
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (err: any) {
        // Si el usuario cancela el diálogo, no forzamos descarga.
        if (err?.name === 'AbortError') {
          return;
        }
      }
    }

    // Fallback universal: descarga normal del navegador
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeName;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  setTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'ventas') {
      this.cargarVentas();
    }
    if (tab === 'compras') {
      this.cargarCompras();
    }
  }

  private recalcularMargen() {
    // Gastos, Ventas and Margen logic removed
  }

  get lineasCompra(): FormArray {
    return this.formCompra.get('lineas') as FormArray;
  }

  get lineasVenta(): FormArray {
    return this.formVenta.get('lineas') as FormArray;
  }

  get documentosCompraFiltrados(): CompraDocumentoDTO[] {
    return this.documentosCompra.filter(d => d.tipo === this.activeComprasTab);
  }

  get documentosVentaFiltrados(): VentaDocumentoDTO[] {
    return this.documentosVenta.filter(d => d.tipo === this.activeVentasTab);
  }

  getTituloAlbaran(a: CompraDocumentoDTO): string {
    const idParte = (a.numeroDocumento && a.numeroDocumento.trim()) || `ID${a.idDocumento}`;
    // En compras, el título principal debe ser solo el identificador/nº de albarán
    return `ALB-${idParte}`;
  }

  getTituloFactura(a: CompraDocumentoDTO): string {
    const idParte = (a.numeroDocumento && a.numeroDocumento.trim()) || `ID${a.idDocumento}`;
    // En compras, el título principal de factura debe ser solo el identificador/nº de factura
    return `FAC-${idParte}`;
  }

  getTituloVenta(doc: VentaDocumentoDTO): string {
    const pref = doc.tipo === 'ALBARAN' ? 'ALB' : 'FAC';
    const idParte = (doc.numeroDocumento && doc.numeroDocumento.trim()) || `ID${doc.idDocumento}`;
    // En ventas, el título debe ser solo el identificador/nº del documento
    return `${pref}-${idParte}`;
  }

  getFacturaVentaAsociada(albaran: VentaDocumentoDTO): VentaDocumentoDTO | null {
    if (!albaran || albaran.tipo !== 'ALBARAN') return null;

    // 1) Preferimos vinculación por presupuesto si existe
    if (albaran.presupuestoId != null) {
      const byPres = (this.documentosVenta as VentaDocumentoDTO[]).find((d: VentaDocumentoDTO) =>
        d.tipo === 'FACTURA' && d.presupuestoId === albaran.presupuestoId
      );
      if (byPres) return byPres;
    }

    // 2) Fallback: mismo trámite
    if (albaran.tramiteId != null) {
      const byTramite = this.documentosVenta.find(d =>
        d.tipo === 'FACTURA' && d.tramiteId === albaran.tramiteId
      );
      if (byTramite) return byTramite;
    }

    return null;
  }

  verFacturaVentaAsociada(albaran: VentaDocumentoDTO): void {
    const factura = this.getFacturaVentaAsociada(albaran);
    if (!factura) return;

    this.setVentasTab('FACTURA');
    // Delay para asegurar DOM renderizado
    setTimeout(() => {
      const el = document.getElementById(`venta-doc-FACTURA-${factura.idDocumento}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('flash-focus');
        setTimeout(() => el.classList.remove('flash-focus'), 1200);
      }
    }, 50);
  }

  getFacturaAsociada(albaran: CompraDocumentoDTO): CompraDocumentoDTO | null {
    if (!albaran || albaran.tipo !== 'ALBARAN') return null;
    if (albaran.facturaId != null) {
      const byId = this.documentosCompra.find(d => d.tipo === 'FACTURA' && d.idDocumento === albaran.facturaId);
      if (byId) return byId;
    }
    // Fallback profesional: misma intervención + mismo proveedor
    if (albaran.idProveedor != null) {
      const byProveedor = this.documentosCompra.find(d => d.tipo === 'FACTURA' && d.idProveedor === albaran.idProveedor);
      if (byProveedor) return byProveedor;
    }
    return null;
  }

  verFacturaAsociada(albaran: CompraDocumentoDTO): void {
    const factura = this.getFacturaAsociada(albaran);
    if (!factura) return;
    this.setComprasTab('FACTURA');
    // Pequeño delay para asegurar que el DOM de la pestaña está renderizado
    setTimeout(() => {
      const el = document.getElementById(`compra-doc-FACTURA-${factura.idDocumento}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('flash-focus');
        setTimeout(() => el.classList.remove('flash-focus'), 1200);
      }
    }, 50);
  }

  agregarLineaCompra() {
    const linea = this.fb.group({
      concepto: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
      precioUnitario: [0, [Validators.required, Validators.min(0)]],
      ivaPorcentaje: [21, [Validators.required, Validators.min(0)]],
      totalLinea: [0],
      totalIva: [0],
      totalConIva: [0]
    });
    this.lineasCompra.push(linea);
    this.recalcularTotalCompra();
  }

  eliminarLineaCompra(index: number) {
    this.lineasCompra.removeAt(index);
    this.recalcularTotalCompra();
  }

  private recalcularTotalCompra() {
    let total = 0;
    for (const ctrl of this.lineasCompra.controls) {
      const v = ctrl.value;
      const cantidad = Number(v.cantidad || 0);
      const precio = Number(v.precioUnitario || 0);
      const iva = Number(v.ivaPorcentaje ?? 21);
      const base = Math.round(cantidad * precio * 100) / 100;
      const ivaAmt = Math.round(base * (iva / 100) * 100) / 100;
      const totalConIva = Math.round((base + ivaAmt) * 100) / 100;
      ctrl.patchValue(
        { totalLinea: base, totalIva: ivaAmt, totalConIva },
        { emitEvent: false }
      );
      total += totalConIva;
    }
    this.formCompra.patchValue({ importe: Math.round(total * 100) / 100 }, { emitEvent: false });
  }

  agregarLineaVenta() {
    const linea = this.fb.group({
      concepto: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
      precioUnitario: [0, [Validators.required, Validators.min(0)]],
      ivaPorcentaje: [21, [Validators.required, Validators.min(0)]],
      totalLinea: [0],
      totalIva: [0],
      totalConIva: [0]
    });
    this.lineasVenta.push(linea);
    this.recalcularTotalVenta();
  }

  eliminarLineaVenta(index: number) {
    this.lineasVenta.removeAt(index);
    this.recalcularTotalVenta();
  }

  private recalcularTotalVenta() {
    let total = 0;
    for (const ctrl of this.lineasVenta.controls) {
      const v = ctrl.value;
      const cantidad = Number(v.cantidad || 0);
      const precio = Number(v.precioUnitario || 0);
      const iva = Number(v.ivaPorcentaje ?? 21);
      const base = Math.round(cantidad * precio * 100) / 100;
      const ivaAmt = Math.round(base * (iva / 100) * 100) / 100;
      const totalConIva = Math.round((base + ivaAmt) * 100) / 100;
      ctrl.patchValue(
        { totalLinea: base, totalIva: ivaAmt, totalConIva },
        { emitEvent: false }
      );
      total += totalConIva;
    }
    this.formVenta.patchValue({ importe: Math.round(total * 100) / 100 }, { emitEvent: false });
  }

  setVentasTab(tab: 'ALBARAN' | 'FACTURA') {
    this.activeVentasTab = tab;
    this.formVenta.patchValue({ tipo: tab });
  }

  toggleVentaForm() {
    this.showVentaForm = !this.showVentaForm;
  }

  crearDocumentoVenta() {
    if (!this.idTramite || this.formVenta.invalid) {
      this.formVenta.markAllAsTouched();
      return;
    }
    const v = this.formVenta.value;
    const lineas = this.lineasVenta.value || [];
    if (lineas.length === 0) {
      Swal.fire('Aviso', 'Añade al menos una línea al documento de venta.', 'warning');
      return;
    }
    const payload: VentaDocumentoCreateRequest = {
      tipo: this.activeVentasTab,
      numeroDocumento: String(v.numeroDocumento).trim(),
      fecha: String(v.fecha),
      importe: Number(v.importe || 0),
      notas: v.notas ? String(v.notas).trim() : undefined,
      presupuestoId: v.presupuestoId ? Number(v.presupuestoId) : undefined,
      lineas
    };
    this.ventaDocumentosService.crearDocumento(this.idTramite, payload).subscribe({
      next: (doc) => {
        Swal.fire('Guardado', `${this.activeVentasTab === 'ALBARAN' ? 'Albarán' : 'Factura'} de venta registrada correctamente.`, 'success');
        this.documentosVenta.push(doc);
        this.formVenta.patchValue({
          tipo: this.activeVentasTab,
          numeroDocumento: '',
          fecha: new Date().toISOString().slice(0, 10),
          importe: 0,
          notas: '',
          presupuestoId: null,
        });
        this.lineasVenta.clear();
        this.agregarLineaVenta();
        this.evaluarFacturacionIntervencion();
      },
      error: (e) => {
        let msg = 'No se pudo registrar el documento de venta.';
        if (typeof e?.error === 'string') msg = e.error;
        else if (e?.error?.message) msg = e.error.message;
        Swal.fire('Error', msg, 'error');
      }
    });
  }

  generarFacturaVentaDesdeAlbaran(doc: VentaDocumentoDTO) {
    if (!doc?.idDocumento || doc.tipo !== 'ALBARAN') return;

    Swal.fire({
      title: 'Generar factura de venta',
      text: 'Se generará una factura de venta a partir de este albarán.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Generar factura',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1e293b',
    }).then((res) => {
      if (!res.isConfirmed) return;

      this.ventaDocumentosService.generarFacturaDesdeAlbaran(doc.idDocumento).subscribe({
        next: (factura) => {
          this.documentosVenta.push(factura);
          Swal.fire('Generada', 'Factura de venta generada correctamente a partir del albarán.', 'success');
          this.cargarVentas();
          this.setVentasTab('FACTURA');
        },
        error: (e) => {
          let msg = 'No se pudo generar la factura de venta.';
          if (typeof e?.error === 'string') msg = e.error;
          else if (e?.error?.message) msg = e.error.message;
          Swal.fire('Error', msg, 'error');
        }
      });
    });
  }

  guardarInfo(silent = false) {
    if (!this.detalle || !this.idTramite) return;
    const v = this.formInfo.value;
    const tramitePayload = {
      estado: v.estado,
      esUrgente: v.esUrgente,
      facturado: v.facturado,
      descripcion: v.descripcion || null,
      fechaSeguimiento: v.fechaSeguimiento || null,
    };
    this.tramiteService.update(this.idTramite, tramitePayload).subscribe({
      next: () => {
        // Automatizar estado de la legalización según la fecha de ejecución (fechaSeguimiento)
        if (this.isLegalizacion && this.legalizacionBT?.idLegalizacion) {
          const nuevoEstado = v.fechaSeguimiento ? 'Completado' : 'Pendiente';
          if (this.legalizacionBT.estado !== nuevoEstado) {
            this.cambiarEstadoLegalizacion(nuevoEstado);
          }
        }

        if (!silent) {
          this.finGuardarInfo();
        }
      },
      error: (e) => {
        console.error('Error autoguardando:', e);
        Swal.fire({
          title: 'Error de Autoguardado',
          text: e?.error?.message || 'No se pudieron guardar los cambios automáticamente. Comprueba tu conexión.',
          icon: 'error',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false
        });
      }
    });
  }

  private finGuardarInfo() {
    this.cargarDetalle();
    Swal.fire('Guardado', 'Datos técnicos y observaciones guardados correctamente.', 'success');
  }

  onProveedorInput() {
    const label = this.formHito.get('proveedorLabel')?.value;
    const found = this.proveedores.find(p => p.nombre === label);
    if (found) {
      this.formHito.patchValue({ idProveedor: found.id });
    } else {
      this.formHito.patchValue({ idProveedor: null });
    }
  }

  abrirProveedorModal() {
    this.proveedorQuery = '';
    this.filtrarProveedores();
    this.modalProveedorVisible = true;
  }

  cerrarProveedorModal() {
    this.modalProveedorVisible = false;
  }

  filtrarProveedores() {
    const term = this.proveedorQuery.trim().toLowerCase();
    if (!term) {
      this.proveedoresFiltrados = this.proveedoresCompletos.slice(0, 50);
      return;
    }
    this.proveedoresFiltrados = this.proveedoresCompletos.filter(p => {
      const nombre = (p.nombreComercial || '').toLowerCase();
      const cif = (p.cif || '').toLowerCase();
      const razon = (p.razonSocial || '').toLowerCase();
      return nombre.includes(term) || cif.includes(term) || razon.includes(term);
    }).slice(0, 50);
  }

  seleccionarProveedor(p: any) {
    const id = p.idProveedor ?? p.id;
    const nombre = p.nombreComercial || p.razonSocial || 'Proveedor';
    this.formHito.patchValue({
      idProveedor: id,
      proveedorLabel: nombre
    });
    this.cerrarProveedorModal();
  }

  getOficiosLabels(p: any): string[] {
    if (p.oficios && Array.isArray(p.oficios)) return p.oficios;
    if (p.listaOficios && Array.isArray(p.listaOficios)) {
      return p.listaOficios.map((o: any) => o.oficio);
    }
    return [];
  }

  editingHitoId: number | null = null;

  toggleNuevoHito() {
    this.showNuevoHito = !this.showNuevoHito;
    this.editingHitoId = null; // Reset edit mode
    if (this.showNuevoHito) {
      this.formHito.reset({
        comentario: '',
        fechaSeguimiento: new Date().toISOString().slice(0, 10),
        estado: 'Pendiente',
        esUrgente: false,
        idsUsuariosAsignados: [],
        idsTecnicosInstaladores: [],
        idProveedor: null,
        proveedorLabel: '',
      });
    }
  }

  addUserHito(event: any) {
    const id = Number(event.target.value);
    if (!id) return;

    // Establecemos tanto el idUsuarioAsignado (principal) como la lista (compatibilidad)
    this.formHito.patchValue({
      idUsuarioAsignado: id,
      idsUsuariosAsignados: [id]
    });

    // Reset dropdown
    event.target.value = '';
  }

  removeUserHito(id: number) {
    this.formHito.patchValue({
      idUsuarioAsignado: null,
      idsUsuariosAsignados: []
    });
  }

  getNombreUsuario(id: number): string {
    const u = this.tecnicos.find(user => (user.idUsuario ?? (user as any).id) === id);
    return u ? u.nombreUsuario : 'Usuario';
  }

  editarHito(h: Seguimiento) {
    this.editingHitoId = h.idSeguimiento!;
    this.showNuevoHito = true;

    // Format date for input type="date"
    let fSeg = '';
    if (h.fechaSeguimiento) {
      fSeg = h.fechaSeguimiento.toString().slice(0, 10);
    }

    this.formHito.patchValue({
      comentario: h.comentario,
      fechaSeguimiento: fSeg,
      estado: h.estado || 'Pendiente',
      esUrgente: !!h.esUrgente,
      idsUsuariosAsignados: h.idsUsuariosAsignados || [],
      idsTecnicosInstaladores: h.idsTecnicosInstaladores || [],
      idProveedor: h.idProveedor ?? null,
      proveedorLabel: h.nombreProveedor || '',
      idUsuarioAsignado: h.idUsuarioAsignado,
    });
  }

  guardarHito() {
    if (this.formHito.invalid || !this.idTramite) return;
    const v = this.formHito.value;
    let finalIdProveedor = v.idProveedor;
    if (!finalIdProveedor && v.proveedorLabel) {
      const found = this.proveedores.find(p => p.nombre === v.proveedorLabel);
      if (found) finalIdProveedor = found.id;
    }

    const payload: Partial<Seguimiento> = {
      idTramite: this.idTramite,
      comentario: v.comentario,
      fechaSeguimiento: v.fechaSeguimiento || new Date().toISOString().slice(0, 10),
      estado: v.estado || 'Pendiente',
      esUrgente: !!v.esUrgente,
      idsUsuariosAsignados: v.idsUsuariosAsignados || [],
      idsTecnicosInstaladores: v.idsTecnicosInstaladores || [],
      idProveedor: finalIdProveedor ?? undefined,
      idUsuarioAsignado: v.idUsuarioAsignado
    };

    if (this.editingHitoId) {
      this.seguimientoService.update(this.editingHitoId, payload).subscribe({
        next: () => {
          this.finalizeHitoSave('Actualizado', 'Hito actualizado correctamente.');
        },
        error: (e) => this.handleHitoError(e)
      });
    } else {
      this.seguimientoService.create(payload as Seguimiento).subscribe({
        next: () => {
          this.finalizeHitoSave('Registrado', 'Hito de seguimiento añadido correctamente.');
        },
        error: (e) => this.handleHitoError(e)
      });
    }
  }

  private finalizeHitoSave(title: string, msg: string) {
    this.cargarHitos();
    this.formHito.reset({ estado: 'Pendiente' });
    this.showNuevoHito = false;
    this.editingHitoId = null;
    Swal.fire(title, msg, 'success');
  }

  private handleHitoError(e: any) {
    const msg = (e?.error && (e.error['message'] ?? e.error['error'])) || 'No se pudo guardar el hito.';
    Swal.fire('Error', msg, 'error');
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

  // Edición de seguimientos: se gestiona a través del formulario formHito
  // usando los métodos guardarHito / editarHito ya existentes.

  onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.filesToUpload = input.files ? Array.from(input.files) : [];
  }

  subirArchivos() {
    if (!this.idTramite || !this.filesToUpload.length) {
      Swal.fire('Aviso', 'Selecciona al menos un archivo.', 'warning');
      return;
    }
    const base = `${environment.apiUrl}/archivos`;
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

  /**
   * Lógica profesional para sugerir marcar la intervención como facturada.
   * Si existen facturas de venta vinculadas y la intervención no está marcada
   * como facturada, mostramos un aviso una sola vez en la sesión del componente.
   */
  private evaluarFacturacionIntervencion() {
    if (this.hasAskedFacturado) return;
    if (!this.detalle) return;

    const tieneFacturaVenta = (this.documentosVenta || []).some(d => d.tipo === 'FACTURA');
    if (!tieneFacturaVenta) return;

    // Si ya está facturada en BD, no preguntamos.
    if (this.detalle.facturado) {
      this.hasAskedFacturado = true;
      return;
    }

    this.hasAskedFacturado = true;

    Swal.fire({
      title: '¿Marcar intervención como facturada?',
      text: 'Se han detectado facturas de venta asociadas a esta intervención. ¿Quieres marcarla como facturada para que aparezca así en los listados?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar como facturada',
      cancelButtonText: 'No por ahora',
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#64748b'
    }).then(res => {
      if (!res.isConfirmed) {
        return;
      }
      // Marcamos el check en el formulario y guardamos en backend
      this.formInfo.patchValue({ facturado: true });
      this.detalle!.facturado = true;
      this.guardarInfo(true);
      Swal.fire('Actualizada', 'La intervención se ha marcado como facturada.', 'success');
    });
  }

  quitarInstalador(idInstalador: number) {
    if (!idInstalador || !this.idTramite) return;
    this.tramiteService.desvincularInstalador(this.idTramite, idInstalador).subscribe({
      next: () => {
        if (this.detalle?.instaladores) {
          this.detalle.instaladores = this.detalle.instaladores.filter(i => i.idTecnicoInstalador !== idInstalador);
        }
        Swal.fire({ title: 'Eliminado', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
      },
      error: () => Swal.fire('Error', 'No se pudo desvincular.', 'error')
    });
  }

  asignarInstalador(event: Event) {
    const target = event.target as HTMLSelectElement;
    const idInstalador = Number(target.value);
    if (!idInstalador || !this.idTramite) return;

    // Evitar duplicados localmente
    const existe = this.detalle?.instaladores?.some(i => i.idTecnicoInstalador === idInstalador);
    if (existe) {
      Swal.fire('Aviso', 'Este instalador ya está asignado.', 'info');
      target.value = '';
      return;
    }

    this.tramiteService.asignarInstalador(this.idTramite, idInstalador).subscribe({
      next: () => {
        const ins = this.instaladores.find(i => i.idTecnicoInstalador === idInstalador);
        if (ins && this.detalle) {
          if (!this.detalle.instaladores) this.detalle.instaladores = [];
          this.detalle.instaladores.push({
            idTecnicoInstalador: ins.idTecnicoInstalador!,
            nombre: ins.nombre,
            telefono: ins.telefono
          });
        }
        target.value = '';
        Swal.fire({ title: 'Asignado', icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
      },
      error: () => {
        Swal.fire('Error', 'No se pudo asignar.', 'error');
      }
    });
  }

  // LÓGICA LEGALIZACIÓN BT
  cargarLegalizacion() {
    if (!this.idTramite) return;
    this.legalizacionBTService.getByTramite(this.idTramite).subscribe({
      next: (list) => {
        if (list && list.length > 0) {
          this.legalizacionBT = list[0];
          try {
            if (this.legalizacionBT.datosJson) {
              const parsed = JSON.parse(this.legalizacionBT.datosJson);
              this.cie = { ...this.getEmptyCie(), ...parsed };
              // Ensure any missing fields from the old JSON are autocompleted from local
              this.preRellenarCie();
            }
          } catch (e) {
            console.error('Error parseando datos de legalización', e);
          }
        }
      }
    });
  }

  toggleLegalizacionForm() {
    this.showLegalizacionForm = !this.showLegalizacionForm;
    if (this.showLegalizacionForm && !this.legalizacionBT) {
      this.preRellenarCie();
    }
  }

  guardarYGenerarCie() {
    if (!this.idTramite || !this.detalle?.idLocal) return;

    const estadoCalculado = this.formInfo.value.fechaSeguimiento ? 'Completado' : 'Pendiente';
    const payloadCie: CieRequest = { ...this.cie };
    const data: LegalizacionBT = {
      ...(this.legalizacionBT || {}),
      idLocal: this.detalle.idLocal,
      idTramite: this.idTramite,
      datosJson: JSON.stringify(payloadCie),
      estado: estadoCalculado
    };

    this.legalizacionBTService.create(this.detalle.idLocal, data).subscribe({
      next: (res) => {
        this.legalizacionBT = res;
        this.showLegalizacionForm = false;
        Swal.fire('Guardado', 'Datos de legalización guardados correctamente.', 'success');
      },
      error: () => Swal.fire('Error', 'No se pudo guardar la legalización.', 'error')
    });
  }

  getEmptyCie(): CieRequest {
    return {
      numeroRegistro: '', anoNumeroRegistro: '', nombreTitular: '', dniTitular: '', domicilioTitular: '',
      cpTitular: '', localidadTitular: '', provinciaTitular: '', emplazamientoInstalacion: '',
      numeroEmplazamientoInstalacion: '', bloqueEmplazamientoInstalacion: '', portalEmplazamientoInstalacion: '',
      escaleraEmplazamientoInstalacion: '', pisoEmplazamientoInstalacion: '', puertaEmplazamientoInstalacion: '',
      localidadInstalacion: '', provinciaInstalacion: '', cpInstalacion: '', tipoInstalacion: '',
      usoDestina: '', cups: '', intensidadNominal: '', potenciaPrevista: '', tensionSuministro: '',
      nivelAislamiento: '', materialAislamiento: '', materialConductor: '', fase: '', neutro: '',
      cpConductor: '', empresaDistribuidora: '', pfIntensidadNominal: '', sensibilidad: '',
      resistenciaTierra: '', resistenciaAislamiento: '', observaciones: '', localidadFirma: '',
      diaFirma: '', mesFirma: '', anoFirma: '', chkInstalacionNueva: false, chkInstalacionAmpliacion: false,
      chkInstalacionModificacion: false, chkLineaAlimentacionSi: false, chkLineaAlimentacionNo: false,
      chkMonofasico: false, chkTrifasico: false, chkInterrup: false, chkFusibles: false,
      chkCategoriaBasica: false, chkCategoriaEspecialista: false, tipoAutoconsumo: '', caracteristicasTecnicas: ''
    };
  }

  preRellenarCie() {
    if (!this.detalle) return;
    
    // Autocompleta SI el campo está vacío
    if (!this.cie.nombreTitular) this.cie.nombreTitular = this.detalle.localNombreTitular || '';
    if (!this.cie.dniTitular) this.cie.dniTitular = this.detalle.clienteDni || '';
    if (!this.cie.domicilioTitular) this.cie.domicilioTitular = this.detalle.localDireccion || '';
    if (!this.cie.emplazamientoInstalacion) this.cie.emplazamientoInstalacion = this.detalle.localDireccion || '';
    if (!this.cie.cups) this.cie.cups = this.detalle.localCups || '';
    if (!this.cie.localidadInstalacion) this.cie.localidadInstalacion = this.detalle.localLocalidad || '';
    if (!this.cie.provinciaInstalacion) this.cie.provinciaInstalacion = this.detalle.localProvincia || '';
    if (!this.cie.cpInstalacion) this.cie.cpInstalacion = this.detalle.localCp || '';
  }

  descargarCieManual(event: Event) {
    event.stopPropagation();
    if (!this.legalizacionBT?.idLegalizacion) return;
    this.legalizacionBTService.getCiePdf(this.legalizacionBT.idLegalizacion).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  }

  descargarMtdManual(event: Event) {
    event.stopPropagation();
    if (!this.legalizacionBT?.idLegalizacion) return;
    this.legalizacionBTService.getMtdPdf(this.legalizacionBT.idLegalizacion, this.cie.tipoAutoconsumo, this.cie.caracteristicasTecnicas).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  }

  descargarCertificadoManual(event: Event) {
    event.stopPropagation();
    if (!this.legalizacionBT?.idLegalizacion) return;
    this.legalizacionBTService.getCertificadoPdf(this.legalizacionBT.idLegalizacion).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  }

  cambiarEstadoLegalizacion(nuevoEstado: string): void {
    if (!this.legalizacionBT?.idLegalizacion) return;
    this.legalizacionBTService.patchEstado(this.legalizacionBT.idLegalizacion, nuevoEstado).subscribe({
      next: (res) => {
        this.legalizacionBT = res;
      },
      error: () => Swal.fire('Error', 'No se pudo actualizar el estado.', 'error')
    });
  }

  get isLegalizacion(): boolean {
    const t = (this.detalle?.tipoTramite || '').toUpperCase();
    return t === 'LEGALIZACIÓN' || t === 'LEGALIZACION' || t === 'LEGALIZACION BT';
  }
}
