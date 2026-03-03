package com.ingenieria.controller;

import com.ingenieria.dto.ArchivoAdjuntoDTO;
import com.ingenieria.service.DocumentoPdfService;
import com.ingenieria.service.LocalFileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documentos")
@RequiredArgsConstructor
public class DocumentoController {

    private final DocumentoPdfService documentoPdfService;
    private final LocalFileStorageService localFileStorageService;

    @GetMapping("/albaran/{presupuestoId}")
    public ResponseEntity<?> descargarAlbaran(@PathVariable Long presupuestoId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String usuarioBd = auth != null ? auth.getName() : "sistema";
        try {
            byte[] pdf = documentoPdfService.generarAlbaranPdf(presupuestoId, usuarioBd);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"albaran_" + presupuestoId + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("No se pudo generar el PDF.");
        }
    }

    @GetMapping("/albaran-venta/{albaranId}")
    public ResponseEntity<?> descargarAlbaranVenta(@PathVariable Long albaranId) {
        try {
            byte[] pdf = documentoPdfService.generarAlbaranPdfPorId(albaranId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"albaran_venta_" + albaranId + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("No se pudo generar el PDF.");
        }
    }

    @GetMapping("/factura/{presupuestoId}")
    public ResponseEntity<?> descargarFactura(@PathVariable Long presupuestoId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String usuarioBd = auth != null ? auth.getName() : "sistema";
        try {
            byte[] pdf = documentoPdfService.generarFacturaPdf(presupuestoId, usuarioBd);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"factura_" + presupuestoId + ".pdf\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("No se pudo generar el PDF.");
        }
    }

    // ---------------- Gestor Documental (local) ----------------

    @PostMapping("/adjuntos/{entidadTipo}/{entidadId}")
    public ResponseEntity<?> subirAdjunto(@PathVariable String entidadTipo,
            @PathVariable Long entidadId,
            @RequestParam("file") MultipartFile file) {
        try {
            ArchivoAdjuntoDTO dto = localFileStorageService.guardarArchivo(entidadTipo, entidadId, file);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al subir archivo.");
        }
    }

    @GetMapping("/adjuntos/{entidadTipo}/{entidadId}")
    public List<ArchivoAdjuntoDTO> listarAdjuntos(@PathVariable String entidadTipo,
            @PathVariable Long entidadId) {
        return localFileStorageService.listarArchivos(entidadTipo, entidadId);
    }

    @GetMapping("/adjuntos/{id}")
    public ResponseEntity<?> descargarAdjunto(@PathVariable UUID id,
            @RequestParam(name = "download", defaultValue = "true") boolean download) {
        try {
            ArchivoAdjuntoDTO meta = localFileStorageService.findMeta(id);
            Resource resource = localFileStorageService.cargarComoResource(id);
            MediaType mediaType = meta.getTipoMime() != null
                    ? MediaType.parseMediaType(meta.getTipoMime())
                    : MediaType.APPLICATION_OCTET_STREAM;
            String disposition = download ? "attachment" : "inline";
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            disposition + "; filename=\"" + meta.getNombreOriginal() + "\"")
                    .body(resource);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("No se pudo descargar el archivo.");
        }
    }

    @DeleteMapping("/adjuntos/{id}")
    public ResponseEntity<?> borrarAdjunto(@PathVariable UUID id) {
        try {
            localFileStorageService.borrarArchivo(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("No se pudo eliminar el archivo.");
        }
    }
}
