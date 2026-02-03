import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Producto } from '../../models/producto.model';
import { ProductoService } from '../../services/producto.service';

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="mb-3">
      <a routerLink="/productos" class="direct-link">← Volver al listado</a>
    </div>

    <h2>{{ esNuevo ? 'Nuevo Producto' : 'Editar Producto' }}</h2>

    <form (ngSubmit)="guardar()" #formRef="ngForm" class="mt-3">
      <div class="mb-3">
        <label class="form-label">Código de referencia</label>
        <input
          type="text"
          class="form-control"
          name="codRef"
          [(ngModel)]="modelo.codRef"
          required
        />
      </div>

      <div class="mb-3">
        <label class="form-label">Descripción</label>
        <input
          type="text"
          class="form-control"
          name="descripcion"
          [(ngModel)]="modelo.descripcion"
          required
        />
      </div>

      <div class="mb-3">
        <label class="form-label">Categoría</label>
        <input
          type="text"
          class="form-control"
          name="categoria"
          [(ngModel)]="modelo.categoria"
        />
      </div>

      <div class="mb-3">
        <label class="form-label">Coste</label>
        <input
          type="number"
          class="form-control"
          name="coste"
          [(ngModel)]="modelo.coste"
          step="0.01"
          required
        />
      </div>

      <button type="submit" class="btn-primary" [disabled]="formRef.invalid">
        Guardar
      </button>
    </form>
  `,
})
export class ProductoFormComponent implements OnInit {
  modelo: Producto = {
    codRef: '',
    descripcion: '',
    coste: 0,
    categoria: '',
  };
  esNuevo = true;

  constructor(
    private productoService: ProductoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'nuevo') {
      this.esNuevo = false;
      this.productoService.getById(+id).subscribe((p) => {
        this.modelo = { ...p };
      });
    }
  }

  guardar(): void {
    if (this.esNuevo) {
      this.productoService.create(this.modelo).subscribe(() => {
        this.router.navigate(['/productos']);
      });
    } else if (this.modelo.id) {
      this.productoService
        .update(this.modelo.id, this.modelo)
        .subscribe(() => this.router.navigate(['/productos']));
    }
  }
}
