import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ProveedorService,
  ProveedorDetailDTO,
  ProveedorDTO,
  OficioDTO,
  ContactoDTO,
} from '../../services/proveedor.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-proveedor-ficha',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './proveedor-ficha.component.html',
  styleUrls: ['./proveedor-ficha.component.css'],
})
export class ProveedorFichaComponent implements OnInit {
  activeTab: 'general' | 'oficios' | 'contactos' = 'general';
  id: number | null = null;
  detail: ProveedorDetailDTO | null = null;
  loading = true;
  guardando = false;
  form: FormGroup;
  oficioNuevo = '';
  listaOficios: { id: number; oficio: string }[] = [];
  modalContacto = false;
  editandoContacto: ContactoDTO | null = null;
  formContacto: FormGroup;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: ProveedorService
  ) {
    this.form = this.fb.group({
      nombreComercial: ['', Validators.required],
      razonSocial: [''],
      cif: ['', Validators.required],
      direccionFiscal: [''],
      esAutonomo: [false],
    });
    this.formContacto = this.fb.group({
      nombre: ['', Validators.required],
      cargo: [''],
      telefono: [''],
      email: [''],
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((m) => {
      const idParam = m.get('id');
      if (idParam && idParam !== 'nuevo') {
        this.id = +idParam;
        this.cargar();
      } else {
        this.loading = false;
        this.router.navigate(['/proveedores']);
      }
    });
  }

  cargar(): void {
    if (!this.id) return;
    this.loading = true;
    this.service.getById(this.id).subscribe({
      next: (d) => {
        this.detail = d;
        this.form.patchValue({
          nombreComercial: d.nombreComercial ?? '',
          razonSocial: d.razonSocial ?? '',
          cif: d.cif ?? '',
          direccionFiscal: d.direccionFiscal ?? '',
          esAutonomo: !!d.esAutonomo,
        });
        this.listaOficios = (d.listaOficios ?? []).map((o) => ({ id: o.id, oficio: o.oficio }));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudo cargar el proveedor.', 'error');
        this.router.navigate(['/proveedores']);
      },
    });
  }

  guardarGeneral(): void {
    if (!this.id || this.form.invalid || this.guardando) return;
    this.guardando = true;
    const payload: ProveedorDTO = {
      nombreComercial: this.form.get('nombreComercial')!.value,
      cif: this.form.get('cif')!.value,
      razonSocial: this.form.get('razonSocial')!.value || undefined,
      direccionFiscal: this.form.get('direccionFiscal')!.value || undefined,
      esAutonomo: !!this.form.get('esAutonomo')!.value,
    };
    this.service.update(this.id, payload).subscribe({
      next: () => {
        this.guardando = false;
        this.cargar();
        Swal.fire('Guardado', 'Datos generales actualizados.', 'success');
      },
      error: () => {
        this.guardando = false;
        Swal.fire('Error', 'No se pudieron guardar los datos.', 'error');
      },
    });
  }

  agregarOficio(): void {
    const s = (this.oficioNuevo || '').trim();
    if (!s || !this.id) return;
    const nueva = this.listaOficios.map((o) => o.oficio).concat(s);
    this.service.updateOficios(this.id, nueva).subscribe({
      next: () => {
        this.oficioNuevo = '';
        this.cargar();
        Swal.fire('Añadido', 'Oficio añadido.', 'success');
      },
      error: () => Swal.fire('Error', 'No se pudo añadir el oficio.', 'error'),
    });
  }

  quitarOficio(o: { id: number; oficio: string }): void {
    if (!this.id) return;
    Swal.fire({
      title: '¿Eliminar oficio?',
      text: `¿Quitar "${o.oficio}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e293b',
      cancelButtonText: 'Cancelar',
    }).then((res) => {
      if (!res.isConfirmed) return;
      const nueva = this.listaOficios.filter((x) => x.id !== o.id).map((x) => x.oficio);
      this.service.updateOficios(this.id!, nueva).subscribe({
        next: () => {
          this.cargar();
          Swal.fire('Eliminado', 'Oficio quitado.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo eliminar el oficio.', 'error'),
      });
    });
  }

  abrirModalContacto(contacto?: ContactoDTO): void {
    this.editandoContacto = contacto ?? null;
    this.formContacto.reset({
      nombre: contacto?.nombre ?? '',
      cargo: contacto?.cargo ?? '',
      telefono: contacto?.telefono ?? '',
      email: contacto?.email ?? '',
    });
    this.modalContacto = true;
  }

  onOverlayClick(e: Event): void {
    if ((e.target as HTMLElement)?.classList?.contains('modal-overlay')) this.cerrarModalContacto();
  }

  cerrarModalContacto(): void {
    this.modalContacto = false;
    this.editandoContacto = null;
  }

  guardarContacto(): void {
    if (!this.id || this.formContacto.invalid) return;
    const v = this.formContacto.value;
    const c: ContactoDTO = {
      nombre: v.nombre.trim(),
      cargo: v.cargo?.trim() || undefined,
      telefono: v.telefono?.trim() || undefined,
      email: v.email?.trim() || undefined,
    };
    if (this.editandoContacto?.id) {
      this.service.updateContact(this.id, this.editandoContacto.id, c).subscribe({
        next: () => {
          this.cerrarModalContacto();
          this.cargar();
          Swal.fire('Guardado', 'Contacto actualizado.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo actualizar el contacto.', 'error'),
      });
    } else {
      this.service.addContact(this.id, c).subscribe({
        next: () => {
          this.cerrarModalContacto();
          this.cargar();
          Swal.fire('Creado', 'Contacto añadido.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo añadir el contacto.', 'error'),
      });
    }
  }

  eliminarContacto(c: ContactoDTO): void {
    if (!this.id || !c.id) return;
    Swal.fire({
      title: '¿Eliminar contacto?',
      text: `¿Quitar a ${c.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e293b',
      cancelButtonText: 'Cancelar',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.service.deleteContact(this.id!, c.id!).subscribe({
        next: () => {
          this.cargar();
          Swal.fire('Eliminado', 'Contacto borrado.', 'success');
        },
        error: () => Swal.fire('Error', 'No se pudo eliminar el contacto.', 'error'),
      });
    });
  }

  eliminarProveedor(): void {
    if (!this.id) return;
    Swal.fire({
      title: '¿Eliminar proveedor?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e293b',
      cancelButtonText: 'Cancelar',
    }).then((res) => {
      if (!res.isConfirmed) return;
      this.service.delete(this.id!).subscribe({
        next: () => {
          Swal.fire('Eliminado', 'Proveedor borrado.', 'success');
          this.router.navigate(['/proveedores']);
        },
        error: () => Swal.fire('Error', 'No se pudo eliminar el proveedor.', 'error'),
      });
    });
  }

  get contactos(): ContactoDTO[] {
    return this.detail?.listaContactos ?? [];
  }

  fechaAltaFormatted(): string {
    const d = this.detail?.fechaAlta;
    if (!d) return '—';
    const x = new Date(d);
    return isNaN(x.getTime()) ? '—' : x.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
