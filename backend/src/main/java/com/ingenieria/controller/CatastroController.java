package com.ingenieria.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/catastro")
public class CatastroController {

    private static final String WS_BASE =
            "https://ovc.catastro.meh.es/ovcservweb/ovcswlocalizacionrc/ovccallejero.asmx/Consulta_DNPRC";

    /**
     * Devuelve la URL final de la ficha de "Consulta y certificación de Bien Inmueble"
     * para una referencia catastral dada. Si no se puede determinar delegación/municipio,
     * devuelve sólo la parte sin parámetros del/mun.
     */
    @GetMapping("/ficha-url")
    public ResponseEntity<?> getFichaUrl(@RequestParam("rc") String rcRaw) {
        try {
            if (rcRaw == null || rcRaw.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Referencia catastral obligatoria");
            }
            String rc = rcRaw.replaceAll("\\s+", "").toUpperCase();

            // Llamada rápida al servicio público del Catastro por RC
            String wsUrl = WS_BASE + "?Provincia=&Municipio=&RC=" +
                    URLEncoder.encode(rc, StandardCharsets.UTF_8);

            RestTemplate rest = new RestTemplate();
            String xml = rest.getForObject(wsUrl, String.class);
            if (xml == null || xml.isBlank()) {
                return ResponseEntity.status(502).body("Respuesta vacía de Catastro");
            }

            // Extraemos códigos de delegación (pc) y municipio (cm) si están presentes
            String del = extractTag(xml, "pc");
            String mun = extractTag(xml, "cm");

            String encodedRc = URLEncoder.encode(rc, StandardCharsets.UTF_8);
            StringBuilder url = new StringBuilder(
                    "https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCConCiud.aspx" +
                            "?UrbRus=U" +
                            "&RefC=" + encodedRc +
                            "&esBice=&RCBice1=&RCBice2=&DenoBice=" +
                            "&from=OVCBusqueda&pest=rc" +
                            "&RCCompleta=" + encodedRc);

            if (del != null && mun != null) {
                url.append("&final=&del=").append(del).append("&mun=").append(mun);
            }

            return ResponseEntity.ok(new CatastroUrlResponse(url.toString()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error consultando Catastro: " + e.getMessage());
        }
    }

    private String extractTag(String xml, String tag) {
        Pattern p = Pattern.compile("<" + tag + ">([^<]*)</" + tag + ">");
        Matcher m = p.matcher(xml);
        if (m.find()) {
            String value = m.group(1).trim();
            return value.isEmpty() ? null : value;
        }
        return null;
    }

    public record CatastroUrlResponse(String url) {
    }
}

