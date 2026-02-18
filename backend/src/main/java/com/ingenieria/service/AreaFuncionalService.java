package com.ingenieria.service;

import com.ingenieria.model.AreaFuncional;
import com.ingenieria.model.AreaFuncionalLinea;
import com.ingenieria.model.Local;
import com.ingenieria.repository.AreaFuncionalRepository;
import com.ingenieria.repository.AreaFuncionalLineaRepository;
import com.ingenieria.repository.LocalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class AreaFuncionalService {

    @Autowired
    private AreaFuncionalRepository areaRepository;

    @Autowired
    private AreaFuncionalLineaRepository lineaRepository;

    @Autowired
    private LocalRepository localRepository;

    public List<AreaFuncional> findAllByLocalId(Long idLocal) {
        return areaRepository.findByLocalIdLocal(idLocal);
    }

    public AreaFuncional createArea(Long idLocal, AreaFuncional area) {
        Local local = localRepository.findById(idLocal)
                .orElseThrow(() -> new RuntimeException("Local no encontrado"));
        area.setLocal(local);
        return areaRepository.save(area);
    }

    public AreaFuncional updateArea(Long idArea, AreaFuncional areaDetails) {
        AreaFuncional area = areaRepository.findById(idArea)
                .orElseThrow(() -> new RuntimeException("Area Funcional no encontrada"));
        area.setNombre(areaDetails.getNombre());
        area.setDescripcion(areaDetails.getDescripcion());
        area.setOrden(areaDetails.getOrden());
        return areaRepository.save(area);
    }

    public void deleteArea(Long idArea) {
        areaRepository.deleteById(idArea);
    }

    public AreaFuncionalLinea addLinea(Long idArea, AreaFuncionalLinea linea) {
        AreaFuncional area = areaRepository.findById(idArea)
                .orElseThrow(() -> new RuntimeException("Area Funcional no encontrada"));
        linea.setAreaFuncional(area);
        return lineaRepository.save(linea);
    }

    public AreaFuncionalLinea updateLinea(Long idLinea, AreaFuncionalLinea lineaDetails) {
        AreaFuncionalLinea linea = lineaRepository.findById(idLinea)
                .orElseThrow(() -> new RuntimeException("Linea no encontrada"));
        linea.setProductoId(lineaDetails.getProductoId());
        linea.setProductoTexto(lineaDetails.getProductoTexto());
        linea.setConcepto(lineaDetails.getConcepto());
        linea.setCantidad(lineaDetails.getCantidad());
        linea.setAccionRequerida(lineaDetails.getAccionRequerida());
        linea.setOrden(lineaDetails.getOrden());
        return lineaRepository.save(linea);
    }

    public void deleteLinea(Long idLinea) {
        lineaRepository.deleteById(idLinea);
    }
}
