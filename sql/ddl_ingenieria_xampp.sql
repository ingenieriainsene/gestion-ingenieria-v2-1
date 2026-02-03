-- ======================================================
-- 1. ESTRUCTURA (MySQL / XAMPP)
-- ======================================================

CREATE DATABASE IF NOT EXISTS gestion_ingenieria
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE gestion_ingenieria;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS presupuesto_lineas;
DROP TABLE IF EXISTS presupuestos;
DROP TABLE IF EXISTS auditoria_sesiones;
DROP TABLE IF EXISTS auditoria_sistema;
DROP TABLE IF EXISTS archivos_tramite;
DROP TABLE IF EXISTS archivos_cliente;
DROP TABLE IF EXISTS seguimiento_tramites;
DROP TABLE IF EXISTS proveedor_contactos;
DROP TABLE IF EXISTS proveedor_oficios;
DROP TABLE IF EXISTS proveedores;
DROP TABLE IF EXISTS tramites_contrato;
DROP TABLE IF EXISTS contratos;
DROP TABLE IF EXISTS locales;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS usuarios;
SET FOREIGN_KEY_CHECKS = 1;

-- 1.1 TABLA USUARIOS
CREATE TABLE usuarios (
    id_usuario BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'LECTURA',
    email VARCHAR(100),
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 1.2 TABLA CLIENTES
CREATE TABLE clientes (
    id_cliente BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    apellido1 VARCHAR(50) NOT NULL,
    apellido2 VARCHAR(50),
    dni VARCHAR(15) NOT NULL UNIQUE,
    direccion_fiscal_completa VARCHAR(255),
    codigo_postal VARCHAR(10),
    cuenta_bancaria VARCHAR(34),
    fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
    creado_por VARCHAR(100) DEFAULT 'Sistema',
    modificado_por VARCHAR(100) NULL,
    fecha_modificacion DATETIME NULL
) ENGINE=InnoDB;

-- 1.3 TABLA LOCALES
CREATE TABLE locales (
    id_local BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
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
    fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
    creado_por VARCHAR(100) DEFAULT 'Sistema',
    modificado_por VARCHAR(100) NULL,
    fecha_modificacion DATETIME NULL,
    CONSTRAINT fk_local_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 1.4 TABLA CONTRATOS
CREATE TABLE contratos (
    id_contrato BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_cliente BIGINT NOT NULL,
    id_local BIGINT NOT NULL,
    fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    tipo_contrato VARCHAR(50) NOT NULL,
    ce_previo VARCHAR(50) DEFAULT 'Pendiente',
    ce_post VARCHAR(50) DEFAULT 'Pendiente',
    enviado_cee_post TINYINT(1) DEFAULT 0,
    licencia_obras VARCHAR(50) DEFAULT 'No requerida',
    mtd TINYINT(1) DEFAULT 0,
    planos TINYINT(1) DEFAULT 0,
    subvencion_estado VARCHAR(50) DEFAULT 'No solicitada',
    libro_edif_incluido TINYINT(1) DEFAULT 0,
    observaciones TEXT NULL,
    creado_por VARCHAR(100) DEFAULT 'Sistema',
    modificado_por VARCHAR(100) NULL,
    fecha_modificacion DATETIME NULL,
    CONSTRAINT fk_contrato_cliente FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE CASCADE,
    CONSTRAINT fk_contrato_local FOREIGN KEY (id_local) REFERENCES locales(id_local) ON DELETE CASCADE,
    CONSTRAINT chk_periodo_contrato CHECK (fecha_vencimiento >= fecha_inicio)
) ENGINE=InnoDB;

-- 1.5 TABLA TRAMITES_CONTRATO
CREATE TABLE tramites_contrato (
    id_tramite BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_contrato BIGINT NOT NULL,
    tipo_tramite VARCHAR(255) NOT NULL,
    estado VARCHAR(50) DEFAULT 'Pendiente',
    tecnico_asignado VARCHAR(100) NULL,
    fecha_seguimiento DATE NULL,
    es_urgente TINYINT(1) DEFAULT 0,
    detalle_seguimiento TEXT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_ejecucion DATETIME NULL,
    CONSTRAINT fk_tramite_contrato FOREIGN KEY (id_contrato) REFERENCES contratos(id_contrato) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 1.6 TABLAS PROVEEDORES
CREATE TABLE proveedores (
    id_proveedor BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre_comercial VARCHAR(100) NOT NULL,
    razon_social VARCHAR(100),
    es_autonomo TINYINT(1) DEFAULT 0,
    cif VARCHAR(20) NOT NULL,
    direccion_fiscal VARCHAR(255),
    fecha_alta DATETIME DEFAULT CURRENT_TIMESTAMP,
    creado_por VARCHAR(100) DEFAULT 'Sistema'
) ENGINE=InnoDB;

CREATE TABLE proveedor_oficios (
    id_oficio BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_proveedor BIGINT NOT NULL,
    oficio VARCHAR(100) NOT NULL,
    CONSTRAINT fk_oficio_prov FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE proveedor_contactos (
    id_contacto BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_proveedor BIGINT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    cargo VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    CONSTRAINT fk_contacto_prov FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 1.7 TABLA SEGUIMIENTO_TRAMITES
CREATE TABLE seguimiento_tramites (
    id_seguimiento BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_tramite BIGINT NOT NULL,
    id_usuario BIGINT NOT NULL,
    id_creador BIGINT NOT NULL,
    id_proveedor BIGINT NULL,
    comentario TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_seguimiento DATE NULL,
    es_urgente TINYINT(1) DEFAULT 0,
    estado VARCHAR(50) DEFAULT 'Pendiente',
    CONSTRAINT fk_seg_tramite FOREIGN KEY (id_tramite) REFERENCES tramites_contrato(id_tramite) ON DELETE CASCADE,
    CONSTRAINT fk_seg_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_seg_creador FOREIGN KEY (id_creador) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_seg_proveedor FOREIGN KEY (id_proveedor) REFERENCES proveedores(id_proveedor) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 1.8 TABLAS DE ARCHIVOS
CREATE TABLE archivos_cliente (
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

CREATE TABLE archivos_tramite (
    id_archivo_t BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_tramite BIGINT NOT NULL,
    nombre_visible VARCHAR(255) NOT NULL,
    nombre_fisico VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(100),
    fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_subida VARCHAR(50),
    CONSTRAINT fk_arch_tramite FOREIGN KEY (id_tramite) REFERENCES tramites_contrato(id_tramite) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 1.9 TABLA AUDITORIA
CREATE TABLE auditoria_sistema (
    id_log BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tabla_afectada VARCHAR(50) NOT NULL,
    id_registro BIGINT NOT NULL,
    campo_modificado VARCHAR(50),
    valor_anterior TEXT,
    valor_nuevo TEXT,
    fecha_cambio DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_bd VARCHAR(100)
) ENGINE=InnoDB;

-- 1.10 TABLA SESIONES
CREATE TABLE auditoria_sesiones (
    id_sesion BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    id_usuario BIGINT NOT NULL,
    nombre_usuario VARCHAR(50) NOT NULL,
    fecha_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_fin DATETIME NULL,
    ip_acceso VARCHAR(45),
    estado VARCHAR(20) DEFAULT 'Conectado',
    CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 1.11 TABLA PRESUPUESTOS
CREATE TABLE presupuestos (
    id_presupuesto BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    cliente_id BIGINT NOT NULL,
    vivienda_id BIGINT NOT NULL,
    codigo_referencia VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL,
    total DECIMAL(12, 2) DEFAULT 0,
    total_sin_iva DECIMAL(12, 2) DEFAULT 0,
    total_con_iva DECIMAL(12, 2) DEFAULT 0,
    estado VARCHAR(30) DEFAULT 'Borrador',
    CONSTRAINT fk_presupuesto_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id_cliente) ON DELETE RESTRICT,
    CONSTRAINT fk_presupuesto_vivienda FOREIGN KEY (vivienda_id) REFERENCES locales(id_local) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 1.12 TABLA PRESUPUESTO_LINEAS
CREATE TABLE presupuesto_lineas (
    id_linea BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    presupuesto_id BIGINT NOT NULL,
    orden INT NOT NULL,
    producto_id BIGINT NULL,
    producto_texto VARCHAR(255) NULL,
    concepto VARCHAR(255) NOT NULL,
    iva_porcentaje DECIMAL(5, 2) DEFAULT 21,
    cantidad DECIMAL(12, 2),
    precio_unitario DECIMAL(12, 2),
    coste_unitario DECIMAL(12, 2),
    factor_margen DECIMAL(6, 2) DEFAULT 1.00,
    total_coste DECIMAL(12, 2),
    pvp_unitario DECIMAL(12, 2),
    total_pvp DECIMAL(12, 2),
    importe_iva DECIMAL(12, 2),
    total_final DECIMAL(12, 2),
    total_linea DECIMAL(12, 2),
    tipo_jerarquia VARCHAR(20) DEFAULT 'PARTIDA',
    codigo_visual VARCHAR(20),
    padre_id BIGINT NULL,
    CONSTRAINT fk_linea_presupuesto FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(id_presupuesto) ON DELETE CASCADE,
    CONSTRAINT fk_presupuesto_lineas_padre FOREIGN KEY (padre_id) REFERENCES presupuesto_lineas(id_linea) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ======================================================
-- 2. VISTAS
-- ======================================================

CREATE OR REPLACE VIEW vista_estado_contratos AS
SELECT
    c.id_contrato,
    cl.id_cliente,
    cl.dni as dni_cliente,
    CONCAT(cl.apellido1, ' ', COALESCE(cl.apellido2, ''), ' , ', cl.nombre) AS nombre_cliente,
    l.direccion_completa,
    c.tipo_contrato,
    c.fecha_alta,
    c.fecha_vencimiento,
    CASE
        WHEN c.fecha_vencimiento < CURRENT_DATE THEN 'VENCIDO'
        ELSE 'ACTIVO'
    END AS estado
FROM contratos c
JOIN clientes cl ON c.id_cliente = cl.id_cliente
JOIN locales l ON c.id_local = l.id_local;

-- ======================================================
-- 3. DATOS DE PRUEBA COMPLETOS
-- ======================================================

INSERT INTO usuarios (nombre_usuario, password_hash, rol, email) VALUES
('jefe_admin', 'admin123', 'ADMIN', 'jefeadmin@insene.com'),
('carlos_tec', 'pass123', 'TÉCNICO', 'carlos.tec@insene.com'),
('marta_tec', 'pass123', 'TÉCNICO', 'marta.tec@insene.com'),
('raul_tec', 'pass123', 'TÉCNICO', 'raul.tec@insene.com'),
('elena_tec', 'pass123', 'TÉCNICO', 'elena.tec@insene.com'),
('pablo_tec', 'pass123', 'TÉCNICO', 'pablo.tec@insene.com');

INSERT INTO clientes (nombre, apellido1, apellido2, dni, direccion_fiscal_completa, codigo_postal, cuenta_bancaria, creado_por) VALUES
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

INSERT INTO locales (id_cliente, nombre_titular, apellido1_titular, dni_titular, cups, referencia_catastral, direccion_completa, latitud, longitud, creado_por) VALUES
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

INSERT INTO contratos (id_cliente, id_local, fecha_inicio, fecha_vencimiento, tipo_contrato, creado_por) VALUES
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

INSERT INTO proveedores (nombre_comercial, razon_social, es_autonomo, cif, direccion_fiscal, creado_por) VALUES
('Electricidad Garcia SL', 'Electricidad Garcia Sociedad Limitada', 0, 'B12345678', 'Pol. Ind. Calonge, Calle A, 12, Sevilla', 'jefe_admin'),
('Carlos Fontaneria', 'Carlos Perez Gomez', 1, '12345678Z', 'Calle Betis 45, Sevilla', 'jefe_admin'),
('Construcciones Modesto', 'Modesto Construcciones SA', 0, 'A87654321', 'Avda. de la Paz 10, Alcala de Guadaira', 'jefe_admin'),
('Climatizacion Del Sur', 'ClimaSur Instalaciones SL', 0, 'B11223344', 'Calle Refrigeracion 5, Dos Hermanas', 'jefe_admin'),
('Topografia y Medicion', 'Ana Ruiz Topografa', 1, '23456789X', 'Plaza de Cuba 3, Sevilla', 'jefe_admin'),
('Carpinteria Hnos. Lopez', 'Carpinteria Lopez CB', 0, 'E55667788', 'Calle Madera 8, Utrera', 'jefe_admin'),
('Pinturas Lozano', 'Juan Lozano Pintor', 1, '34567890C', 'Calle Arco Iris 2, Mairena del Aljarafe', 'jefe_admin'),
('Silence Acustica', 'Ingenieria Silence SL', 0, 'B99887766', 'Parque Tecnologico Cartuja, Sevilla', 'jefe_admin'),
('Excavaciones Tierra', 'Excavaciones Tierra SL', 0, 'B44332211', 'Carretera Carmona Km 5', 'jefe_admin'),
('Seguridad 24h', 'Alarmas y Sistemas SL', 0, 'B66778899', 'Avda. Republica Argentina 20, Sevilla', 'jefe_admin');

INSERT INTO proveedor_oficios (id_proveedor, oficio) VALUES
(1, 'Electricidad'), (1, 'Baja Tension'),
(2, 'Fontaneria'), (2, 'Gas'),
(3, 'Albanileria'), (3, 'Reformas'),
(4, 'Climatizacion'), (4, 'Ventilacion'),
(5, 'Topografia'),
(6, 'Carpinteria Madera'), (6, 'Ebanisteria'),
(7, 'Pintura'), (7, 'Revestimientos'),
(8, 'Ingenieria Acustica'), (8, 'Mediciones'),
(9, 'Movimiento de Tierras'), (9, 'Excavacion'),
(10, 'Sistemas Seguridad'), (10, 'PCI');

INSERT INTO proveedor_contactos (id_proveedor, nombre, cargo, telefono, email) VALUES
(1, 'Manuel Garcia', 'Gerente', '600111222', 'mg@garciasl.com'),
(2, 'Carlos Perez', 'Autonomo', '611222333', 'carlosperez@fontaneria.com'),
(3, 'Modesto Rodriguez', 'Jefe de Obra', '622333444', 'obras@modesto.com'),
(4, 'Lucia Mendez', 'Administracion', '633444555', 'admin@climasur.com'),
(5, 'Ana Ruiz', 'Topografa', '644555666', 'ana.ruiz@topografia.com'),
(6, 'Pedro Lopez', 'Encargado Taller', '655666777', 'pedro@carpinterialopez.com'),
(7, 'Juan Lozano', 'Pintor', '666777888', 'juan@pinturaslozano.com'),
(8, 'Elena Valls', 'Ingeniera Acustica', '677888999', 'elena@silence.com'),
(9, 'Roberto Tierra', 'Jefe Maquinaria', '688999000', 'roberto@excavaciones.com'),
(10, 'Sonia Vigil', 'Comercial', '699000111', 'sonia@seguridad24.com');

-- Presupuesto con jerarquia de capitulos/partidas
INSERT INTO presupuestos (cliente_id, vivienda_id, codigo_referencia, fecha, total, total_sin_iva, total_con_iva, estado)
VALUES (1, 1, 'PRES-HIER-001', CURRENT_DATE, 14810.40, 12240.00, 14810.40, 'Borrador');
SET @p_id := LAST_INSERT_ID();

INSERT INTO presupuesto_lineas (presupuesto_id, orden, concepto, tipo_jerarquia, codigo_visual)
VALUES (@p_id, 1, 'INGENIERIA Y LEGALIZACION', 'CAPITULO', '01');
SET @cap01 := LAST_INSERT_ID();

INSERT INTO presupuesto_lineas (presupuesto_id, orden, concepto, tipo_jerarquia, codigo_visual)
VALUES (@p_id, 2, 'GENERACION FOTOVOLTAICA', 'CAPITULO', '02');
SET @cap02 := LAST_INSERT_ID();

INSERT INTO presupuesto_lineas (presupuesto_id, orden, concepto, tipo_jerarquia, codigo_visual)
VALUES (@p_id, 3, 'ELECTRICIDAD Y ACUMULACION', 'CAPITULO', '03');
SET @cap03 := LAST_INSERT_ID();

INSERT INTO presupuesto_lineas (presupuesto_id, orden, concepto, tipo_jerarquia, codigo_visual)
VALUES (@p_id, 4, 'OBRA CIVIL / ALBANILERIA', 'CAPITULO', '04');
SET @cap04 := LAST_INSERT_ID();

INSERT INTO presupuesto_lineas (
  presupuesto_id, orden, concepto, cantidad, coste_unitario, factor_margen, total_coste, pvp_unitario, total_pvp,
  importe_iva, total_final, iva_porcentaje, precio_unitario, total_linea, tipo_jerarquia, codigo_visual, padre_id
)
VALUES
  (@p_id, 1, 'Redaccion de Proyecto Tecnico de BT', 1, 1200.00, 1.00, 1200.00, 1200.00, 1200.00, 252.00, 1452.00, 21, 1200.00, 1200.00, 'PARTIDA', '01.01', @cap01),
  (@p_id, 2, 'Direccion de Obra y Coordinacion CSS', 1, 900.00, 1.00, 900.00, 900.00, 900.00, 189.00, 1089.00, 21, 900.00, 900.00, 'PARTIDA', '01.02', @cap01),
  (@p_id, 3, 'Tasas Municipales (ICIO) y Gestion de Subvenciones', 1, 450.00, 1.00, 450.00, 450.00, 450.00, 94.50, 544.50, 21, 450.00, 450.00, 'PARTIDA', '01.03', @cap01),
  (@p_id, 4, '18x Modulo Jinko Solar Tiger Neo N-Type 475W', 18, 160.00, 1.00, 2880.00, 160.00, 2880.00, 604.80, 3484.80, 21, 160.00, 2880.00, 'PARTIDA', '02.01', @cap02),
  (@p_id, 5, 'Inversor Hibrido Huawei SUN2000-6KTL-L1', 1, 1200.00, 1.00, 1200.00, 1200.00, 1200.00, 252.00, 1452.00, 21, 1200.00, 1200.00, 'PARTIDA', '02.02', @cap02),
  (@p_id, 6, 'Estructura Coplanar K2 Systems (Aluminio)', 1, 650.00, 1.00, 650.00, 650.00, 650.00, 136.50, 786.50, 21, 650.00, 650.00, 'PARTIDA', '02.03', @cap02),
  (@p_id, 7, 'Bateria Huawei LUNA2000 10kWh', 1, 3400.00, 1.00, 3400.00, 3400.00, 3400.00, 714.00, 4114.00, 21, 3400.00, 3400.00, 'PARTIDA', '03.01', @cap03),
  (@p_id, 8, 'Smart Power Sensor Huawei DTSU666-H', 1, 180.00, 1.00, 180.00, 180.00, 180.00, 37.80, 217.80, 21, 180.00, 180.00, 'PARTIDA', '03.02', @cap03),
  (@p_id, 9, 'Protecciones DC/AC (Sobretensiones, Diferenciales Clase A)', 1, 380.00, 1.00, 380.00, 380.00, 380.00, 79.80, 459.80, 21, 380.00, 380.00, 'PARTIDA', '03.03', @cap03),
  (@p_id, 10, 'Cableado solar 6mm y canalizacion reforzada', 1, 250.00, 1.00, 250.00, 250.00, 250.00, 52.50, 302.50, 21, 250.00, 250.00, 'PARTIDA', '03.04', @cap03),
  (@p_id, 11, 'Apertura de rozas y ayudas de albanileria', 1, 450.00, 1.00, 450.00, 450.00, 450.00, 94.50, 544.50, 21, 450.00, 450.00, 'PARTIDA', '04.01', @cap04),
  (@p_id, 12, 'Bancada de hormigon para unidad exterior (si procede)', 1, 300.00, 1.00, 300.00, 300.00, 300.00, 63.00, 363.00, 21, 300.00, 300.00, 'PARTIDA', '04.02', @cap04);
