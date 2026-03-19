import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-control-horario',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-6">Control Horario - Fichajes</h2>
      <div class="bg-white shadow rounded p-4">
        <p class="text-gray-500 mb-4">Vista administrativa de los registros de fichaje de todos los empleados.</p>
        
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-100 border-b">
              <th class="p-3 text-left">Empleado (ID)</th>
              <th class="p-3 text-left">Fecha</th>
              <th class="p-3 text-left">Hora Entrada</th>
              <th class="p-3 text-left">Hora Salida</th>
              <th class="p-3 text-left">Pausa (min)</th>
              <th class="p-3 text-left">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="6" class="p-4 text-center text-gray-500 italic">No hay registros cargados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ControlHorarioComponent implements OnInit {
  ngOnInit() {
    // Fetches would happen here.
  }
}
