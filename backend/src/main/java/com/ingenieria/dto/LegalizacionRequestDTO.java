package com.ingenieria.dto;

/**
 * Datos necesarios para rellenar la plantilla de
 * "Memoria Técnica de Instalación Fotovoltaica".
 */
public class LegalizacionRequestDTO {

    private String titular;
    private String nif;
    private String emplazamiento;
    private String cups;

    // Campos adicionales de la memoria
    private String tipoAutoconsumo;
    private String caracteristicasTecnicas;

    // Coordenadas del local (para generar el plano satélite)
    private Double latitud;
    private Double longitud;

    public String getTitular() {
        return titular;
    }

    public void setTitular(String titular) {
        this.titular = titular;
    }

    public String getNif() {
        return nif;
    }

    public void setNif(String nif) {
        this.nif = nif;
    }

    public String getEmplazamiento() {
        return emplazamiento;
    }

    public void setEmplazamiento(String emplazamiento) {
        this.emplazamiento = emplazamiento;
    }

    public String getCups() {
        return cups;
    }

    public void setCups(String cups) {
        this.cups = cups;
    }

    public String getTipoAutoconsumo() {
        return tipoAutoconsumo;
    }

    public void setTipoAutoconsumo(String tipoAutoconsumo) {
        this.tipoAutoconsumo = tipoAutoconsumo;
    }

    public String getCaracteristicasTecnicas() {
        return caracteristicasTecnicas;
    }

    public void setCaracteristicasTecnicas(String caracteristicasTecnicas) {
        this.caracteristicasTecnicas = caracteristicasTecnicas;
    }

    public Double getLatitud() {
        return latitud;
    }

    public void setLatitud(Double latitud) {
        this.latitud = latitud;
    }

    public Double getLongitud() {
        return longitud;
    }

    public void setLongitud(Double longitud) {
        this.longitud = longitud;
    }
}

