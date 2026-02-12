import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProveedorService, ProveedorDetailDTO } from '../../services/proveedor.service';
import { AuditStampComponent } from '../../layout/audit-stamp.component';

@Component({
    selector: 'app-proveedor-ficha-view',
    standalone: true,
    imports: [CommonModule, RouterLink, AuditStampComponent],
    templateUrl: './proveedor-ficha-view.component.html',
    styleUrls: ['./proveedor-ficha-view.component.css']
})
export class ProveedorFichaViewComponent implements OnInit {
    id: number | null = null;
    detail: ProveedorDetailDTO | null = null;
    loading = true;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private service: ProveedorService
    ) { }

    ngOnInit(): void {
        this.route.paramMap.subscribe((m) => {
            const idParam = m.get('id');
            if (idParam && idParam !== 'nuevo') {
                this.id = +idParam;
                this.cargar();
            } else {
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
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.router.navigate(['/proveedores']);
            },
        });
    }

    fechaAltaFormatted(): string {
        const d = this.detail?.fechaAlta;
        if (!d) return '—';
        const x = new Date(d);
        return isNaN(x.getTime()) ? '—' : x.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
}
