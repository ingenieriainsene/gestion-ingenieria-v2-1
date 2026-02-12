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
    <div class="ficha-wrapper">
      <div class="header-section">
        <a routerLink="/productos" class="back-link">
          <span class="icon">←</span> Volver al listado
        </a>
        <h2>{{ esNuevo ? 'Nuevo Producto' : 'Editar Producto' }}</h2>
        <p class="subtitle">Gestión del catálogo de productos y servicios.</p>
      </div>

      <div class="form-card">
        <form (ngSubmit)="guardar()" #formRef="ngForm" class="modern-form">
          <div class="form-grid">
            <!-- Código -->
            <div class="form-group">
              <label class="form-label">Código de Referencia <span class="required">*</span></label>
              <div class="input-wrapper">
                <span class="input-icon">🔖</span>
                <input
                  type="text"
                  class="form-control"
                  name="codRef"
                  [(ngModel)]="modelo.codRef"
                  required
                  placeholder="Ej. MAT-001"
                />
              </div>
            </div>

            <!-- Categoría -->
            <div class="form-group">
              <label class="form-label">Categoría</label>
              <div class="input-wrapper">
                <span class="input-icon">📂</span>
                <input
                  type="text"
                  class="form-control"
                  name="categoria"
                  [(ngModel)]="modelo.categoria"
                  placeholder="Ej. Electricidad"
                />
              </div>
            </div>

            <!-- Descripción -->
            <div class="form-group full-width">
              <label class="form-label">Descripción <span class="required">*</span></label>
              <div class="input-wrapper">
                <span class="input-icon">📝</span>
                <input
                  type="text"
                  class="form-control"
                  name="descripcion"
                  [(ngModel)]="modelo.descripcion"
                  required
                  placeholder="Nombre o descripción del producto"
                />
              </div>
            </div>

            <!-- Coste -->
            <div class="form-group">
              <label class="form-label">Coste Unitario (€) <span class="required">*</span></label>
              <div class="input-wrapper">
                <span class="input-icon">💶</span>
                <input
                  type="number"
                  class="form-control"
                  name="coste"
                  [(ngModel)]="modelo.coste"
                  step="0.01"
                  required
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" routerLink="/productos" class="btn-cancel">Cancelar</button>
            <button type="submit" class="btn-save" [disabled]="formRef.invalid">
              {{ esNuevo ? 'Crear Producto' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .ficha-wrapper { max-width: 800px; margin: 0 auto; animation: fadeIn 0.4s ease-out; }
    .header-section { margin-bottom: 2rem; text-align: center; }
    .back-link { display: inline-flex; align-items: center; gap: 0.5rem; color: #64748b; text-decoration: none; font-weight: 500; font-size: 0.9rem; margin-bottom: 1rem; transition: color 0.2s; }
    .back-link:hover { color: #3b82f6; }
    h2 { font-size: 2rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem 0; }
    .subtitle { color: #64748b; font-size: 1.1rem; }
    
    .form-card { background: white; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; overflow: hidden; }
    .modern-form { padding: 2.5rem; }
    .form-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
    @media (min-width: 768px) { .form-grid { grid-template-columns: 1fr 1fr; } .full-width { grid-column: span 2; } }
    
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-label { font-size: 0.9rem; font-weight: 600; color: #334155; }
    .required { color: #ef4444; }
    .input-wrapper { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 1rem; font-size: 1.1rem; color: #94a3b8; pointer-events: none; z-index: 10; }
    .form-control { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; font-size: 0.95rem; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; transition: all 0.2s ease; color: #1e293b; }
    .form-control:focus { outline: none; border-color: #3b82f6; background-color: white; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
    
    .form-actions { margin-top: 2.5rem; display: flex; justify-content: flex-end; gap: 1rem; padding-top: 1.5rem; border-top: 1px solid #f1f5f9; }
    .btn-cancel { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; background: white; border: 1px solid #cbd5e1; color: #64748b; cursor: pointer; text-decoration: none; }
    .btn-cancel:hover { background: #f8fafc; }
    .btn-save { padding: 0.75rem 2rem; border-radius: 8px; font-weight: 600; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
    .btn-save:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.3); }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; background: #94a3b8; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
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
  ) { }

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
