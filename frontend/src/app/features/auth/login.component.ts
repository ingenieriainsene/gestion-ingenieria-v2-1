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
        const targetCount = Math.min(80, Math.max(30, Math.floor((width * height) / 30000)));
        this.particles = new Array(targetCount).fill(null).map(() => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.2, // Movimiento más pausado y elegante
            vy: (Math.random() - 0.5) * 0.2,
            radius: Math.random() * 2 + 1, // Tamaño para los poliedros
            color: '#fbbf24'
        }));
    }

    private animate() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const width = window.innerWidth;
        const height = window.innerHeight;

        ctx.clearRect(0, 0, width, height);
        
        // Fondo Azul Marino Profundo con Degradado Radial
        const bgGradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, width
        );
        bgGradient.addColorStop(0, '#0f172a');
        bgGradient.addColorStop(1, '#020617');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Brillo Solar Distante (Plasma Ambiental)
        const solarX = width * 0.85;
        const solarY = height * 0.15;
        const solarGlow = ctx.createRadialGradient(solarX, solarY, 0, solarX, solarY, 500);
        solarGlow.addColorStop(0, 'rgba(251, 191, 36, 0.12)');
        solarGlow.addColorStop(0.5, 'rgba(251, 191, 36, 0.04)');
        solarGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = solarGlow;
        ctx.fillRect(0, 0, width, height);

        this.updateParticles(width, height);
        this.drawConnections(ctx);
        this.drawParticles(ctx);

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    private updateParticles(width: number, height: number) {
        const parallaxX = this.mouse.active ? (this.mouse.x - width / 2) * 0.02 : 0;
        const parallaxY = this.mouse.active ? (this.mouse.y - height / 2) * 0.02 : 0;

        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x <= -100 || p.x >= width + 100) p.vx *= -1;
            if (p.y <= -100 || p.y >= height + 100) p.vy *= -1;
        }
    }

    private drawParticles(ctx: CanvasRenderingContext2D) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const parallaxX = this.mouse.active ? (this.mouse.x - width / 2) * 0.02 : 0;
        const parallaxY = this.mouse.active ? (this.mouse.y - height / 2) * 0.02 : 0;

        for (const p of this.particles) {
            const px = p.x + parallaxX;
            const py = p.y + parallaxY;
            const r = p.radius;

            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.5;
            
            // Dibujar Poliedro Cristalino (Hexágono)
            ctx.moveTo(px, py - r * 1.5);
            for (let i = 1; i <= 6; i++) {
                const angle = (i * Math.PI * 2) / 6 - Math.PI / 2;
                ctx.lineTo(px + Math.cos(angle) * r * 1.5, py + Math.sin(angle) * r * 1.5);
            }
            ctx.closePath();
            ctx.fill();

            // Reflejo Refractivo
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(px - r * 0.3, py - r * 0.3, r * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    private drawConnections(ctx: CanvasRenderingContext2D) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const parallaxX = this.mouse.active ? (this.mouse.x - width / 2) * 0.02 : 0;
        const parallaxY = this.mouse.active ? (this.mouse.y - height / 2) * 0.02 : 0;

        const maxDist = 200;
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const a = this.particles[i];
                const b = this.particles[j];
                const dx = (a.x + parallaxX) - (b.x + parallaxX);
                const dy = (a.y + parallaxY) - (b.y + parallaxY);
                const dist = Math.hypot(dx, dy);
                if (dist < maxDist) {
                    const alpha = 0.18 * (1 - dist / maxDist);
                    ctx.strokeStyle = `rgba(251, 191, 36, ${alpha.toFixed(3)})`;
                    ctx.lineWidth = 0.4;
                    ctx.beginPath();
                    ctx.moveTo(a.x + parallaxX, a.y + parallaxY);
                    ctx.lineTo(b.x + parallaxX, b.y + parallaxY);
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
