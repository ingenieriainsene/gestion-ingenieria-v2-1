package com.ingenieria.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ingenieria.dto.CieRequestDTO;
import com.ingenieria.dto.LegalizacionRequestDTO;
import com.ingenieria.model.LegalizacionBT;
import com.ingenieria.model.Local;
import com.ingenieria.repository.LegalizacionBTRepository;
import com.ingenieria.repository.LocalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class LegalizacionBTService {

    @Autowired
    private LegalizacionBTRepository repository;

    @Autowired
    private LocalRepository localRepository;

    @Autowired
    private CiePdfService ciePdfService;

    @Autowired
    private LegalizacionPdfService legalizacionPdfService;

    @Autowired
    private CertificadoPdfService certificadoPdfService;

    @Autowired
    private ObjectMapper objectMapper;

    public List<LegalizacionBT> findByLocal(Long idLocal) {
        return repository.findByIdLocalOrderByFechaAltaDesc(idLocal);
    }

    public List<LegalizacionBT> findByTramite(Long idTramite) {
        return repository.findByIdTramite(idTramite);
    }

    @Transactional
    public LegalizacionBT save(Long idLocal, LegalizacionBT legalizacion) {
        Local local = localRepository.findById(idLocal)
                .orElseThrow(() -> new IllegalArgumentException("Local no encontrado"));
        legalizacion.setIdLocal(idLocal);
        return repository.save(legalizacion);
    }

    public LegalizacionBT findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    @Transactional
    public LegalizacionBT patchEstado(Long id, String nuevoEstado) {
        LegalizacionBT leg = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Legalización no encontrada"));

        leg.setEstado(nuevoEstado);
        if ("Completado".equalsIgnoreCase(nuevoEstado)) {
            leg.setFechaLegalizacion(LocalDate.now());
        } else {
            leg.setFechaLegalizacion(null);
        }

        return repository.save(leg);
    }

    public byte[] generarCiePdf(Long id) {
        LegalizacionBT leg = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Legalización no encontrada"));
        try {
            CieRequestDTO dto = objectMapper.readValue(leg.getDatosJson(), CieRequestDTO.class);
            return ciePdfService.generarCie(dto);
        } catch (Exception e) {
            throw new RuntimeException("Error al parsear datos para generar CIE", e);
        }
    }

    public byte[] generarMtdPdf(Long id, String tipoAutoconsumoOverride, String caracteristicasOverride) {
        LegalizacionBT leg = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Legalización no encontrada"));
        try {
            CieRequestDTO cieDto = objectMapper.readValue(leg.getDatosJson(), CieRequestDTO.class);
            
            // Aplicar overrides si vienen informados
            if (tipoAutoconsumoOverride != null && !tipoAutoconsumoOverride.isBlank()) {
                cieDto.setTipoAutoconsumo(tipoAutoconsumoOverride);
            }
            if (caracteristicasOverride != null && !caracteristicasOverride.isBlank()) {
                cieDto.setCaracteristicasTecnicas(caracteristicasOverride);
            }

            LegalizacionRequestDTO mtdDto = mapToLegalizacionDto(cieDto, leg.getLocal());
            return legalizacionPdfService.generarLegalizacion(mtdDto);
        } catch (Exception e) {
            throw new RuntimeException("Error al parsear datos para generar MTD", e);
        }
    }

    public byte[] generarCertificadoPdf(Long id) {
        LegalizacionBT leg = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Legalización no encontrada"));
        try {
            CieRequestDTO dto = objectMapper.readValue(leg.getDatosJson(), CieRequestDTO.class);
            return certificadoPdfService.generarCertificado(dto);
        } catch (Exception e) {
            throw new RuntimeException("Error al parsear datos para generar Certificado", e);
        }
    }

    private LegalizacionRequestDTO mapToLegalizacionDto(CieRequestDTO cie, Local local) {
        LegalizacionRequestDTO mtd = new LegalizacionRequestDTO();
        mtd.setTitular(cie.getNombreTitular());
        mtd.setNif(cie.getDniTitular());
        mtd.setEmplazamiento(cie.getEmplazamientoInstalacion());
        mtd.setCups(cie.getCups());
        mtd.setTipoAutoconsumo(cie.getTipoAutoconsumo());
        mtd.setCaracteristicasTecnicas(cie.getCaracteristicasTecnicas());
        
        // Coordenadas y referencia catastral del local si están disponibles
        if (local != null) {
            if (local.getLatitud() != null) {
                mtd.setLatitud(local.getLatitud().doubleValue());
            }
            if (local.getLongitud() != null) {
                mtd.setLongitud(local.getLongitud().doubleValue());
            }
            if (local.getReferenciaCatastral() != null) {
                mtd.setReferenciaCatastral(local.getReferenciaCatastral());
            }
        }
        
        return mtd;
    }
}
