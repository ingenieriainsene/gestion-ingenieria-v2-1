import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClienteService } from '../../services/domain.services';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-cliente-ficha',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    template: `
    <div class="mb-3">
       <a routerLink="/clientes" class="direct-link">&larr; Volver al listado</a>
    </div>

    <div class="main-container">
        <h1>{{ idCliente ? 'Editar Cliente' : 'Nuevo Cliente' }}</h1>
        <form [formGroup]="form" (ngSubmit)="save()">
            <div class="row g-3">
                <div class="col-md-4">
                    <label class="form-label">Nombre</label>
                    <input type="text" class="form-control" formControlName="nombre">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Primer Apellido</label>
                    <input type="text" class="form-control" formControlName="apellido1">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Segundo Apellido</label>
                    <input type="text" class="form-control" formControlName="apellido2">
                </div>
                <div class="col-md-4">
                    <label class="form-label">DNI/CIF</label>
                    <input type="text" class="form-control" formControlName="dni">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Código Postal</label>
                    <input type="text" class="form-control" formControlName="codigoPostal">
                </div>
                <div class="col-md-8">
                    <label class="form-label">Dirección fiscal completa</label>
                    <input type="text" class="form-control" formControlName="direccionFiscalCompleta">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Cuenta bancaria (IBAN)</label>
                    <input type="text" class="form-control" formControlName="cuentaBancaria">
                </div>
                <div class="col-12 mt-4">
                    <button type="submit" class="btn-primary" [disabled]="form.invalid">Guardar</button>
                </div>
            </div>
        </form>
    </div>
  `
})
export class ClienteFichaComponent implements OnInit {
    form: FormGroup;
    idCliente: number | null = null;

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private service: ClienteService,
        private router: Router
    ) {
        this.form = this.fb.group({
            nombre: ['', Validators.required],
            apellido1: ['', Validators.required],
            apellido2: [''],
            dni: ['', Validators.required],
            codigoPostal: [''],
            direccionFiscalCompleta: [''],
            cuentaBancaria: ['']
        });
    }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id && id !== 'nuevo') {
            this.idCliente = +id;
            this.service.getById(this.idCliente).subscribe(cliente => {
                this.form.patchValue(cliente);
            });
        }
    }

    save() {
        if (this.form.invalid) return;
        const value = this.form.value;
        if (this.idCliente) {
            this.service.update(this.idCliente, value).subscribe(() => {
                Swal.fire('Guardado', 'Cliente actualizado correctamente', 'success')
                    .then(() => this.router.navigate(['/clientes']));
            });
        } else {
            this.service.create(value).subscribe(() => {
                Swal.fire('Guardado', 'Cliente guardado correctamente', 'success')
                    .then(() => this.router.navigate(['/clientes']));
            });
        }
    }
}
