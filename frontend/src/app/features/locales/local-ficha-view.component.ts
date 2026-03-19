import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LocalService, ContratoService, LegalizacionRequest, CieRequest, LegalizacionBT, LegalizacionBTService } from '../../services/domain.services';
import { AuditStampComponent } from '../../layout/audit-stamp.component';
import type { Local, Contrato, Cliente } from '../../services/domain.services';
import Swal from 'sweetalert2';

import { AreaFuncionalEditorComponent } from './area-funcional-editor.component';

@Component({
  selector: 'app-local-ficha-view',
  standalone: true,
  imports: [CommonModule, RouterLink, AuditStampComponent, AreaFuncionalEditorComponent, FormsModule],
  templateUrl: './local-ficha-view.component.html',
  styleUrls: ['./local-ficha-view.component.css', './premium-form.css'],
})
export class LocalFichaViewComponent implements OnInit {
  local: Local | null = null;
  contratos: Contrato[] = [];
  loading = true;
  idLocal: number | null = null;
  areasFuncionalesVisible = false;

  // Refactor Legalización BT
  legalizacionesHistory: LegalizacionBT[] = [];
  legalizacionPanelVisible = false;
  mostrarHistorial = true;
  mostrarFormularioCie = false;

  cie: CieRequest = this.getEmptyCie();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private localService: LocalService,
    private contratoService: ContratoService,
    private legalizacionBTService: LegalizacionBTService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id || id === 'nuevo') {
        this.router.navigate(['/locales']);
        return;
      }
      this.idLocal = +id;
      this.load();
    });
  }

  load(): void {
    if (!this.idLocal) return;
    this.loading = true;
    this.localService.getById(this.idLocal).subscribe({
      next: (l) => {
        this.local = l;
        this.loading = false;
        this.preRellenarCie();
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/locales']);
      },
    });
    this.contratoService.getAll().subscribe({
      next: (list) => {
        const id = this.idLocal;
        this.contratos = (list || []).filter((c: any) => (c.local?.idLocal ?? c.idLocal) === id);
      },
      error: () => { },
    });
    this.loadLegalizaciones();
  }

  loadLegalizaciones(): void {
    if (!this.idLocal) return;
    this.legalizacionBTService.getByLocal(this.idLocal).subscribe({
      next: (list) => this.legalizacionesHistory = list,
      error: () => { }
    });
  }

  private getEmptyCie(): CieRequest {
    return {
      numeroRegistro: '',
      anoNumeroRegistro: '',
      nombreTitular: '',
      dniTitular: '',
      domicilioTitular: '',
      cpTitular: '',
      localidadTitular: '',
      provinciaTitular: '',
      emplazamientoInstalacion: '',
      numeroEmplazamientoInstalacion: '',
      bloqueEmplazamientoInstalacion: '',
      portalEmplazamientoInstalacion: '',
      escaleraEmplazamientoInstalacion: '',
      pisoEmplazamientoInstalacion: '',
      puertaEmplazamientoInstalacion: '',
      localidadInstalacion: '',
      provinciaInstalacion: '',
      cpInstalacion: '',
      tipoInstalacion: '',
      usoDestina: '',
      cups: '',
      intensidadNominal: '',
      potenciaPrevista: '',
      tensionSuministro: '',
      nivelAislamiento: '',
      materialAislamiento: '',
      materialConductor: '',
      fase: '',
      neutro: '',
      cpConductor: '',
      empresaDistribuidora: '',
      pfIntensidadNominal: '',
      sensibilidad: '',
      resistenciaTierra: '',
      resistenciaAislamiento: '',
      observaciones: '',
      localidadFirma: '',
      diaFirma: '',
      mesFirma: '',
      anoFirma: '',
      chkInstalacionNueva: false,
      chkInstalacionAmpliacion: false,
      chkInstalacionModificacion: false,
      chkLineaAlimentacionSi: false,
      chkLineaAlimentacionNo: false,
      chkMonofasico: false,
      chkTrifasico: false,
      chkInterrup: false,
      chkFusibles: false,
      chkCategoriaBasica: false,
      chkCategoriaEspecialista: false,
      tipoAutoconsumo: '',
      caracteristicasTecnicas: ''
    };
  }

  vigente(c: Contrato): boolean {
    if (!c.fechaVencimiento) return true;
    return new Date(c.fechaVencimiento) >= new Date();
  }

  nombreCompleto(cli: Cliente): string {
    const a = [cli.apellido1, cli.apellido2].filter(Boolean).join(' ');
    const n = cli.nombre || '';
    return a ? (n ? `${a}, ${n}` : a) : (n || '—');
  }

  titularContrato(c: Contrato): string {
    const cli = (c as any).cliente;
    if (!cli) return '—';
    return this.nombreCompleto(cli);
  }

  direccionLocalContrato(c: Contrato): string {
    const loc = (c as any).local;
    return (loc?.direccionCompleta as string) || '—';
  }

  buildMapsUrl(direccion: string): string {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(direccion || '');
  }

  private preRellenarCie(): void {
    if (!this.local) return;
    const cli = this.local.cliente;
    if (cli) {
      if (!this.cie.nombreTitular) this.cie.nombreTitular = this.nombreCompleto(cli);
      this.cie.dniTitular = cli.dni || this.cie.dniTitular;
      this.cie.domicilioTitular = cli.direccionFiscalCompleta || this.cie.domicilioTitular;
      this.cie.cpTitular = cli.codigoPostal || this.cie.cpTitular;
    } else {
      const titular = `${this.local.nombreTitular || ''} ${this.local.apellido1Titular || ''} ${this.local.apellido2Titular || ''}`.trim();
      this.cie.nombreTitular = titular || this.cie.nombreTitular;
      this.cie.dniTitular = this.local.dniTitular || this.cie.dniTitular;
    }
    this.cie.emplazamientoInstalacion = this.local.direccionCompleta || this.cie.emplazamientoInstalacion;
    this.cie.cups = this.local.cups || this.cie.cups;
  }

  abrirCatastro(rc: string): void {
    const normalized = (rc || '').replace(/\s+/g, '').toUpperCase();
    if (!normalized) return;
    const rc14 = encodeURIComponent(normalized.substring(0, Math.min(14, normalized.length)));
    const url = `https://www1.sedecatastro.gob.es/Cartografia/mapa.aspx?buscar=S&refcat=${rc14}`;
    window.open(url, '_blank');
  }

  idCliente(): number | null {
    const l = this.local as any;
    return l?.cliente?.idCliente ?? l?.idCliente ?? null;
  }

  toggleAreasFuncionales(): void {
    this.areasFuncionalesVisible = !this.areasFuncionalesVisible;
  }

  irAContrato(c: Contrato): void {
    if (!c.idContrato) return;
    this.router.navigate(['/contratos', c.idContrato]);
  }

  // Lógica Legalización BT
  toggleLegalizacionPanel(): void {
    this.legalizacionPanelVisible = !this.legalizacionPanelVisible;
    if (this.legalizacionPanelVisible) {
      this.mostrarHistorial = true;
      this.mostrarFormularioCie = false;
    }
  }

  // Métodos de creación eliminados: Se gestionan desde la intervención

  cancelarFormulario(): void {
    this.mostrarFormularioCie = false;
    this.mostrarHistorial = true;
  }


  descargarCertificadoManual(idLeg: number, event: Event): void {
    event.stopPropagation();
    this.legalizacionBTService.getCertificadoPdf(idLeg).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: () => Swal.fire('Error', 'No se pudo generar el Certificado.', 'error')
    });
  }

  descargarCieManual(idLeg: number, event: Event): void {
    event.stopPropagation();
    this.legalizacionBTService.getCiePdf(idLeg).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: () => Swal.fire('Error', 'No se pudo generar el CIE.', 'error')
    });
  }

  descargarMtdManual(leg: LegalizacionBT, event: Event): void {
    event.stopPropagation();
    const idLeg = leg.idLegalizacion;
    if (!idLeg) return;

    let currentData: any = {};
    try {
      currentData = JSON.parse(leg.datosJson || '{}');
    } catch (e) {}

    Swal.fire({
      title: 'Completar Datos MTD',
      html: `
        <div style="text-align: left; padding: 0 10px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem; color: #555;">Tipo Autoconsumo</label>
          <input id="swal-tipo" class="swal2-input" style="margin: 0; width: 100%; box-sizing: border-box;" value="${currentData.tipoAutoconsumo || ''}" placeholder="Ej. Individual con excedentes">
          
          <label style="display: block; margin-top: 15px; margin-bottom: 5px; font-weight: 600; font-size: 0.9rem; color: #555;">Características Técnicas</label>
          <textarea id="swal-caract" class="swal2-textarea" style="margin: 0; width: 100%; box-sizing: border-box; height: 100px;" placeholder="Ej. Paneles 450W, Inversor 5kW...">${currentData.caracteristicasTecnicas || ''}</textarea>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Generar PDF',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        return {
          tipoAutoconsumo: (document.getElementById('swal-tipo') as HTMLInputElement).value,
          caracteristicas: (document.getElementById('swal-caract') as HTMLTextAreaElement).value
        };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const { tipoAutoconsumo, caracteristicas } = result.value;
        this.legalizacionBTService.getMtdPdf(idLeg, tipoAutoconsumo, caracteristicas).subscribe({
          next: (blob: Blob) => {
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
          },
          error: () => Swal.fire('Error', 'No se pudo generar la MTD.', 'error')
        });
      }
    });
  }

  private downloadBlob(blob: Blob, name: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  verLegalizacion(leg: LegalizacionBT): void {
    if (!leg.datosJson) return;
    try {
      this.cie = JSON.parse(leg.datosJson);
      // Solo para visualización, podrías mostrar un modal de solo lectura si lo deseas, 
      // o simplemente navegar a la intervención si tiene idTramite.
      // Por ahora, mantenemos la visibilidad del "formulario" pero lo usaremos como solo lectura en el HTML si es necesario.
      this.mostrarFormularioCie = true;
      this.mostrarHistorial = false;
    } catch (e) {
      console.error('Error parseando datos de legalización', e);
    }
  }


  eliminarLegalizacion(id: number, event: Event): void {
    event.stopPropagation();
    Swal.fire({
      title: '¿Eliminar legalización?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.legalizacionBTService.delete(id).subscribe({
          next: () => this.loadLegalizaciones(),
          error: () => Swal.fire('Error', 'No se pudo eliminar.', 'error')
        });
      }
    });
  }
}
