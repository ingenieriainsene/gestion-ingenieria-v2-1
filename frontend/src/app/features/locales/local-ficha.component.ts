import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LocalService } from '../../services/domain.services';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-local-ficha',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    template: `
    <div class="mb-3">
       <a [routerLink]="idLocal ? ['/locales', idLocal] : ['/locales']" class="direct-link">
         &larr; {{ idLocal ? 'Volver a la ficha' : 'Volver al listado' }}
       </a>
    </div>

    <div class="main-container">
        <h1>{{ idLocal ? 'Editar Local' : 'Nuevo Local' }}</h1>
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
                    <label class="form-label">Apellido1 Titular</label>
                    <input type="text" class="form-control" formControlName="apellido1Titular">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Apellido2 Titular</label>
                    <input type="text" class="form-control" formControlName="apellido2Titular">
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
                    <button type="submit" class="btn-primary" [disabled]="form.invalid">Guardar</button>
                </div>
            </div>
        </form>
    </div>
  `
})
export class LocalFichaComponent implements OnInit {
    form: FormGroup;
    idLocal: number | null = null;

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private service: LocalService
    ) {
        this.form = this.fb.group({
            idCliente: [null, Validators.required],
            nombreTitular: ['', Validators.required],
            apellido1Titular: ['', Validators.required],
            apellido2Titular: [''],
            direccionCompleta: ['', Validators.required],
            cups: [''],
            referenciaCatastral: ['']
        });
    }

    ngOnInit() {
        this.route.paramMap.subscribe((params) => {
            const id = params.get('id');
            if (id && id !== 'nuevo') {
                this.idLocal = +id;
                this.service.getById(this.idLocal).subscribe({
                    next: (l: any) => {
                        this.form.patchValue({
                            idCliente: l.cliente?.idCliente ?? l.idCliente,
                            nombreTitular: l.nombreTitular,
                            apellido1Titular: l.apellido1Titular,
                            apellido2Titular: l.apellido2Titular ?? '',
                            direccionCompleta: l.direccionCompleta,
                            cups: l.cups ?? '',
                            referenciaCatastral: l.referenciaCatastral ?? ''
                        });
                    },
                    error: () => this.router.navigate(['/locales'])
                });
            } else {
                this.idLocal = null;
            }
        });
    }

    save() {
        if (this.form.invalid) return;
        const v = this.form.value;
        const payload = {
            idCliente: v.idCliente,
            nombreTitular: v.nombreTitular,
            apellido1Titular: v.apellido1Titular,
            apellido2Titular: v.apellido2Titular || null,
            direccionCompleta: v.direccionCompleta,
            cups: v.cups || null,
            referenciaCatastral: v.referenciaCatastral || null
        };
        if (this.idLocal) {
            this.service.update(this.idLocal, payload).subscribe({
                next: () => {
                    Swal.fire('Guardado', 'Local actualizado correctamente', 'success');
                    this.router.navigate(['/locales', this.idLocal]);
                },
                error: (e) => Swal.fire('Error', e?.error?.message || 'No se pudo actualizar.', 'error')
            });
        } else {
            this.service.create(payload as any).subscribe({
                next: (loc) => {
                    Swal.fire('Guardado', 'Local creado correctamente', 'success');
                    this.router.navigate(loc?.idLocal ? ['/locales', loc.idLocal] : ['/locales']);
                },
                error: (e) => Swal.fire('Error', e?.error?.message || 'No se pudo crear.', 'error')
            });
        }
    }
}
