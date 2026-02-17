// Modelos para el sistema de chat

export interface ChatMessage {
    idMensaje?: number;
    salaId: number;
    usuarioId: number;
    usuarioNombre?: string;
    contenido: string;
    fechaEnvio?: Date;
    adjuntos?: ChatAdjunto[];
}

export interface ChatAdjunto {
    idAdjunto?: number;
    url: string;
    tipo: string;
    nombre: string;
}

export interface ChatSala {
    idSala: number;
    nombre: string;
    esGlobal: boolean;
    tipo?: string;
}

export interface ChatSendRequest {
    salaId: number;
    usuarioId: number;
    contenido: string;
    adjuntos?: ChatAdjunto[];
}

export interface ChatTypingNotification {
    salaId: number;
    usuarioId: number;
    usuarioNombre: string;
}
