import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClienteService, LocalService, ContratoService } from '../../services/domain.services';
import { PresupuestoService, PresupuestoListItem } from '../../services/presupuesto.service';
import { GestorDocumentalService, ArchivoAdjuntoDTO } from '../../services/gestor-documental.service';
import { AuditStampComponent } from '../../layout/audit-stamp.component';
import type { Cliente, Local, Contrato } from '../../services/domain.services';
import Swal from 'sweetalert2';

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
  activeTab: 'locales' | 'contratos' | 'presupuestos' | 'archivos' = 'locales';
  
  // Gestión de Archivos
  archivos: ArchivoAdjuntoDTO[] = [];
  filesToUpload: File[] = [];
  nombreVisibleUpload = '';
  isDragging = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clienteService: ClienteService,
    private localService: LocalService,
    private contratoService: ContratoService,
    private presupuestoService: PresupuestoService,
    private gestorDocumentalService: GestorDocumentalService
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
        this.locales = (list || []).filter(
          (l: any) => (l.cliente?.idCliente ?? l.idCliente ?? l.clienteId) === id
        );
      },
      error: () => { },
    });
    this.contratoService.getAll().subscribe({
      next: (list) => {
        const id = this.idCliente;
        this.contratos = (list || [])
          .map((c: any) => ({
            ...c,
            idCliente: c.idCliente ?? c.cliente?.idCliente,
            idLocal: c.idLocal ?? c.local?.idLocal,
          }))
          .filter((c: any) => c.idCliente === id);
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

  localIdContrato(c: Contrato): number | null {
    const localId = (c as any).idLocal ?? (c as any).local?.idLocal;
    return typeof localId === 'number' ? localId : null;
  }

  getContratosPorLocal(idLocal: number): Contrato[] {
    return this.contratos.filter(c => (c.idLocal ?? (c as any).local?.idLocal) === idLocal);
  }

  setTab(tab: 'locales' | 'contratos' | 'presupuestos' | 'archivos'): void {
    this.activeTab = tab;
    if (tab === 'archivos') this.cargarArchivos();
  }

  irALocal(l: Local): void {
    if (!l.idLocal) {
      return;
    }
    this.router.navigate(['/locales', l.idLocal]);
  }

  irAContrato(c: Contrato): void {
    if (!c.idContrato) {
      return;
    }
    this.router.navigate(['/contratos', c.idContrato]);
  }

  irAPresupuesto(p: PresupuestoListItem): void {
    if (!p.idPresupuesto) {
      return;
    }
    this.router.navigate(['/presupuestos', p.idPresupuesto]);
  }

  // --- Gestión de Archivos (Gestor Documental) ---
  cargarArchivos(): void {
    if (!this.idCliente) return;
    this.gestorDocumentalService.listar('CLIENTE', this.idCliente).subscribe({
      next: (list) => this.archivos = list || [],
      error: () => { }
    });
  }

  onFileChange(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.filesToUpload = Array.from(input.files);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
    if (files.length) {
      this.filesToUpload = files;
    }
  }

  subirArchivos(): void {
    if (!this.idCliente || !this.filesToUpload.length) return;
    
    this.loading = true;
    const uploads = this.filesToUpload.map(f => 
      this.gestorDocumentalService.subir('CLIENTE', this.idCliente!, f)
    );

    Promise.all(uploads.map(u => u.toPromise()))
      .then(() => {
        Swal.fire('Subido', 'Archivos guardados correctamente.', 'success');
        this.filesToUpload = [];
        this.nombreVisibleUpload = '';
        this.cargarArchivos();
        this.loading = false;
      })
      .catch(() => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron subir los archivos.', 'error');
      });
  }

  descargarArchivo(a: ArchivoAdjuntoDTO): void {
    this.gestorDocumentalService.descargar(a.idArchivo, true).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = a.nombreOriginal || 'archivo';
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => Swal.fire('Error', 'No se pudo descargar el archivo.', 'error')
    });
  }

  verArchivo(a: ArchivoAdjuntoDTO): void {
    this.gestorDocumentalService.descargar(a.idArchivo, false).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 5000);
      },
      error: () => Swal.fire('Error', 'No se pudo abrir el archivo.', 'error')
    });
  }

  eliminarArchivo(a: ArchivoAdjuntoDTO): void {
    Swal.fire({
      title: '¿Eliminar archivo?',
      text: a.nombreOriginal,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.gestorDocumentalService.eliminar(a.idArchivo).subscribe({
          next: () => {
            Swal.fire('Eliminado', 'Archivo borrado.', 'success');
            this.cargarArchivos();
          },
          error: () => Swal.fire('Error', 'No se pudo eliminar.', 'error')
        });
      }
    });
  }

  getIconoArchivo(f: ArchivoAdjuntoDTO): string {
    const ext = f.nombreOriginal?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📕';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return '🖼️';
    if (['doc', 'docx'].includes(ext || '')) return '📘';
    if (['xls', 'xlsx'].includes(ext || '')) return '📗';
    if (ext === 'zip' || ext === 'rar') return '📦';
    return '📄';
  }

  formatSize(bytes?: number | null): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let idx = 0;
    while (size >= 1024 && idx < units.length - 1) {
      size /= 1024;
      idx++;
    }
    return `${size.toFixed(1)} ${units[idx]}`;
  }
}
