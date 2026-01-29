import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ContratoService, Contrato } from '../../services/domain.services';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-contrato-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="d-flex justify-content-between align-items-center mb-3" style="margin-bottom: 25px;">
      <h1>Gestión de Contratos</h1>
      <a routerLink="/contratos/nuevo" class="btn-primary">+ Nuevo Contrato</a>
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>CLIENTE (FICHA)</th>
          <th>LOCAL (FICHA)</th>
          <th>TIPO</th>
          <th>ALTA</th>
          <th>VENCIMIENTO</th>
          <th style="text-align:right;">ACCIONES</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let c of contratos">
          <td><strong>#{{ c.idContrato }}</strong></td>
          <td>
            <a
              [routerLink]="['/clientes', c.cliente?.idCliente || c.idCliente]"
              class="maps-link"
              style="font-weight:bold;"
              title="Ver expediente completo del cliente"
            >
              👤 {{ c.cliente?.nombre }} {{ c.cliente?.apellido1 }}
            </a>
          </td>
          <td>
            <a
              [routerLink]="['/locales', c.local?.idLocal || c.idLocal]"
              class="maps-link"
              title="Ver historial técnico de esta ubicación"
            >
              🏢 {{ c.local?.direccionCompleta }}
            </a>
          </td>
          <td>{{ c.tipoContrato }}</td>
          <td>{{ c.fechaAlta || c.fechaInicio | date:'dd/MM/yyyy' }}</td>
          <td>{{ c.fechaVencimiento | date:'dd/MM/yyyy' }}</td>
          <td style="text-align:right; white-space:nowrap;">
            <a
              [routerLink]="['/contratos', c.idContrato]"
              class="action-badge"
              title="Gestionar contrato (intervenciones, documentos, notas)"
              style="margin-right:6px; background:#0f172a; color:white;"
            >👁️</a>
            <a
              [routerLink]="['/contratos', c.idContrato, 'tramites']"
              class="action-badge badge-edit"
              title="Ver listado simple de trámites"
            >✏️</a>
            <button
              class="action-badge badge-delete"
              style="border:none; cursor:pointer;"
              (click)="eliminar(c)"
              title="Eliminar contrato"
            >🗑️</button>
          </td>
        </tr>
        <tr *ngIf="contratos.length === 0">
          <td colspan="7" style="text-align:center; padding:40px; color:#64748b;">
            No se encontraron contratos.
          </td>
        </tr>
      </tbody>
    </table>
  `
})
export class ContratoListComponent implements OnInit {
    contratos: Contrato[] = [];
    constructor(private service: ContratoService) { }

    ngOnInit() { this.service.getAll().subscribe(data => this.contratos = data); }

    eliminar(c: Contrato) {
        if (!c.idContrato) return;
        Swal.fire({
            title: '¿Eliminar contrato?',
            text: `¿Seguro que deseas eliminar el contrato #${c.idContrato}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#1e293b',
            cancelButtonText: 'Cancelar',
        }).then((res) => {
            if (!res.isConfirmed) return;
            this.service.delete(c.idContrato!).subscribe({
                next: () => {
                    this.contratos = this.contratos.filter(x => x.idContrato !== c.idContrato);
                    Swal.fire('Eliminado', 'Contrato borrado correctamente.', 'success');
                },
                error: () => Swal.fire('Error', 'No se pudo eliminar el contrato.', 'error'),
            });
        });
    }
}
