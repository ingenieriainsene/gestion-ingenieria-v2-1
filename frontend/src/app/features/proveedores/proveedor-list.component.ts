import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProveedorService } from '../../services/proveedor.service';

@Component({
    selector: 'app-proveedor-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2>Proveedores</h2>
      <a routerLink="/proveedores/nuevo" class="btn btn-primary">+ Nuevo</a>
    </div>
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Nombre Comercial</th>
          <th>Razón Social</th>
          <th>CIF</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let p of proveedores">
          <td>{{ p.nombreComercial }}</td>
          <td>{{ p.razonSocial }}</td>
          <td>{{ p.cif }}</td>
          <td>
            <a [routerLink]="['/proveedores', p.idProveedor]" class="btn btn-sm btn-info">Editar</a>
          </td>
        </tr>
      </tbody>
    </table>
  `
})
export class ProveedorListComponent implements OnInit {
    proveedores: any[] = [];

    constructor(private service: ProveedorService) { }

    ngOnInit() {
        this.service.getAll().subscribe(data => this.proveedores = data);
    }
}
