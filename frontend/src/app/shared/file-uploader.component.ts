import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentService, CrmDocument } from '../services/document.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-file-uploader',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="uploader-container">
      <div class="upload-controls">
        <input type="file" multiple #fileInput (change)="onFileSelected($event)" style="display: none">
        <button class="btn-upload" (click)="fileInput.click()">
          📂 Adjuntar Archivos
        </button>
        <div *ngIf="selectedFiles.length > 0" class="selected-files">
            <span *ngFor="let f of selectedFiles" class="badge-file">{{ f.name }}</span>
        </div>
        <button *ngIf="selectedFiles.length > 0" class="btn-save" (click)="upload()" [disabled]="uploading">
          {{ uploading ? 'Subiendo...' : 'Guardar Todo' }}
        </button>
      </div>
      
      <div class="location-info" *ngIf="storageLocation">
        <small>📂 Ubicación física: {{ storageLocation }}</small>
      </div>

      <div class="file-list" *ngIf="documents.length > 0">
        <h4>Archivos Adjuntos ({{ documents.length }})</h4>
        <ul>
            <li *ngFor="let doc of documents">
                <div class="file-info">
                    <span class="file-name">{{ doc.fileNameOriginal }}</span>
                    <span class="file-meta">{{ formatSize(doc.size) }} - {{ doc.uploadedAt | date:'short' }}</span>
                </div>
                <div class="actions">
                    <a [href]="getDownloadUrl(doc.id)" target="_blank" class="btn-download" title="Descargar">⬇️</a>
                    <button class="btn-delete" (click)="deleteFile(doc)" title="Eliminar">🗑️</button>
                </div>
            </li>
        </ul>
      </div>
      <p *ngIf="documents.length === 0" class="no-files">No hay archivos adjuntos.</p>
    </div>
  `,
    styles: [`
    .uploader-container {
        border: 1px solid #e2e8f0;
        padding: 15px;
        border-radius: 8px;
        background: #f8fafc;
    }
    .upload-controls {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 5px;
    }
    .selected-files { display: flex; flex-wrap: wrap; gap: 5px; margin: 5px 0; }
    .badge-file { background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; }
    
    .location-info { margin-bottom: 15px; color: #64748b; font-style: italic; font-size: 0.75rem; border-bottom: 1px dashed #cbd5e1; padding-bottom: 5px; }

    .btn-upload {
        background: #3b82f6; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; width: fit-content;
    }
    .btn-save {
        background: #10b981; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; width: fit-content;
    }
    .btn-save:disabled { opacity: 0.6; cursor: wait; }
    
    .file-list h4 { margin: 0 0 10px 0; font-size: 0.9rem; color: #475569; }
    ul { list-style: none; padding: 0; margin: 0; }
    li {
        display: flex; justify-content: space-between; align-items: center;
        padding: 8px; border-bottom: 1px solid #e2e8f0; background: white;
    }
    li:last-child { border-bottom: none; }
    .file-info { display: flex; flex-direction: column; }
    .file-name { font-weight: 600; color: #1e293b; font-size: 0.9rem; }
    .file-meta { font-size: 0.75rem; color: #64748b; }
    
    .actions { display: flex; gap: 8px; align-items: center; }

    .btn-download {
        text-decoration: none; background: #e2e8f0; padding: 6px 10px; border-radius: 4px; font-size: 0.9rem; color: #334155; border: 1px solid #cbd5e1;
    }
    .btn-download:hover { background: #cbd5e1; }
    
    .btn-delete {
        background: #fee2e2; color: #ef4444; border: 1px solid #fecaca; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.9rem;
    }
    .btn-delete:hover { background: #fecaca; }

    .no-files { color: #94a3b8; font-style: italic; font-size: 0.9rem; margin: 0; }
  `]
})
export class FileUploaderComponent implements OnInit {
    @Input() referenceId!: number;
    @Input() entityType!: string;

    documents: CrmDocument[] = [];
    selectedFiles: File[] = [];
    uploading = false;
    storageLocation = '';

    constructor(private documentService: DocumentService) { }

    ngOnInit(): void {
        if (this.referenceId && this.entityType) {
            this.loadDocuments();
            this.loadLocation();
        }
    }

    loadLocation() {
        this.documentService.getLocation().subscribe((loc: string) => this.storageLocation = loc);
    }

    loadDocuments() {
        this.documentService.list(this.entityType, this.referenceId).subscribe({
            next: (docs: CrmDocument[]) => this.documents = docs,
            error: (err: any) => console.error('Error al cargar documentos', err)
        });
    }

    onFileSelected(event: any) {
        if (event.target.files && event.target.files.length > 0) {
            this.selectedFiles = Array.from(event.target.files);
        }
    }

    upload() {
        if (this.selectedFiles.length === 0) return;
        this.uploading = true;
        this.documentService.upload(this.selectedFiles, this.referenceId, this.entityType).subscribe({
            next: (newDocs: CrmDocument[]) => {
                this.documents.push(...newDocs);
                this.selectedFiles = [];
                this.uploading = false;
                Swal.fire('Éxito', 'Archivos subidos correctamente', 'success');
            },
            error: (err: any) => {
                console.error('Error subiendo archivo', err);
                this.uploading = false;
                Swal.fire('Error', 'No se pudieron subir los archivos', 'error');
            }
        });
    }

    deleteFile(doc: CrmDocument) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: `Vas a eliminar el archivo "${doc.fileNameOriginal}". Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                this.documentService.delete(doc.id).subscribe({
                    next: () => {
                        this.documents = this.documents.filter(d => d.id !== doc.id);
                        Swal.fire('Eliminado', 'El archivo ha sido eliminado.', 'success');
                    },
                    error: (err) => {
                        console.error('Error al eliminar archivo', err);
                        Swal.fire('Error', 'No se pudo eliminar el archivo.', 'error');
                    }
                });
            }
        });
    }

    getDownloadUrl(id: string): string {
        return this.documentService.downloadUrl(id);
    }

    formatSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
