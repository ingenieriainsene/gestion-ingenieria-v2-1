import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { GestorDocumentalService, ArchivoAdjuntoDTO } from '../../services/gestor-documental.service';

@Component({
  selector: 'app-gestor-documental',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gestor-documental.component.html',
  styleUrls: ['./gestor-documental.component.css']
})
export class GestorDocumentalComponent implements OnInit {
  entidadTipo = 'TRAMITE';
  entidadId: number | null = null;
  archivos: ArchivoAdjuntoDTO[] = [];
  loading = false;
  isDragging = false;

  constructor(
    private service: GestorDocumentalService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const tipo = params.get('entidadTipo');
      const id = Number(params.get('entidadId'));
      if (tipo) this.entidadTipo = tipo.toUpperCase();
      this.entidadId = !isNaN(id) ? id : null;
      if (this.entidadId) {
        this.cargar();
      }
    });
  }

  cargar(): void {
    if (!this.entidadId) return;
    this.loading = true;
    this.service.listar(this.entidadTipo, this.entidadId).subscribe({
      next: (list) => {
        this.archivos = list || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los archivos.', 'error');
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) return;
    this.subirArchivos(files);
    input.value = '';
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
      this.subirArchivos(files);
    }
  }

  subirArchivos(files: File[]): void {
    if (!this.entidadId) return;
    const uploads = files.map(f => this.service.subir(this.entidadTipo, this.entidadId!, f));
    Promise.all(uploads.map(u => u.toPromise()))
      .then(() => {
        Swal.fire('Subido', 'Archivos guardados correctamente.', 'success');
        this.cargar();
      })
      .catch(() => Swal.fire('Error', 'No se pudieron subir los archivos.', 'error'));
  }

  verArchivo(a: ArchivoAdjuntoDTO): void {
    this.service.descargar(a.idArchivo, false).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 5000);
      },
      error: () => Swal.fire('Error', 'No se pudo abrir el archivo.', 'error')
    });
  }

  descargarArchivo(a: ArchivoAdjuntoDTO): void {
    this.service.descargar(a.idArchivo, true).subscribe({
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

  eliminarArchivo(a: ArchivoAdjuntoDTO): void {
    Swal.fire({
      title: '¿Eliminar archivo?',
      text: a.nombreOriginal,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e293b',
      cancelButtonText: 'Cancelar',
    }).then(res => {
      if (!res.isConfirmed) return;
      this.service.eliminar(a.idArchivo).subscribe({
        next: () => {
          Swal.fire('Eliminado', 'Archivo borrado.', 'success');
          this.cargar();
        },
        error: () => Swal.fire('Error', 'No se pudo eliminar el archivo.', 'error')
      });
    });
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
