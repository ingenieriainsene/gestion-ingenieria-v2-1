import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Client, IMessage } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';
import Swal from 'sweetalert2';
import { ChatService, ChatMessage, ChatSala } from '../../services/chat.service';
import { UsuarioService, Usuario } from '../../services/usuario.service';

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
      </div>

      <div class="chat-body">
        <div *ngIf="errorConexion" class="chat-error">
          {{ errorConexion }}
        </div>
        <div class="chat-messages" #scrollBox>
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
    .chat-header { padding:12px 16px; background:#fff; border:1px solid #e2e8f0; border-radius:12px; }
    .chat-header h1 { margin:0; }
    .chat-header p { margin:4px 0 0; color:#64748b; }
    .chat-body { flex:1; display:flex; flex-direction:column; background:#fff; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; }
    .chat-messages { flex:1; padding:16px; overflow:auto; display:flex; flex-direction:column; gap:10px; }
    .chat-error { padding:10px 16px; background:#fee2e2; color:#991b1b; border-bottom:1px solid #fecaca; }
    .msg { max-width:70%; background:#f1f5f9; padding:10px; border-radius:10px; }
    .msg.me { align-self:flex-end; background:#1e293b; color:#fff; }
    .msg-meta { font-size:0.75rem; opacity:0.8; display:flex; justify-content:space-between; gap:8px; }
    .msg-content { margin-top:4px; }
    .msg-attachments a { display:block; font-size:0.8rem; color:inherit; margin-top:4px; }
    .chat-composer { display:flex; gap:8px; padding:12px; border-top:1px solid #e2e8f0; }
    .chat-composer input[type="text"] { flex:1; padding:0.6rem; border-radius:8px; border:1px solid #e2e8f0; }
  `]
})
export class ChatGeneralComponent implements OnInit, OnDestroy {
  sala: ChatSala | null = null;
  mensajes: ChatMessage[] = [];
  texto = '';
  usuarioActualId: number | null = null;
  errorConexion: string | null = null;
  private stompClient: Client | null = null;
  private adjuntoPendiente: { url: string; tipo?: string; nombre?: string } | null = null;

  constructor(private chat: ChatService, private usuarios: UsuarioService) {}

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

  private connectWs() {
    try {
      const SockJSClient: any = (SockJS as any).default || (SockJS as any);
      const client = new Client({
        webSocketFactory: () => new SockJSClient('http://localhost:8082/ws'),
        reconnectDelay: 5000,
      });
      client.onConnect = () => {
        this.errorConexion = null;
        client.subscribe('/topic/chat.general', (msg: IMessage) => {
          const body = JSON.parse(msg.body);
          this.mensajes.push(body);
        });
      };
      client.onStompError = () => {
        this.errorConexion = 'No se pudo conectar al chat en tiempo real.';
      };
      client.activate();
      this.stompClient = client;
    } catch (e) {
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
