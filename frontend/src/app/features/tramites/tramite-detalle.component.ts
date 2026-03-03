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
} from '../../services/domain.services';
import { PresupuestoService, PresupuestoListItem } from '../../services/presupuesto.service';
import { AlbaranVentaService, AlbaranVentaDTO } from '../../services/albaran-venta.service';
import { DocumentosService } from '../../services/documentos.service';
import { ComprasService, CompraDocumentoDTO, CompraDocumentoCreateRequest } from '../../services/compras.service';
import { UsuarioService as UsuarioApi, Usuario } from '../../services/usuario.service';
import { ProveedorService, ProveedorDTO } from '../../services/proveedor.service';
import { HttpClient } from '@angular/common/http';
import { AuditStampComponent } from '../../layout/audit-stamp.component';
import Swal from 'sweetalert2';
import { environment } from '../../../environments/environments';

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
  proveedores: { id: number; nombre: string }[] = [];
  archivos: ArchivoTramite[] = [];
  showNuevoHito = false;
  idTramite: number | null = null;
  loading = true;
  activeTab = 'general';
  presupuestos: PresupuestoListItem[] = [];
  albaranesVenta: AlbaranVentaDTO[] = [];
  cargandoAlbaranes = false;
  descargandoDocs: Record<string, boolean> = {};
  documentosCompra: CompraDocumentoDTO[] = [];
  cargandoCompras = false;
  eliminandoDocsCompra: Record<string, boolean> = {};
  activeComprasTab: 'ALBARAN' | 'FACTURA' = 'ALBARAN';
  totalGastos = 0;
  totalVentas = 0;
  margen = 0;

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
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.formInfo = this.fb.group({
      estado: ['Pendiente', Validators.required],
      esUrgente: [false],
      facturado: [false],
      detalleSeguimiento: [''],
      fechaSeguimiento: [''],
    });
    this.formHito = this.fb.group({
      comentario: ['', Validators.required],
      fechaSeguimiento: [''],
      estado: ['Pendiente'],
      esUrgente: [false],
      idUsuarioAsignado: [null as number | null],
      idProveedor: [null as number | null],
      proveedorLabel: [''],
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
      this.cargarPresupuestos();
      this.cargarAlbaranesVenta();
      this.cargarCompras();
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
          detalleSeguimiento: d.detalleSeguimiento || '',
          fechaSeguimiento: fStr || '',
        }, { emitEvent: false });
        this.isPatchingForm = false;
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
      next: (list) => (this.hitos = list || []),
      error: () => { },
    });
  }

  cargarTecnicos() {
    this.usuarioService.getTecnicos().subscribe({
      next: (list) => (this.tecnicos = list || []),
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
        this.recalcularMargen();
      },
      error: () => {
        this.albaranesVenta = [];
        this.cargandoAlbaranes = false;
        this.recalcularMargen();
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
        this.recalcularMargen();
      },
      error: () => {
        this.documentosCompra = [];
        this.cargandoCompras = false;
        this.recalcularMargen();
      }
    });
  }

  setComprasTab(tab: 'ALBARAN' | 'FACTURA') {
    this.activeComprasTab = tab;
    this.formCompra.patchValue({ tipo: tab });
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
      text: 'Se creará una factura con las mismas líneas y totales que este albarán.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Generar factura',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1e293b',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.comprasService.generarFacturaDesdeAlbaran(doc.idDocumento).subscribe({
        next: (factura) => {
          this.documentosCompra.push(factura);
          this.recalcularMargen();
          Swal.fire('Generada', 'Factura generada correctamente a partir del albarán.', 'success');
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
          this.documentosCompra.splice(index, 1);
          this.recalcularMargen();
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
      this.cargarAlbaranesVenta();
    }
    if (tab === 'compras') {
      this.cargarCompras();
    }
  }

  private recalcularMargen() {
    const gastos = this.documentosCompra.reduce((acc, a) => acc + (Number(a.total) || 0), 0);
    const ventas = this.albaranesVenta.reduce((acc, a) => acc + (Number(a.total) || 0), 0);
    this.totalGastos = Math.round(gastos * 100) / 100;
    this.totalVentas = Math.round(ventas * 100) / 100;
    this.margen = Math.round((this.totalVentas - this.totalGastos) * 100) / 100;
  }

  get lineasCompra(): FormArray {
    return this.formCompra.get('lineas') as FormArray;
  }

  get documentosCompraFiltrados(): CompraDocumentoDTO[] {
    return this.documentosCompra.filter(d => d.tipo === this.activeComprasTab);
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

  guardarInfo(silent = false) {
    if (!this.detalle || !this.idTramite) return;
    const v = this.formInfo.value;
    const tramitePayload = {
      estado: v.estado,
      esUrgente: v.esUrgente,
      facturado: v.facturado,
      detalleSeguimiento: v.detalleSeguimiento || null,
      fechaSeguimiento: v.fechaSeguimiento || null,
    };
    this.tramiteService.update(this.idTramite, tramitePayload).subscribe({
      next: () => {
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
        idUsuarioAsignado: this.tecnicos[0]?.idUsuario ?? null,
        idProveedor: null,
        proveedorLabel: '',
      });
    }
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
      idUsuarioAsignado: h.idUsuarioAsignado ?? null,
      idProveedor: h.idProveedor ?? null,
      proveedorLabel: h.nombreProveedor || '',
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
      idUsuarioAsignado: v.idUsuarioAsignado ?? undefined,
      idProveedor: finalIdProveedor ?? undefined,
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
}
