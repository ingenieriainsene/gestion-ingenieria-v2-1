-- Migration: 20260318000000_update_budget_contract_links.sql
-- Description: Adds missing columns for budget and contract linkage.
-- Target: Supabase / PostgreSQL

-- 1. Update CONTRATOS table
ALTER TABLE contratos 
    ADD COLUMN IF NOT EXISTS id_presupuesto_origen BIGINT;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_contrato_presupuesto_origen') THEN
        ALTER TABLE contratos 
            ADD CONSTRAINT fk_contrato_presupuesto_origen 
            FOREIGN KEY (id_presupuesto_origen) REFERENCES presupuestos(id_presupuesto) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Update PRESUPUESTOS table
ALTER TABLE presupuestos 
    ADD COLUMN IF NOT EXISTS id_contrato BIGINT;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_presupuesto_contrato') THEN
        ALTER TABLE presupuestos 
            ADD CONSTRAINT fk_presupuesto_contrato 
            FOREIGN KEY (id_contrato) REFERENCES contratos(id_contrato) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Indexing for performance
CREATE INDEX IF NOT EXISTS idx_contratos_presupuesto_origen ON contratos(id_presupuesto_origen);
CREATE INDEX IF NOT EXISTS idx_presupuestos_id_contrato ON presupuestos(id_contrato);
