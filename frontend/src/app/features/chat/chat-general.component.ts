import { Component, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Client, IMessage } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import Swal from 'sweetalert2';
import { ChatService, ChatMessage, ChatSala } from '../../services/chat.service';
import { UsuarioService, Usuario } from '../../services/usuario.service';
import { environment } from '../../../environments/environments';

@Component({
  selector: 'app-chat-general',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="chat-page">
      <div class="chat-header">
        <div>
          <h1>Chat general</h1>
          <p>Conversaciones internas del equipo</p>
        </div>
        <div class="connection-status" *ngIf="!errorConexion && stompClient?.connected">
          <span class="status-dot"></span> Conectado
        </div>
      </div>

      <div class="chat-body">
        <div *ngIf="errorConexion" class="chat-error">
          {{ errorConexion }}
          <button class="btn-retry" (click)="connectWs()">Reintentar conexión</button>
        </div>
        <div class="chat-messages" #scrollBox>
          <div *ngIf="mensajes.length === 0 && !errorConexion" class="empty-state">
            No hay mensajes aún. ¡Sé el primero en escribir!
          </div>
          <div *ngFor="let m of mensajes" class="msg" [class.me]="m.usuarioId === usuarioActualId">
            <div class="msg-meta">
              <span class="msg-user">{{ m.usuarioNombre || ('Usuario ' + m.usuarioId) }}</span>
              <span class="msg-time">{{ m.fechaEnvio | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="msg-content">{{ m.contenido }}</div>
            <div *ngIf="m.adjuntos?.length" class="msg-attachments">
              <a *ngFor="let a of m.adjuntos" [href]="a.url" target="_blank">{{ a.nombre || a.url }}</a>
            </div>
          </div>
        </div>

        <div class="chat-composer">
          <input type="file" (change)="onFile($event)" />
          <input type="text" [(ngModel)]="texto" placeholder="Escribe un mensaje..." (keydown.enter)="enviar()" />
          <button class="btn-primary" (click)="enviar()">Enviar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-page { display:flex; flex-direction:column; height:100vh; gap:10px; }
    .chat-header { padding:12px 16px; background:#fff; border:1px solid #e2e8f0; border-radius:12px; display:flex; justify-content:space-between; align-items:center; }
    .chat-header h1 { margin:0; }
    .chat-header p { margin:4px 0 0; color:#64748b; }
    .connection-status { display:flex; align-items:center; gap:6px; color:#10b981; font-size:0.875rem; }
    .status-dot { width:8px; height:8px; background:#10b981; border-radius:50%; animation:pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity:1; } 50% { opacity:0.5; } }
    .chat-body { flex:1; display:flex; flex-direction:column; background:#fff; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; }
    .chat-messages { flex:1; padding:16px; overflow:auto; display:flex; flex-direction:column; gap:10px; }
    .chat-error { padding:10px 16px; background:#fee2e2; color:#991b1b; border-bottom:1px solid #fecaca; display:flex; justify-content:space-between; align-items:center; }
    .btn-retry { padding:4px 12px; background:#dc2626; color:white; border:none; border-radius:6px; cursor:pointer; font-size:0.875rem; }
    .btn-retry:hover { background:#b91c1c; }
    .empty-state { text-align:center; padding:40px 20px; color:#94a3b8; font-size:0.95rem; }
    .msg { max-width:70%; background:#f1f5f9; padding:10px; border-radius:10px; }
    .msg.me { align-self:flex-end; background:#1e293b; color:#fff; }
    .msg-meta { font-size:0.75rem; opacity:0.8; display:flex; justify-content:space-between; gap:8px; }
    .msg-content { margin-top:4px; }
    .msg-attachments a { display:block; font-size:0.8rem; color:inherit; margin-top:4px; }
    .chat-composer { display:flex; gap:8px; padding:12px; border-top:1px solid #e2e8f0; }
    .chat-composer input[type="text"] { flex:1; padding:0.6rem; border-radius:8px; border:1px solid #e2e8f0; }
    .btn-primary { padding:0.6rem 1.2rem; background:#1e293b; color:white; border:none; border-radius:8px; cursor:pointer; }
    .btn-primary:hover { background:#0f172a; }
  `]
})
export class ChatGeneralComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollBox') private scrollContainer!: ElementRef;
  sala: ChatSala | null = null;
  mensajes: ChatMessage[] = [];
  texto = '';
  usuarioActualId: number | null = null;
  errorConexion: string | null = null;
  stompClient: Client | null = null;
  private adjuntoPendiente: { url: string; tipo?: string; nombre?: string } | null = null;
  private shouldScroll = false;

  constructor(private chat: ChatService, private usuarios: UsuarioService) { }

  ngOnInit(): void {
    this.usuarios.getAll().subscribe((list: Usuario[]) => {
      const first = (list || [])[0];
      this.usuarioActualId = first?.idUsuario ?? null;
    });
    this.chat.getSalaGeneral().subscribe((s) => {
      this.sala = s;
      this.chat.getMensajes(s.idSala).subscribe((list) => {
        this.mensajes = (list || []).reverse();
      });
      this.connectWs();
    });
  }

  ngOnDestroy(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error al hacer scroll:', err);
    }
  }

  connectWs() {
    try {
      // Desactivar cliente anterior si existe
      if (this.stompClient) {
        this.stompClient.deactivate();
      }

      const SockJSClient: any = (SockJS as any).default || (SockJS as any);
      const wsUrl = environment.apiUrl.replace('/api', '/ws'); // De http://localhost:8082/api a http://localhost:8082/ws

      console.log('Conectando a WebSocket:', wsUrl);

      const client = new Client({
        webSocketFactory: () => new SockJSClient(wsUrl),
        reconnectDelay: 5000,
        debug: (str) => console.log('STOMP:', str)
      });

      client.onConnect = () => {
        console.log('WebSocket conectado exitosamente');
        this.errorConexion = null;
        client.subscribe('/topic/chat.general', (msg: IMessage) => {
          const body = JSON.parse(msg.body);
          console.log('Mensaje recibido:', body);
          this.mensajes.push(body);
          this.shouldScroll = true;
        });
      };

      client.onStompError = (frame) => {
        console.error('Error STOMP:', frame);
        this.errorConexion = 'No se pudo conectar al chat en tiempo real.';
      };

      client.onWebSocketError = (event) => {
        console.error('Error WebSocket:', event);
        this.errorConexion = 'Error en la conexión WebSocket. Verifica que el backend esté en ejecución.';
      };

      client.activate();
      this.stompClient = client;
    } catch (e) {
      console.error('Error al inicializar WebSocket:', e);
      this.errorConexion = 'No se pudo iniciar el chat en tiempo real.';
    }
  }

  enviar(): void {
    if (!this.sala || !this.usuarioActualId || !this.texto.trim()) return;
    const payload = {
      salaId: this.sala.idSala,
      usuarioId: this.usuarioActualId,
      contenido: this.texto.trim(),
      adjuntos: this.adjuntoPendiente ? [this.adjuntoPendiente] : undefined,
      menciones: [],
    };
    if (!this.stompClient || !this.stompClient.connected) {
      Swal.fire('Error', 'WebSocket no conectado', 'error');
      return;
    }
    this.stompClient.publish({ destination: '/app/chat.send', body: JSON.stringify(payload) });
    this.texto = '';
    this.adjuntoPendiente = null;
    this.shouldScroll = true;
  }

  onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.chat.upload(file).subscribe({
      next: (res) => {
        this.adjuntoPendiente = res;
        Swal.fire('Adjunto listo', 'Se adjuntará al próximo mensaje.', 'success');
      },
      error: () => Swal.fire('Error', 'No se pudo subir el archivo', 'error'),
    });
  }
}
