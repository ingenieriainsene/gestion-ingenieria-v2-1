import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LocalService, ContratoService } from '../../services/domain.services';
import type { Local, Contrato, Cliente } from '../../services/domain.services';

@Component({
  selector: 'app-local-ficha-view',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './local-ficha-view.component.html',
  styleUrls: ['./local-ficha-view.component.css'],
})
export class LocalFichaViewComponent implements OnInit {
  local: Local | null = null;
  contratos: Contrato[] = [];
  loading = true;
  idLocal: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private localService: LocalService,
    private contratoService: ContratoService,
  ) {}

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
      error: () => {},
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

  buildCatastroUrl(fullRc: string): string {
    const rc14 = fullRc.substring(0, 14);
    return `https://www1.sedecatastro.gob.es/Cartografia/mapa.aspx?refcat=${encodeURIComponent(rc14)}&RCCompleta=${encodeURIComponent(fullRc)}&from=OVCBusqueda&pest=rc`;
  }

  idCliente(): number | null {
    const l = this.local as any;
    return l?.cliente?.idCliente ?? l?.idCliente ?? null;
  }
}
