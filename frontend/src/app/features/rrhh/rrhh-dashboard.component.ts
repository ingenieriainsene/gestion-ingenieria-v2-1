import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rrhh-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4">
      <h2 class="text-2xl font-bold mb-4">Dashboard de Recursos Humanos</h2>
      <p class="text-gray-600">Bienvenido al panel de gestión de RRHH. Seleccione una opción del menú lateral.</p>
    </div>
  `
})
export class RrhhDashboardComponent {}
