-- MIGRACIÓN 20260326 - Añadir dependencia entre trámites
ALTER TABLE TRAMITES_CONTRATO 
ADD COLUMN IF NOT EXISTS id_tramite_bloqueante BIGINT NULL;

ALTER TABLE TRAMITES_CONTRATO
ADD CONSTRAINT fk_tramite_bloqueante
FOREIGN KEY (id_tramite_bloqueante) REFERENCES TRAMITES_CONTRATO(id_tramite)
ON DELETE SET NULL;

COMMENT ON COLUMN TRAMITES_CONTRATO.id_tramite_bloqueante IS 'ID del trámite que debe estar Terminado para que este pueda ser Generado.';
