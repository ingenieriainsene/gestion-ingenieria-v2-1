import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TecnicoInstalador, TecnicoInstaladorService } from '../../services/tecnico-instalador.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-tecnico-instalador-ficha',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="container">
      <div class="header">
        <button routerLink="/tecnicos-instaladores" class="btn-back">⬅️ Volver</button>
        <h2>{{ editMode ? 'Editar' : 'Nuevo' }} Técnico Instalador</h2>
      </div>

      <div class="card">
        <form (ngSubmit)="guardar()" #f="ngForm">
          <div class="form-group">
            <label>Nombre Completo*</label>
            <input type="text" name="nombre" [(ngModel)]="tecnico.nombre" required placeholder="Ej: Juan Pérez">
          </div>

          <div class="form-group">
            <label>Teléfono</label>
            <input type="text" name="telefono" [(ngModel)]="tecnico.telefono" placeholder="Ej: 600111222">
          </div>

          <div class="form-group row">
            <label class="checkbox-container">
              <input type="checkbox" name="activo" [(ngModel)]="tecnico.activo">
              <span class="checkmark"></span>
              Técnico Activo
            </label>
          </div>

          <div class="actions">
            <button type="submit" [disabled]="f.invalid" class="btn-save">
              {{ editMode ? 'Actualizar' : 'Crear' }} Instalador
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
    styles: [`
    .container { max-width: 600px; margin: 0 auto; animation: fadeIn 0.3s ease; }
    .header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
    h2 { margin: 0; color: #1e293b; }
    .btn-back { background: none; border: none; color: #64748b; cursor: pointer; font-weight: 600; }
    .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .form-group { margin-bottom: 1.5rem; }
    label { display: block; margin-bottom: 0.5rem; color: #475569; font-weight: 500; }
    input[type="text"] {
      width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem;
    }
    .checkbox-container { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; position: relative; padding-left: 35px; user-select: none; }
    .checkbox-container input { position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0; }
    .checkmark { position: absolute; top: 0; left: 0; height: 25px; width: 25px; background-color: #eee; border-radius: 4px; }
    .checkbox-container:hover input ~ .checkmark { background-color: #ccc; }
    .checkbox-container input:checked ~ .checkmark { background-color: #2196F3; }
    .checkmark:after { content: ""; position: absolute; display: none; }
    .checkbox-container input:checked ~ .checkmark:after { display: block; }
    .checkbox-container .checkmark:after { left: 9px; top: 5px; width: 5px; height: 10px; border: solid white; border-width: 0 3px 3px 0; transform: rotate(45deg); }
    .btn-save {
      width: 100%; padding: 1rem; background: #2563eb; color: white; border: none;
      border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s;
    }
    .btn-save:disabled { background: #94a3b8; cursor: not-allowed; }
    .btn-save:hover:not(:disabled) { background: #1d4ed8; }
    @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class TecnicoInstaladorFichaComponent implements OnInit {
    tecnico: TecnicoInstalador = { nombre: '', activo: true };
    editMode = false;

    constructor(
        private service: TecnicoInstaladorService,
        private router: Router,
        private route: ActivatedRoute
    ) { }

    ngOnInit() {
        const id = this.route.snapshot.params['id'];
        if (id) {
            this.editMode = true;
            this.service.getById(+id).subscribe(data => this.tecnico = data);
        }
    }

    guardar() {
        const obs = this.editMode
            ? this.service.update(this.tecnico.idTecnicoInstalador!, this.tecnico)
            : this.service.create(this.tecnico);

        obs.subscribe({
            next: () => {
                Swal.fire('Éxito', 'Técnico guardado correctamente', 'success');
                this.router.navigate(['/tecnicos-instaladores']);
            },
            error: () => Swal.fire('Error', 'No se pudo guardar el técnico', 'error')
        });
    }
}
