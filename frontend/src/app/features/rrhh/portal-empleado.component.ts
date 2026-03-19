import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RrhhService } from '../../services/rrhh.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-portal-empleado',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
       <h2 class="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Mi Portal (Ausencias y Vacaciones)</h2>

       <!-- Indicador de Saldo -->
       <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-center shadow-sm">
          <h3 class="text-lg font-semibold text-blue-800 mb-2">Días de Vacaciones Restantes (Mock)</h3>
          <div class="text-4xl font-extrabold text-blue-600">22 / 22</div>
          <p class="text-sm text-blue-500 mt-2">Correspondientes al año en curso</p>
       </div>

       <!-- Petición de Ausencia -->
       <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
           <h3 class="text-lg font-bold mb-4 border-b pb-2">Solicitar Nueva Ausencia</h3>
           <form [formGroup]="ausenciaForm" (ngSubmit)="solicitarAusencia()">
               
               <div class="mb-4">
                   <label class="block text-sm font-semibold mb-2">Tipo de Ausencia</label>
                   <select formControlName="tipo" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                       <option value="">Seleccione...</option>
                       <option value="VACACIONES">Vacaciones</option>
                       <option value="BAJA_MEDICA">Baja Médica</option>
                       <option value="ASUNTOS_PROPIOS">Asuntos Propios</option>
                   </select>
               </div>

               <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                   <div>
                       <label class="block text-sm font-semibold mb-2">Fecha de Inicio</label>
                       <input type="date" formControlName="fechaInicio" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                   </div>
                   <div>
                       <label class="block text-sm font-semibold mb-2">Fecha Fin</label>
                       <input type="date" formControlName="fechaFin" class="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none">
                   </div>
               </div>

               <div class="mb-6">
                   <label class="block text-sm font-semibold mb-2">Días Solicitados (hábiles)</label>
                   <input type="number" formControlName="diasSolicitados" min="1" class="w-full md:w-1/3 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none">
               </div>
               
               <div class="flex justify-end">
                 <button type="submit" 
                         class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow transition-colors"
                         [disabled]="ausenciaForm.invalid || enviando">
                    {{ enviando ? 'Enviando...' : 'Enviar Solicitud' }}
                 </button>
               </div>
           </form>
       </div>
    </div>
  `
})
export class PortalEmpleadoComponent {
  ausenciaForm: FormGroup;
  enviando = false;

  constructor(private fb: FormBuilder, private rrhhService: RrhhService) {
    this.ausenciaForm = this.fb.group({
      tipo: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      diasSolicitados: [1, [Validators.required, Validators.min(1)]]
    });
  }

  solicitarAusencia() {
    if (this.ausenciaForm.invalid) return;
    this.enviando = true;
    
    // In a real app we'd get the current user's ID
    const payload = {
      ...this.ausenciaForm.value,
      empleadoId: '00000000-0000-0000-0000-000000000000' // mock UUID
    };

    this.rrhhService.requestAbsence(payload).subscribe({
      next: () => {
        this.enviando = false;
        Swal.fire('Solicitud Enviada', 'La solicitud de ausencia ha sido registrada.', 'success');
        this.ausenciaForm.reset({ diasSolicitados: 1 });
      },
      error: (err) => {
        this.enviando = false;
        Swal.fire('Error', 'No se pudo registrar la solicitud: ' + (err.error?.message || err.message), 'error');
      }
    });
  }
}
