import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProveedorService } from '../../services/proveedor.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-proveedor-ficha',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    template: `
    <div class="mb-3">
       <a routerLink="/proveedores" class="btn btn-secondary">&larr; Volver</a>
    </div>

    <div class="card">
        <div class="card-header">
            <ul class="nav nav-tabs card-header-tabs">
                <li class="nav-item">
                    <button class="nav-link" [class.active]="activeTab === 'general'" (click)="activeTab = 'general'">General</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" [class.active]="activeTab === 'oficios'" (click)="activeTab = 'oficios'" [disabled]="!idProveedor">Oficios</button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" [class.active]="activeTab === 'contactos'" (click)="activeTab = 'contactos'" [disabled]="!idProveedor">Contactos</button>
                </li>
            </ul>
        </div>
        <div class="card-body">
            
            <!-- TAB GENERAL -->
            <div *ngIf="activeTab === 'general'">
                <form [formGroup]="form" (ngSubmit)="saveGeneral()">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Nombre Comercial</label>
                            <input type="text" class="form-control" formControlName="nombreComercial">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">CIF</label>
                            <input type="text" class="form-control" formControlName="cif">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Razón Social</label>
                            <input type="text" class="form-control" formControlName="razonSocial">
                        </div>
                         <div class="col-md-12">
                            <label class="form-label">Dirección Fiscal</label>
                            <input type="text" class="form-control" formControlName="direccionFiscal">
                        </div>
                        <div class="col-md-6">
                            <div class="form-check mt-3">
                                <input class="form-check-input" type="checkbox" formControlName="esAutonomo">
                                <label class="form-check-label">Es Autónomo</label>
                            </div>
                        </div>
                        <div class="col-12 mt-4">
                            <button type="submit" class="btn btn-success" [disabled]="form.invalid">Guardar</button>
                        </div>
                    </div>
                </form>
            </div>

            <!-- TAB OFICIOS -->
            <div *ngIf="activeTab === 'oficios'">
                <p>Gestión de Oficios (Implementación pendiente en demo)</p>
                <ul>
                    <li *ngFor="let o of oficiosList">{{ o.nombre }} <button class="btn btn-sm btn-danger">X</button></li>
                </ul>
            </div>

            <!-- TAB CONTACTOS -->
            <div *ngIf="activeTab === 'contactos'">
                <p>Gestión de Contactos (Implementación pendiente en demo)</p>
            </div>

        </div>
    </div>
  `
})
export class ProveedorFichaComponent implements OnInit {
    activeTab = 'general';
    form: FormGroup;
    idProveedor: number | null = null;
    oficiosList: any[] = [];

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private service: ProveedorService
    ) {
        this.form = this.fb.group({
            nombreComercial: ['', Validators.required],
            cif: ['', Validators.required],
            razonSocial: [''],
            direccionFiscal: [''],
            esAutonomo: [false]
        });
    }

    ngOnInit() {
        this.route.params.subscribe(params => {
            if (params['id']) {
                this.idProveedor = +params['id'];
                this.loadData();
            }
        });
    }

    loadData() {
        if (!this.idProveedor) return;
        this.service.getById(this.idProveedor).subscribe(data => {
            this.form.patchValue(data);
            // Load relations...
        });
    }

    saveGeneral() {
        if (this.form.invalid) return;

        const payload = this.form.value;
        if (this.idProveedor) {
            this.service.update(this.idProveedor, payload).subscribe(() => {
                Swal.fire('Guardado', 'Datos actualizados', 'success');
            });
        } else {
            this.service.create(payload).subscribe((resp) => {
                this.idProveedor = resp.idProveedor;
                Swal.fire('Creado', 'Proveedor creado, ahora puedes añadir oficios', 'success');
            });
        }
    }
}
