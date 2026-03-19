import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RrhhService, EmpleadoResponse } from '../../services/rrhh.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-empleado-lista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card p-4">
      <div class="flex justify-between items-center mb-4 border-b pb-2">
        <h2 class="text-xl font-bold">Gestión de Plantilla (RRHH)</h2>
        <button class="btn btn-primary" (click)="toggleForm()">
          + Nuevo Empleado
        </button>
      </div>

      <!-- Formulario de Alta -->
      <div *ngIf="showForm" class="bg-gray-50 p-4 border rounded mb-4 shadow-sm">
        <h3 class="font-bold mb-3 border-b pb-2">Alta de Empleado</h3>
        <form [formGroup]="empForm" (ngSubmit)="darAlta()">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
            <div>
              <label class="block text-sm font-semibold mb-1">Nombre Completo</label>
              <input type="text" formControlName="nombreCompleto" class="form-control w-full p-2 border rounded">
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">DNI/NIE</label>
              <input type="text" formControlName="dniNie" class="form-control w-full p-2 border rounded">
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Puesto</label>
              <input type="text" formControlName="puesto" class="form-control w-full p-2 border rounded">
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Fecha Alta</label>
              <input type="date" formControlName="fechaAlta" class="form-control w-full p-2 border rounded">
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-2">
            <button type="button" class="btn btn-secondary px-3 py-1 bg-gray-200 rounded" (click)="toggleForm()">Cancelar</button>
            <button type="submit" class="btn btn-success px-3 py-1 bg-green-600 text-white rounded font-semibold" [disabled]="empForm.invalid">Guardar Alta</button>
          </div>
        </form>
      </div>

      <!-- Tabla de Empleados (Mocked for demo as fetch is usually customized) -->
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white border border-gray-200">
          <thead class="bg-gray-100 border-b">
            <tr>
              <th class="py-2 px-4 text-left font-semibold">Nombre Completo</th>
              <th class="py-2 px-4 text-left font-semibold">DNI/NIE</th>
              <th class="py-2 px-4 text-left font-semibold">Puesto</th>
              <th class="py-2 px-4 text-left font-semibold">Estado</th>
              <th class="py-2 px-4 text-center font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngIf="empleados.length === 0">
              <td colspan="5" class="py-4 text-center text-gray-500">No hay empleados registrados o cargando...</td>
            </tr>
            <tr *ngFor="let emp of empleados" class="border-b hover:bg-gray-50">
              <td class="py-2 px-4">{{ emp.nombreCompleto }}</td>
              <td class="py-2 px-4">{{ emp.dniNie }}</td>
              <td class="py-2 px-4">{{ emp.puesto }}</td>
              <td class="py-2 px-4">
                <span class="px-2 py-1 rounded text-xs font-bold" 
                      [ngClass]="emp.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                  {{ emp.estado }}
                </span>
              </td>
              <td class="py-2 px-4 flex justify-center gap-2">
                <button *ngIf="emp.estado === 'ACTIVO'" 
                        class="bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold hover:bg-red-600" 
                        (click)="confirmBaja(emp.id)">
                  Dar Baja
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class EmpleadoListaComponent implements OnInit {
  empleados: EmpleadoResponse[] = [];
  showForm = false;
  empForm: FormGroup;

  constructor(private fb: FormBuilder, private rrhhService: RrhhService) {
    this.empForm = this.fb.group({
      nombreCompleto: ['', Validators.required],
      dniNie: ['', Validators.required],
      puesto: ['', Validators.required],
      fechaAlta: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // In a real scenario, we would load the list here
    // this.loadEmpleados();
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (this.showForm) this.empForm.reset();
  }

  darAlta() {
    if (this.empForm.invalid) return;
    this.rrhhService.onboardEmployee(this.empForm.value).subscribe({
      next: (res) => {
        Swal.fire('Éxito', 'Empleado dado de alta.', 'success');
        this.empleados.push(res);
        this.showForm = false;
      },
      error: () => Swal.fire('Error', 'No se pudo crear el empleado.', 'error')
    });
  }

  confirmBaja(id: string) {
    Swal.fire({
      title: '¿Dar de baja?',
      text: 'El empleado pasará a estado INACTIVO.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar'
    }).then(res => {
      if (res.isConfirmed) {
        this.rrhhService.offboardEmployee(id).subscribe({
          next: () => {
            Swal.fire('Baja tramitada', 'Empleado inactivado.', 'success');
            const e = this.empleados.find(x => x.id === id);
            if(e) e.estado = 'INACTIVO';
          },
          error: () => Swal.fire('Error', 'No se pudo tramitar la baja.', 'error')
        });
      }
    });
  }
}
