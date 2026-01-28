-- ======================================================
-- 1. CREACIÓN DE LA BASE DE DATOS Y ESTRUCTURA
-- ======================================================
DROP DATABASE IF EXISTS gestion_ingenieria;
CREATE DATABASE gestion_ingenieria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gestion_ingenieria;

-- 1.1 TABLA USUARIOS (BIGINT + VARCHAR para compatibilidad)
CREATE TABLE USUARIOS (
    id_usuario BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'LECTURA',
    email VARCHAR(100),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 1.2 TABLA CLIENTES
CREATE TABLE CLIENTES (
    id_cliente BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido1 VARCHAR(50) NOT NULL,
    apellido2 VARCHAR(50),
    dni VARCHAR(15) NOT NULL UNIQUE,
    direccion_fiscal_completa VARCHAR(255),
    codigo_postal VARCHAR(10),
    cuenta_bancaria VARCHAR(34),
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por VARCHAR(100) DEFAULT 'Sistema',
    modificado_por VARCHAR(100) NULL,
    fecha_modificacion TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 1.3 TABLA LOCALES
CREATE TABLE LOCALES (
    id_local BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_cliente BIGINT NOT NULL,
    nombre_titular VARCHAR(50) NOT NULL,
    apellido1_titular VARCHAR(50) NOT NULL,
    apellido2_titular VARCHAR(50),
    dni_titular VARCHAR(15),
    cups VARCHAR(22) NULL,
    referencia_catastral VARCHAR(20) NULL,
    direccion_completa VARCHAR(255) NOT NULL,
    latitud DECIMAL(10, 8) NULL,
    longitud DECIMAL(11, 8) NULL,
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por VARCHAR(100) DEFAULT 'Sistema',
    modificado_por VARCHAR(100) NULL,
    fecha_modificacion TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_local_cliente FOREIGN KEY (id_cliente) REFERENCES CLIENTES(id_cliente) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 1.4 TABLA CONTRATOS (Cambiado ENUM por VARCHAR)
CREATE TABLE CONTRATOS (
    id_contrato BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_cliente BIGINT NOT NULL,
    id_local BIGINT NOT NULL,
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    tipo_contrato VARCHAR(50) NOT NULL,
    ce_previo VARCHAR(50) DEFAULT 'Pendiente',
    ce_post VARCHAR(50) DEFAULT 'Pendiente',
    enviado_cee_post BOOLEAN DEFAULT FALSE,
    licencia_obras VARCHAR(50) DEFAULT 'No requerida',
    mtd BOOLEAN DEFAULT FALSE,
    planos BOOLEAN DEFAULT FALSE,
    subvencion_estado VARCHAR(50) DEFAULT 'No solicitada',
    libro_edif_incluido BOOLEAN DEFAULT FALSE,
    observaciones TEXT NULL,
    creado_por VARCHAR(100) DEFAULT 'Sistema',
    modificado_por VARCHAR(100) NULL,
    fecha_modificacion TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_contrato_cliente FOREIGN KEY (id_cliente) REFERENCES CLIENTES(id_cliente) ON DELETE CASCADE,
    CONSTRAINT fk_contrato_local FOREIGN KEY (id_local) REFERENCES LOCALES(id_local) ON DELETE CASCADE,
    CONSTRAINT chk_periodo_contrato CHECK (fecha_vencimiento >= fecha_inicio)
) ENGINE=InnoDB;

-- 1.5 TABLA TRÁMITES CONTRATO
CREATE TABLE TRAMITES_CONTRATO (
    id_tramite BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_contrato BIGINT NOT NULL,
    tipo_tramite VARCHAR(255) NOT NULL,
    estado VARCHAR(50) DEFAULT 'Pendiente',
    tecnico_asignado VARCHAR(100) NULL,
    fecha_seguimiento DATE NULL,
    es_urgente BOOLEAN DEFAULT FALSE,
    detalle_seguimiento TEXT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ejecucion DATETIME NULL,
    CONSTRAINT fk_tramite_contrato FOREIGN KEY (id_contrato) REFERENCES CONTRATOS(id_contrato) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 1.6 TABLAS PROVEEDORES
CREATE TABLE PROVEEDORES (
    id_proveedor BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre_comercial VARCHAR(100) NOT NULL,
    razon_social VARCHAR(100),
    es_autonomo BOOLEAN DEFAULT FALSE,
    cif VARCHAR(20) NOT NULL,
    direccion_fiscal VARCHAR(255),
    fecha_alta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por VARCHAR(100) DEFAULT 'Sistema'
) ENGINE=InnoDB;

CREATE TABLE PROVEEDOR_OFICIOS (
    id_oficio BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_proveedor BIGINT NOT NULL,
    oficio VARCHAR(100) NOT NULL,
    CONSTRAINT fk_oficio_prov FOREIGN KEY (id_proveedor) REFERENCES PROVEEDORES(id_proveedor) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE PROVEEDOR_CONTACTOS (
    id_contacto BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_proveedor BIGINT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    cargo VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    CONSTRAINT fk_contacto_prov FOREIGN KEY (id_proveedor) REFERENCES PROVEEDORES(id_proveedor) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 1.7 TABLA SEGUIMIENTO_TRAMITES
CREATE TABLE SEGUIMIENTO_TRAMITES (
    id_seguimiento BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_tramite BIGINT NOT NULL,
    id_usuario BIGINT NOT NULL, 
    id_creador BIGINT NOT NULL, 
    id_proveedor BIGINT NULL, 
    comentario TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_seguimiento DATE NULL,
    es_urgente BOOLEAN DEFAULT FALSE,
    estado VARCHAR(50) DEFAULT 'Pendiente',
    CONSTRAINT fk_seg_tramite FOREIGN KEY (id_tramite) REFERENCES TRAMITES_CONTRATO(id_tramite) ON DELETE CASCADE,
    CONSTRAINT fk_seg_usuario FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario),
    CONSTRAINT fk_seg_creador FOREIGN KEY (id_creador) REFERENCES USUARIOS(id_usuario),
    CONSTRAINT fk_seg_proveedor FOREIGN KEY (id_proveedor) REFERENCES PROVEEDORES(id_proveedor) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 1.7 TABLAS DE ARCHIVOS
CREATE TABLE ARCHIVOS_CLIENTE (
    id_archivo BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_cliente BIGINT NOT NULL,
    nombre_visible VARCHAR(255) NOT NULL, 
    nombre_fisico VARCHAR(255) NOT NULL,  
    tipo_archivo VARCHAR(100),            
    categoria VARCHAR(100) DEFAULT 'Otros',
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_subida VARCHAR(50),
    CONSTRAINT fk_arch_cliente FOREIGN KEY (id_cliente) REFERENCES CLIENTES(id_cliente) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ARCHIVOS_TRAMITE (
    id_archivo_t BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_tramite BIGINT NOT NULL,
    nombre_visible VARCHAR(255) NOT NULL,
    nombre_fisico VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(100),
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_subida VARCHAR(50),
    CONSTRAINT fk_arch_tramite FOREIGN KEY (id_tramite) REFERENCES TRAMITES_CONTRATO(id_tramite) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 1.8 TABLA AUDITORÍA
CREATE TABLE AUDITORIA_SISTEMA (
    id_log BIGINT AUTO_INCREMENT PRIMARY KEY,
    tabla_afectada VARCHAR(50) NOT NULL,
    id_registro BIGINT NOT NULL,
    campo_modificado VARCHAR(50),
    valor_anterior TEXT,
    valor_nuevo TEXT,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_bd VARCHAR(100)
) ENGINE=InnoDB;

-- 1.9 TABLA SESIONES
CREATE TABLE auditoria_sesiones (
    id_sesion BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_usuario BIGINT NOT NULL,
    nombre_usuario VARCHAR(50) NOT NULL,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP NULL,
    ip_acceso VARCHAR(45),
    estado VARCHAR(20) DEFAULT 'Conectado',
    CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario) REFERENCES USUARIOS(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ======================================================
-- 2. VISTAS
-- ======================================================

CREATE OR REPLACE VIEW vista_estado_contratos AS
SELECT 
    c.id_contrato,
    cl.id_cliente,
    cl.dni as dni_cliente,
    CONCAT(cl.apellido1, ' ', IFNULL(cl.apellido2, ''), ' , ', cl.nombre) AS nombre_cliente,
    l.direccion_completa,
    c.tipo_contrato,
    c.fecha_alta,
    c.fecha_vencimiento,
    CASE 
        WHEN DATEDIFF(c.fecha_vencimiento, CURDATE()) < 0 THEN 'VENCIDO'
        ELSE 'ACTIVO'
    END AS estado
FROM CONTRATOS c
JOIN CLIENTES cl ON c.id_cliente = cl.id_cliente
JOIN LOCALES l ON c.id_local = l.id_local;

-- ======================================================
-- 3. DATOS DE PRUEBA COMPLETOS
-- ======================================================

-- 6 Usuarios
INSERT INTO USUARIOS (nombre_usuario, password_hash, rol, email) VALUES 
('jefe_admin', 'admin123', 'ADMIN', 'jefeadmin@insene.com'),
('carlos_tec', 'pass123', 'TÉCNICO', 'carlos.tec@insene.com'),
('marta_tec', 'pass123', 'TÉCNICO', 'marta.tec@insene.com'),
('raul_tec', 'pass123', 'TÉCNICO', 'raul.tec@insene.com'),
('elena_tec', 'pass123', 'TÉCNICO', 'elena.tec@insene.com'),
('pablo_tec', 'pass123', 'TÉCNICO', 'pablo.tec@insene.com');

-- 11 Clientes
INSERT INTO CLIENTES (nombre, apellido1, apellido2, dni, direccion_fiscal_completa, codigo_postal, cuenta_bancaria, creado_por) VALUES 
('Jose', 'Brenes', 'Oliva', '75892994D', 'Calle Mina 4, Arahal', '41600', 'ES1234567890123456789012', 'jefe_admin'),
('Ana', 'García', 'López', '12345678Z', 'Avda. Constitución 12, Sevilla', '41001', 'ES9876543210987654321098', 'jefe_admin'),
('Manuel', 'Sánchez', 'Pérez', '23456789X', 'Calle Real 45, Alcalá de Guadaíra', '41500', 'ES8765432109876543210987', 'jefe_admin'),
('María', 'Rodríguez', 'Ruiz', '34567890C', 'Plaza Mayor 1, Dos Hermanas', '41700', 'ES7654321098765432109876', 'jefe_admin'),
('David', 'Martínez', 'Jiménez', '45678901V', 'Calle Betis 8, Sevilla', '41010', 'ES6543210987654321098765', 'jefe_admin'),
('Lucía', 'Hernández', 'Muñoz', '56789012B', 'Calle Larga 22, Arahal', '41600', 'ES5432109876543210987654', 'jefe_admin'),
('Javier', 'Díaz', 'Moreno', '67890123N', 'Calle Ancha 15, Paradas', '41610', 'ES4321098765432109876543', 'jefe_admin'),
('Elena', 'Álvarez', 'Serrano', '78901234M', 'Calle Sierpes 3, Sevilla', '41004', 'ES3210987654321098765432', 'jefe_admin'),
('Pablo', 'Romero', 'Navarro', '89012345Q', 'Calle Nueva 10, Marchena', '41620', 'ES2109876543210987654321', 'jefe_admin'),
('Marta', 'Torres', 'Castro', '90123456W', 'Calle Feria 55, Sevilla', '41003', 'ES1098765432109876543210', 'jefe_admin'),
('Antonio', 'Vázquez', 'Blanco', '01234567E', 'Calle Pureza 2, Sevilla', '41011', 'ES0987654321098765432109', 'jefe_admin');

-- 11 Locales
INSERT INTO LOCALES (id_cliente, nombre_titular, apellido1_titular, dni_titular, cups, referencia_catastral, direccion_completa, latitud, longitud, creado_por) VALUES 
(1, 'Jose', 'Brenes', '75892994D', 'ES0021000012345678AB1F', '1234567TG8901S0001FF', 'Calle Mina 4, Arahal', 37.2628, -5.4772, 'jefe_admin'),
(2, 'Ana', 'García', '12345678Z', 'ES0021000087654321AB2G', '0869501QA5406N0003HI', 'Calle Diputación 250, Barcelona', 41.3887, 2.1645, 'jefe_admin'),
(3, 'Manuel', 'Sánchez', '23456789X', 'ES0021000076543210AB3H', '6029215TF7760G0001AK', 'Avda. Los Majuelos 30, S.C. Tenerife', 28.4550, -16.2941, 'jefe_admin'),
(4, 'María', 'Rodríguez', '34567890C', 'ES0021000065432109AB4I', '4961312UG1846S0002FU', 'Calle Real 1, Sevilla', 37.3828, -5.9731, 'jefe_admin'),
(5, 'David', 'Martínez', '45678901V', 'ES0021000054321098AB5J', '6197808TG5369N0002BX', 'Calle Alcalá 45, Madrid', 40.4189, -3.6995, 'jefe_admin'),
(6, 'Lucía', 'Hernández', '56789012B', 'ES0021000043210987AB6K', '1584301QB6318S0001LT', 'Calle Mayor 10, Valencia', 39.4699, -0.3763, 'jefe_admin'),
(7, 'Javier', 'Díaz', '67890123N', 'ES0021000032109876AB7L', '0872229TG4107S0001HK', 'Calle Urquinaona 4, Barcelona', 41.3891, 2.1722, 'jefe_admin'),
(8, 'Elena', 'Álvarez', '78901234M', 'ES0021000021098765AB8M', '4733421UG0643S0001GW', 'Avda. Palmera 15, Sevilla', 37.3592, -5.9864, 'jefe_admin'),
(9, 'Pablo', 'Romero', '89012345Q', 'ES0021000010987654AB9N', '8073358TG4387S0001TF', 'Calle Pureza 80, Sevilla', 37.3822, -6.0003, 'jefe_admin'),
(10, 'Marta', 'Torres', '90123456W', 'ES0021000009876543AB0O', '0165203TG4106N0001PH', 'Calle Feria 12, Sevilla', 37.3977, -5.9922, 'jefe_admin'),
(11, 'Antonio', 'Vázquez', '01234567E', 'ES0021000098765432AB1P', '08020A0QB6300S0001PE', 'Polígono Industrial 5, Córdoba', 37.8882, -4.7794, 'jefe_admin');

-- 11 Contratos
INSERT INTO CONTRATOS (id_cliente, id_local, fecha_inicio, fecha_vencimiento, tipo_contrato, creado_por) VALUES 
(1, 1, '2025-01-01', '2026-01-01', 'Instalacion', 'jefe_admin'),
(2, 2, '2025-02-01', '2026-02-01', 'Instalacion', 'jefe_admin'),
(3, 3, '2025-02-15', '2026-02-15', 'Preventivo', 'jefe_admin'),
(4, 4, '2025-03-01', '2026-03-01', 'Ampliacion', 'jefe_admin'),
(5, 5, '2025-03-10', '2026-03-10', 'Instalacion', 'jefe_admin'),
(6, 6, '2025-04-01', '2026-04-01', 'Preventivo', 'jefe_admin'),
(7, 7, '2025-04-20', '2026-04-20', 'Ampliacion', 'jefe_admin'),
(8, 8, '2025-05-01', '2026-05-01', 'Instalacion', 'jefe_admin'),
(9, 9, '2025-05-15', '2026-05-15', 'Preventivo', 'jefe_admin'),
(10, 10, '2025-06-01', '2026-06-01', 'Ampliacion', 'jefe_admin'),
(11, 11, '2025-06-10', '2026-06-10', 'Instalacion', 'jefe_admin');

-- 10 Proveedores
INSERT INTO PROVEEDORES (nombre_comercial, razon_social, es_autonomo, cif, direccion_fiscal, creado_por) VALUES 
('Electricidad García SL', 'Electricidad García Sociedad Limitada', 0, 'B12345678', 'Pol. Ind. Calonge, Calle A, 12, Sevilla', 'jefe_admin'),
('Carlos Fontanería', 'Carlos Pérez Gómez', 1, '12345678Z', 'Calle Betis 45, Sevilla', 'jefe_admin'),
('Construcciones Modesto', 'Modesto Construcciones SA', 0, 'A87654321', 'Avda. de la Paz 10, Alcalá de Guadaíra', 'jefe_admin'),
('Climatización Del Sur', 'ClimaSur Instalaciones SL', 0, 'B11223344', 'Calle Refrigeración 5, Dos Hermanas', 'jefe_admin'),
('Topografía y Medición', 'Ana Ruiz Topógrafa', 1, '23456789X', 'Plaza de Cuba 3, Sevilla', 'jefe_admin'),
('Carpintería Hnos. López', 'Carpintería López CB', 0, 'E55667788', 'Calle Madera 8, Utrera', 'jefe_admin'),
('Pinturas Lozano', 'Juan Lozano Pintor', 1, '34567890C', 'Calle Arco Iris 2, Mairena del Aljarafe', 'jefe_admin'),
('Silence Acústica', 'Ingeniería Silence SL', 0, 'B99887766', 'Parque Tecnológico Cartuja, Sevilla', 'jefe_admin'),
('Excavaciones Tierra', 'Excavaciones Tierra SL', 0, 'B44332211', 'Carretera Carmona Km 5', 'jefe_admin'),
('Seguridad 24h', 'Alarmas y Sistemas SL', 0, 'B66778899', 'Avda. República Argentina 20, Sevilla', 'jefe_admin');

-- Oficios de los proveedores
INSERT INTO PROVEEDOR_OFICIOS (id_proveedor, oficio) VALUES 
(1, 'Electricidad'), (1, 'Baja Tensión'),
(2, 'Fontanería'), (2, 'Gas'),
(3, 'Albañilería'), (3, 'Reformas'),
(4, 'Climatización'), (4, 'Ventilación'),
(5, 'Topografía'),
(6, 'Carpintería Madera'), (6, 'Ebanistería'),
(7, 'Pintura'), (7, 'Revestimientos'),
(8, 'Ingeniería Acústica'), (8, 'Mediciones'),
(9, 'Movimiento de Tierras'), (9, 'Excavación'),
(10, 'Sistemas Seguridad'), (10, 'PCI');

-- Contactos de los proveedores
INSERT INTO PROVEEDOR_CONTACTOS (id_proveedor, nombre, cargo, telefono, email) VALUES 
(1, 'Manuel García', 'Gerente', '600111222', 'mg@garciasl.com'),
(2, 'Carlos Pérez', 'Autónomo', '611222333', 'carlosperez@fontaneria.com'),
(3, 'Modesto Rodríguez', 'Jefe de Obra', '622333444', 'obras@modesto.com'),
(4, 'Lucía Méndez', 'Administración', '633444555', 'admin@climasur.com'),
(5, 'Ana Ruiz', 'Topógrafa', '644555666', 'ana.ruiz@topografia.com'),
(6, 'Pedro López', 'Encargado Taller', '655666777', 'pedro@carpinterialopez.com'),
(7, 'Juan Lozano', 'Pintor', '666777888', 'juan@pinturaslozano.com'),
(8, 'Elena Valls', 'Ingeniera Acústica', '677888999', 'elena@silence.com'),
(9, 'Roberto Tierra', 'Jefe Maquinaria', '688999000', 'roberto@excavaciones.com'),
(10, 'Sonia Vigil', 'Comercial', '699000111', 'sonia@seguridad24.com');