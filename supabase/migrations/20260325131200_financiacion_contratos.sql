-- Migration: Add financing fields to contratos
ALTER TABLE contratos 
    ADD COLUMN IF NOT EXISTS forma_pago VARCHAR(255) DEFAULT 'Al contado',
    ADD COLUMN IF NOT EXISTS nombre_financiera VARCHAR(255),
    ADD COLUMN IF NOT EXISTS fecha_inicio_financiacion DATE,
    ADD COLUMN IF NOT EXISTS importe_cuota DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS importe_total_financiado DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS porcentaje_contado DOUBLE PRECISION;
