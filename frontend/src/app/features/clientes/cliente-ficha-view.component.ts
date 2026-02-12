import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClienteService, LocalService, ContratoService } from '../../services/domain.services';
import { PresupuestoService, PresupuestoListItem } from '../../services/presupuesto.service';
import { AuditStampComponent } from '../../layout/audit-stamp.component';
import type { Cliente, Local, Contrato } from '../../services/domain.services';

@Component({
  selector: 'app-cliente-ficha-view',
  standalone: true,
  imports: [CommonModule, RouterLink, AuditStampComponent],
  templateUrl: './cliente-ficha-view.component.html',
  styleUrls: ['./cliente-ficha-view.component.css'],
})
export class ClienteFichaViewComponent implements OnInit {
  cliente: Cliente | null = null;
  locales: Local[] = [];
  contratos: Contrato[] = [];
  presupuestos: PresupuestoListItem[] = [];
  loading = true;
  idCliente: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clienteService: ClienteService,
    private localService: LocalService,
    private contratoService: ContratoService,
    private presupuestoService: PresupuestoService,
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id || id === 'nuevo') {
        this.router.navigate(['/clientes']);
        return;
      }
      this.idCliente = +id;
      this.load();
    });
  }

  load(): void {
    if (!this.idCliente) return;
    this.loading = true;
    this.clienteService.getById(this.idCliente).subscribe({
      next: (c) => {
        this.cliente = c;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.router.navigate(['/clientes']);
      },
    });
    this.localService.getAll().subscribe({
      next: (list) => {
        const id = this.idCliente;
        this.locales = (list || []).filter((l: any) => (l.cliente?.idCliente ?? l.idCliente) === id);
      },
      error: () => { },
    });
    this.contratoService.getAll().subscribe({
      next: (list) => {
        const id = this.idCliente;
        this.contratos = (list || []).filter((c: any) => (c.cliente?.idCliente ?? c.idCliente) === id);
      },
      error: () => { },
    });
    this.presupuestoService.getBudgets().subscribe({
      next: (list) => {
        const id = this.idCliente;
        this.presupuestos = (list || []).filter((p) => p.clienteId === id);
      },
      error: () => { },
    });
  }

  nombreCompleto(cli: Cliente): string {
    const a = [cli.apellido1, cli.apellido2].filter(Boolean).join(' ');
    const n = cli.nombre || '';
    return a ? (n ? `${a}, ${n}` : a) : (n || '—');
  }

  vigente(c: Contrato): boolean {
    if (!c.fechaVencimiento) return true;
    const v = new Date(c.fechaVencimiento);
    return v >= new Date();
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

  getContratosPorLocal(idLocal: number): Contrato[] {
    return this.contratos.filter(c => (c.idLocal ?? (c as any).local?.idLocal) === idLocal);
  }
}
