import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
}

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
    loginForm: FormGroup;
    private ctx: CanvasRenderingContext2D | null = null;
    private particles: Particle[] = [];
    private animationId: number | null = null;
    private readonly colors = ['#F59E0B', '#0EA5E9'];
    private mouse = { x: 0, y: 0, active: false };
    private dpr = 1;

    constructor(
        private fb: FormBuilder,
        private auth: AuthService,
        private router: Router
    ) {
        this.loginForm = this.fb.group({
            username: ['', Validators.required],
            password: ['', Validators.required]
        });
    }

    ngOnInit() { }

    ngAfterViewInit() {
        const canvas = this.canvasRef.nativeElement;
        this.ctx = canvas.getContext('2d');
        this.resizeCanvas();
        this.initParticles();
        this.animate();
    }

    ngOnDestroy() {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    @HostListener('window:resize')
    onResize() {
        this.resizeCanvas();
        this.initParticles();
    }

    onMouseMove(event: MouseEvent) {
        this.mouse.active = true;
        this.mouse.x = event.clientX;
        this.mouse.y = event.clientY;
    }

    onMouseLeave() {
        this.mouse.active = false;
    }

    private resizeCanvas() {
        const canvas = this.canvasRef.nativeElement;
        this.dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvas.width = Math.floor(width * this.dpr);
        canvas.height = Math.floor(height * this.dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        this.ctx?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    private initParticles() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const targetCount = Math.min(120, Math.max(50, Math.floor((width * height) / 22000)));
        this.particles = new Array(targetCount).fill(null).map(() => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            radius: Math.random() * 1.4 + 0.8,
            color: this.colors[Math.floor(Math.random() * this.colors.length)]
        }));
    }

    private animate() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const width = window.innerWidth;
        const height = window.innerHeight;

        ctx.clearRect(0, 0, width, height);
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        this.updateParticles(width, height);
        this.drawConnections(ctx);
        this.drawParticles(ctx);

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    private updateParticles(width: number, height: number) {
        const repelRadius = 140;
        const repelForce = 0.4;

        for (const p of this.particles) {
            if (this.mouse.active) {
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 0 && dist < repelRadius) {
                    const force = (1 - dist / repelRadius) * repelForce;
                    p.vx += (dx / dist) * force;
                    p.vy += (dy / dist) * force;
                }
            }

            p.x += p.vx;
            p.y += p.vy;

            if (p.x <= 0 || p.x >= width) p.vx *= -1;
            if (p.y <= 0 || p.y >= height) p.vy *= -1;

            p.x = Math.min(width, Math.max(0, p.x));
            p.y = Math.min(height, Math.max(0, p.y));
        }
    }

    private drawParticles(ctx: CanvasRenderingContext2D) {
        for (const p of this.particles) {
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.85;
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    private drawConnections(ctx: CanvasRenderingContext2D) {
        const maxDist = 140;
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const a = this.particles[i];
                const b = this.particles[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.hypot(dx, dy);
                if (dist < maxDist) {
                    const alpha = 0.22 * (1 - dist / maxDist);
                    ctx.strokeStyle = `rgba(148, 163, 184, ${alpha.toFixed(3)})`;
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            }
        }
    }

    onSubmit() {
        if (this.loginForm.invalid) return;
        this.auth.login(this.loginForm.value).subscribe({
            next: () => {
                this.router.navigate(['/']);
            },
            error: (err) => {
                const status = err?.status;
                console.error('[Login] Error HTTP status:', status, err);

                if (status === 0) {
                    // status 0 = error de red o CORS — el servidor no respondió
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de conexión',
                        text: 'No se pudo contactar con el servidor. Por favor, comprueba tu conexión e inténtalo de nuevo.',
                        footer: 'Si el problema persiste, contacta con el administrador.'
                    });
                } else if (status === 401) {
                    // 401 real = credenciales incorrectas
                    Swal.fire('Acceso denegado', 'Usuario o contraseña incorrectos.', 'error');
                } else {
                    // Cualquier otro error del servidor
                    const body = err?.error && typeof err.error === 'object' ? err.error : {};
                    const msg = body['message'] ?? body['error'] ?? (typeof err?.error === 'string' ? err.error : null);
                    const text = (typeof msg === 'string' && msg)
                        ? msg
                        : `Error inesperado (código ${status ?? 'desconocido'}). Inténtalo de nuevo.`;
                    Swal.fire('Error del servidor', text, 'error');
                }
            }
        });
    }
}
