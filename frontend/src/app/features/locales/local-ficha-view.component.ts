import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LocalService, ContratoService, LegalizacionRequest } from '../../services/domain.services';
import { AuditStampComponent } from '../../layout/audit-stamp.component';
import type { Local, Contrato, Cliente } from '../../services/domain.services';
import Swal from 'sweetalert2';

import { AreaFuncionalEditorComponent } from './area-funcional-editor.component';

@Component({
  selector: 'app-local-ficha-view',
  standalone: true,
  imports: [CommonModule, RouterLink, AuditStampComponent, AreaFuncionalEditorComponent, FormsModule],
  templateUrl: './local-ficha-view.component.html',
  styleUrls: ['./local-ficha-view.component.css'],
})
export class LocalFichaViewComponent implements OnInit {
  local: Local | null = null;
  contratos: Contrato[] = [];
  loading = true;
  idLocal: number | null = null;
  areasFuncionalesVisible = false;
  legalizacionVisible = false;

  legalizacion: LegalizacionRequest = {
    titular: '',
    nif: '',
    emplazamiento: '',
    cups: '',
    tipoAutoconsumo: '',
    caracteristicasTecnicas: ''
  };


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private localService: LocalService,
    private contratoService: ContratoService,
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
        this.preRellenarLegalizacion();
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

  private preRellenarLegalizacion(): void {
    if (!this.local) return;
    const titular = `${this.local.nombreTitular || ''} ${this.local.apellido1Titular || ''} ${this.local.apellido2Titular || ''}`.trim();
    this.legalizacion.titular = titular || this.legalizacion.titular;
    this.legalizacion.nif = this.local.dniTitular || this.legalizacion.nif;
    this.legalizacion.emplazamiento = this.local.direccionCompleta || this.legalizacion.emplazamiento;
    this.legalizacion.cups = this.local.cups || this.legalizacion.cups;
    this.legalizacion.latitud = this.local.latitud ?? this.legalizacion.latitud;
    this.legalizacion.longitud = this.local.longitud ?? this.legalizacion.longitud;
  }

  abrirCatastro(rc: string): void {
    const normalized = (rc || '').replace(/\s+/g, '').toUpperCase();
    if (!normalized) {
      return;
    }
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
    if (!c.idContrato) {
      return;
    }
    this.router.navigate(['/contratos', c.idContrato]);
  }

  toggleLegalizacion(): void {
    this.legalizacionVisible = !this.legalizacionVisible;
  }

  generarMemoria(): void {
    if (!this.idLocal) {
      return;
    }

    // Refrescamos coordenadas por si se han modificado en otro proceso
    if (this.local) {
      this.legalizacion.latitud = this.local.latitud ?? this.legalizacion.latitud;
      this.legalizacion.longitud = this.local.longitud ?? this.legalizacion.longitud;
    }

    const payload: LegalizacionRequest = { ...this.legalizacion };

    this.localService.generarMemoriaLegalizacion(this.idLocal, payload).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memoria-legalizacion-local-${this.idLocal}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        Swal.fire('Error', 'No se pudo generar la memoria de legalización.', 'error');
      }
    });
  }

}
