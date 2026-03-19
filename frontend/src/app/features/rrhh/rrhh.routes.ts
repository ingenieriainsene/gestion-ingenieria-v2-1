import { Routes } from '@angular/router';
import { RrhhDashboardComponent } from './rrhh-dashboard.component';
import { EmpleadoListaComponent } from './empleado-lista.component';
import { PortalEmpleadoComponent } from './portal-empleado.component';
import { adminGuard } from '../../core/admin.guard';

export const RRHHRoutes: Routes = [
  { path: '', component: RrhhDashboardComponent },
  { path: 'empleados', component: EmpleadoListaComponent, canActivate: [adminGuard] },
  { path: 'mi-portal', component: PortalEmpleadoComponent }
];
