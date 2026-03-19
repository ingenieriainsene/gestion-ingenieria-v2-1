import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FichajeService, EstadoFichajeDTO } from '../../services/fichaje.service';
import { Subscription, interval } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-fichaje-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fichaje-sidebar-widget p-3 bg-slate-700/50 rounded-lg border border-slate-600 mb-3">
      <div class="flex flex-col items-center space-y-3">
        <!-- Timer -->
        <div class="timer font-mono text-2xl font-bold text-amber-400 tracking-wider">
          {{ timeDisplay }}
        </div>
        
        <!-- Controls Grid -->
        <div class="grid grid-cols-2 gap-2 w-full">
          <!-- Iniciar -->
          <button *ngIf="!estado || estado.estado === 'SIN_INICIAR' || estado.estado === 'FINALIZADO'" 
                  (click)="iniciar()" 
                  class="col-span-2 flex items-center justify-center space-x-2 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-sm font-bold transition-all shadow-sm">
            <span>▶</span> <span>Iniciar Jornada</span>
          </button>

          <!-- Pausar -->
          <button *ngIf="estado && estado.estado === 'TRABAJANDO'" 
                  (click)="pausar()" 
                  class="flex items-center justify-center space-x-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded text-sm font-bold transition-all shadow-sm">
            <span>⏸</span> <span>Pausa</span>
          </button>

          <!-- Reanudar -->
          <button *ngIf="estado && estado.estado === 'EN_PAUSA'" 
                  (click)="reanudar()" 
                  class="flex items-center justify-center space-x-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded text-sm font-bold transition-all shadow-sm">
            <span>▶</span> <span>Seguir</span>
          </button>

          <!-- Finalizar -->
          <button *ngIf="estado && (estado.estado === 'TRABAJANDO' || estado.estado === 'EN_PAUSA')" 
                  (click)="finalizar()" 
                  class="flex items-center justify-center space-x-1 py-2 bg-rose-600 hover:bg-rose-500 rounded text-sm font-bold transition-all shadow-sm"
                  [ngClass]="{'col-span-1': estado.estado === 'TRABAJANDO' || estado.estado === 'EN_PAUSA', 'col-span-2': false}">
            <span>⏹</span> <span>Fin</span>
          </button>
        </div>

        <div *ngIf="estado && estado.estado !== 'SIN_INICIAR'" class="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
           Estado: {{ estado.estado }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .fichaje-sidebar-widget {
      backdrop-filter: blur(4px);
      box-shadow: inset 0 1px 1px rgba(255,255,255,0.1);
    }
  `]
})
export class FichajeWidgetComponent implements OnInit, OnDestroy {
  estado: EstadoFichajeDTO | null = null;
  timeDisplay = '00:00:00';
  private timerSub?: Subscription;
  private secondsElapsed = 0;

  constructor(private fichajeService: FichajeService) {}

  ngOnInit() {
    this.fichajeService.estado$.subscribe(est => {
      this.estado = est;
      this.updateTimerFromState();
    });
    this.fichajeService.obtenerEstadoActual().subscribe();

    this.timerSub = interval(1000).subscribe(() => {
      if (this.estado && this.estado.estado === 'TRABAJANDO') {
        this.secondsElapsed++;
        this.formatTime();
      }
    });
  }

  ngOnDestroy() {
    if (this.timerSub) this.timerSub.unsubscribe();
  }

  private updateTimerFromState() {
    if (!this.estado || this.estado.estado === 'SIN_INICIAR') {
      this.secondsElapsed = 0;
      this.formatTime();
      return;
    }
    
    // Simplistic visual calc: parse horaEntrada, calc diff from now, subtract minutosPausa
    if (this.estado.horaEntrada) {
      const parts = this.estado.horaEntrada.split(':');
      const entradaDate = new Date();
      entradaDate.setHours(+parts[0] || 0, +parts[1] || 0, +parts[2] || 0, 0);

      const now = new Date();
      let diffSecs = Math.floor((now.getTime() - entradaDate.getTime()) / 1000);
      
      if (this.estado.minutosPausa) {
        diffSecs -= (this.estado.minutosPausa * 60);
      }
      
      this.secondsElapsed = Math.max(0, diffSecs);
      
      if (this.estado.estado === 'FINALIZADO' && this.estado.horaSalida) {
          const salidaParts = this.estado.horaSalida.split(':');
          const salidaDate = new Date();
          salidaDate.setHours(+salidaParts[0] || 0, +salidaParts[1] || 0, +salidaParts[2] || 0, 0);
          let finalDiff = Math.floor((salidaDate.getTime() - entradaDate.getTime()) / 1000);
          if (this.estado.minutosPausa) finalDiff -= (this.estado.minutosPausa * 60);
          this.secondsElapsed = Math.max(0, finalDiff);
      }
    }
    this.formatTime();
  }

  private formatTime() {
    const h = Math.floor(this.secondsElapsed / 3600);
    const m = Math.floor((this.secondsElapsed % 3600) / 60);
    const s = this.secondsElapsed % 60;
    this.timeDisplay = 
      String(h).padStart(2, '0') + ':' + 
      String(m).padStart(2, '0') + ':' + 
      String(s).padStart(2, '0');
  }

  iniciar() {
    this.fichajeService.iniciarJornada().subscribe({
      error: (e) => Swal.fire('Error', e.error?.message || 'Error al iniciar jornada', 'error')
    });
  }

  pausar() {
    this.fichajeService.iniciarPausa().subscribe({
      error: (e) => Swal.fire('Error', e.error?.message || 'Error al pausar', 'error')
    });
  }

  reanudar() {
    this.fichajeService.finalizarPausa().subscribe({
      error: (e) => Swal.fire('Error', e.error?.message || 'Error al reanudar', 'error')
    });
  }

  finalizar() {
    Swal.fire({
      title: '¿Finalizar Jornada?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar'
    }).then(res => {
      if (res.isConfirmed) {
        this.fichajeService.finalizarJornada().subscribe({
          error: (e) => Swal.fire('Error', e.error?.message || 'Error al finalizar', 'error')
        });
      }
    });
  }
}
