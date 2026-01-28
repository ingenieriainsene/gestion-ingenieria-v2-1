import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LocalService, Local } from '../../services/domain.services';

@Component({
    selector: 'app-local-list',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule],
    template: `
    <div class="d-flex justify-content-between align-items-center mb-3" style="margin-bottom: 25px;">
      <h1>Gestión de Locales</h1>
      <a routerLink="/locales/nuevo" class="btn-primary">+ Nuevo Local</a>
    </div>

    <div style="display: flex; gap: 10px; margin-bottom: 25px;">
      <input
        type="text"
        [(ngModel)]="filtro"
        (ngModelChange)="aplicarFiltro()"
        placeholder="Buscar por dirección, titular, CUPS o Referencia..."
        style="flex-grow: 1; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;"
      />
      <button class="btn-primary" (click)="aplicarFiltro()">Filtrar</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>DIRECCIÓN (MAPA)</th>
          <th>CUPS</th>
          <th>REF. CATASTRAL</th>
          <th>TITULAR</th>
          <th>DNI TITULAR</th>
          <th>FECHA ALTA</th>
          <th style="text-align: right;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let l of filtrados">
          <td><strong>#{{ l.idLocal }}</strong></td>
          <td>
            <small>
              <a
                class="maps-link"
                target="_blank"
                [href]="buildMapsUrl(l.direccionCompleta)"
              >
                📍 {{ l.direccionCompleta }}
              </a>
            </small>
          </td>
          <td><code>{{ l.cups || '---' }}</code></td>
          <td>
            <ng-container *ngIf="l.referenciaCatastral; else noRc">
              <a
                class="catastro-link"
                target="_blank"
                [href]="buildCatastroUrl(l.referenciaCatastral!)"
              >
                📑 {{ l.referenciaCatastral }}
              </a>
            </ng-container>
            <ng-template #noRc>
              <span style="color:#94a3b8;">---</span>
            </ng-template>
          </td>
          <td>{{ l.apellido1Titular }} {{ l.apellido2Titular || '' }}, {{ l.nombreTitular }}</td>
          <td><code style="background:#f1f5f9;">{{ l.dniTitular || '---' }}</code></td>
          <td><small>{{ l.fechaAlta | date:'dd/MM/yyyy' }}</small></td>
          <td style="text-align: right; white-space: nowrap;">
            <a
              [routerLink]="['/locales', l.idLocal]"
              class="action-badge"
              style="background:#3498db;"
              title="Ver ficha técnica"
            >👁️</a>
            <a
              [routerLink]="['/locales', l.idLocal]"
              class="action-badge badge-edit"
              title="Editar local"
            >✏️</a>
            <button
              class="action-badge badge-delete"
              style="border:none; cursor:pointer;"
              title="Eliminar"
              (click)="eliminar(l)"
            >🗑️</button>
          </td>
        </tr>
        <tr *ngIf="filtrados.length === 0">
          <td colspan="8" style="text-align:center; padding:40px; color:#64748b;">
            No se encontraron locales con los criterios de búsqueda.
          </td>
        </tr>
      </tbody>
    </table>
  `
})
export class LocalListComponent implements OnInit {
    locales: Local[] = [];
    filtrados: Local[] = [];
    filtro = '';

    constructor(private service: LocalService) { }

    ngOnInit() {
        this.service.getAll().subscribe(data => {
            this.locales = data;
            this.filtrados = data;
        });
    }

    aplicarFiltro() {
        const term = this.filtro.trim().toLowerCase();
        if (!term) {
            this.filtrados = this.locales;
            return;
        }
        this.filtrados = this.locales.filter(l =>
            (l.direccionCompleta && l.direccionCompleta.toLowerCase().includes(term)) ||
            (l.nombreTitular && l.nombreTitular.toLowerCase().includes(term)) ||
            (l.apellido1Titular && l.apellido1Titular.toLowerCase().includes(term)) ||
            (l.cups && l.cups.toLowerCase().includes(term)) ||
            (l.referenciaCatastral && l.referenciaCatastral.toLowerCase().includes(term))
        );
    }

    eliminar(l: Local) {
        if (!l.idLocal) return;
        if (!confirm(`¿Eliminar el local #${l.idLocal}? Se borrarán también sus contratos asociados.`)) {
            return;
        }
        this.service.delete(l.idLocal).subscribe(() => {
            this.locales = this.locales.filter(x => x.idLocal !== l.idLocal);
            this.aplicarFiltro();
        });
    }

    buildCatastroUrl(fullRc: string): string {
        const rc14 = fullRc.substring(0, 14);
        return `https://www1.sedecatastro.gob.es/Cartografia/mapa.aspx?refcat=${encodeURIComponent(rc14)}&RCCompleta=${encodeURIComponent(fullRc)}&from=OVCBusqueda&pest=rc`;
    }

    buildMapsUrl(direccion: string): string {
        return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(direccion || '');
    }
}
