package com.ingenieria.dto;

import lombok.Data;

@Data
public class CieRequestDTO {

    // Textos
    private String numeroRegistro;
    private String anoNumeroRegistro;
    private String nombreTitular;
    private String dniTitular;
    private String domicilioTitular;
    private String cpTitular;
    private String localidadTitular;
    private String provinciaTitular;

    private String emplazamientoInstalacion;
    private String numeroEmplazamientoInstalacion;
    private String bloqueEmplazamientoInstalacion;
    private String portalEmplazamientoInstalacion;
    private String escaleraEmplazamientoInstalacion;
    private String pisoEmplazamientoInstalacion;
    private String puertaEmplazamientoInstalacion;
    private String localidadInstalacion;
    private String provinciaInstalacion;
    private String cpInstalacion;

    private String tipoInstalacion;
    private String usoDestina;
    private String cups;

    // Campos para MTD Legalizacion
    private String tipoAutoconsumo;
    private String caracteristicasTecnicas;

    private String intensidadNominal;
    private String potenciaPrevista;
    private String tensionSuministro;

    private String nivelAislamiento;
    private String materialAislamiento;
    private String materialConductor;
    private String fase;
    private String neutro;
    private String cpConductor;
    private String empresaDistribuidora;

    private String pfIntensidadNominal;
    private String sensibilidad;

    private String resistenciaTierra;
    private String resistenciaAislamiento;

    private String observaciones;

    private String localidadFirma;
    private String diaFirma;
    private String mesFirma;
    private String anoFirma;

    // Booleanos
    private boolean chkInstalacionNueva;
    private boolean chkInstalacionAmpliacion;
    private boolean chkInstalacionModificacion;

    private boolean chkLineaAlimentacionSi;
    private boolean chkLineaAlimentacionNo;

    private boolean chkMonofasico;
    private boolean chkTrifasico;

    private boolean chkInterrup;
    private boolean chkFusibles;

    private boolean chkCategoriaBasica;
    private boolean chkCategoriaEspecialista;
}
