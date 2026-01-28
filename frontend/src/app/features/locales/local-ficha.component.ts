import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LocalService, ClienteService } from '../../services/domain.services';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-local-ficha',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    template: `
    <div class="mb-3">
       <a routerLink="/locales" class="btn btn-secondary">&larr; Volver</a>
    </div>

    <div class="card">
        <div class="card-header">Datos del Local</div>
        <div class="card-body">
            <form [formGroup]="form" (ngSubmit)="save()">
                <div class="row g-3">
                    <div class="col-md-12">
                        <label class="form-label">Cliente (ID)</label>
                        <input type="number" class="form-control" formControlName="idCliente">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Nombre Titular</label>
                        <input type="text" class="form-control" formControlName="nombreTitular">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Apellidos Titular</label>
                        <input type="text" class="form-control" formControlName="apellido1Titular">
                    </div>
                    <div class="col-md-12">
                        <label class="form-label">Dirección Completa</label>
                        <input type="text" class="form-control" formControlName="direccionCompleta">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">CUPS</label>
                        <input type="text" class="form-control" formControlName="cups">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Ref. Catastral</label>
                        <input type="text" class="form-control" formControlName="referenciaCatastral">
                    </div>
                    <div class="col-12 mt-4">
                        <button type="submit" class="btn btn-success" [disabled]="form.invalid">Guardar</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
  `
})
export class LocalFichaComponent implements OnInit {
    form: FormGroup;
    idLocal: number | null = null;

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private service: LocalService
    ) {
        this.form = this.fb.group({
            idCliente: [null, Validators.required],
            nombreTitular: ['', Validators.required],
            apellido1Titular: ['', Validators.required],
            direccionCompleta: ['', Validators.required],
            cups: [''],
            referenciaCatastral: ['']
        });
    }

    ngOnInit() {
        // Load if edit
    }

    save() {
        if (this.form.invalid) return;
        this.service.create(this.form.value).subscribe(() => {
            Swal.fire('Guardado', 'Local guardado correctamente', 'success');
        });
    }
}
