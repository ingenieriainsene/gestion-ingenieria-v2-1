-- SCRIPT PARA ARREGLAR LA ESTRUCTURA DE CHAT
-- Ejecuta este script en phpMyAdmin o tu cliente SQL conectado a 'gestion_ingenieria'

USE gestion_ingenieria;

-- 1. Añadir columna 'tipo' a chat_salas si no existe (o simplemente ejecutar, si falla ya existe)
-- Si ya tienes datos, esto pone 'GLOBAL' por defecto.
ALTER TABLE chat_salas ADD COLUMN tipo VARCHAR(20) DEFAULT 'GLOBAL';

-- 2. Crear tabla chat_participantes que falta
CREATE TABLE IF NOT EXISTS chat_participantes (
    id_participante BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    sala_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    CONSTRAINT fk_part_sala FOREIGN KEY (sala_id) REFERENCES chat_salas(id_sala) ON DELETE CASCADE,
    CONSTRAINT fk_part_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 3. Crear tabla archivos_cliente si falta (por si acaso)
CREATE TABLE IF NOT EXISTS archivos_cliente (
    id_archivo BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_cliente BIGINT NOT NULL,
    nombre_visible VARCHAR(255) NOT NULL,
    nombre_fisico VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(100),
    categoria VARCHAR(100) DEFAULT 'Otros',
    fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_subida VARCHAR(50),
    CONSTRAINT fk_arch_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Asegurar que haya una sala global
INSERT INTO chat_salas (nombre, es_global, tipo)
SELECT 'General', 1, 'GLOBAL'
WHERE NOT EXISTS (SELECT 1 FROM chat_salas WHERE es_global = 1);
