package com.ingenieria.controller;

import com.ingenieria.model.Local;
import com.ingenieria.model.LocalArea;
import com.ingenieria.model.LocalUbicacion;
import com.ingenieria.repository.LocalAreaRepository;
import com.ingenieria.repository.LocalRepository;
import com.ingenieria.repository.LocalUbicacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/local-areas")
public class LocalAreaController {

    @Autowired
    private LocalAreaRepository areaRepo;
    @Autowired
    private LocalUbicacionRepository ubicacionRepo;
    @Autowired
    private LocalRepository localRepo;

    @PostMapping("/{localId}")
    public ResponseEntity<LocalArea> addArea(@PathVariable Long localId, @RequestBody LocalArea area) {
        Local local = localRepo.findById(localId).orElseThrow();
        area.setLocal(local);
        return ResponseEntity.ok(areaRepo.save(area));
    }

    @DeleteMapping("/{areaId}")
    public ResponseEntity<Void> deleteArea(@PathVariable Long areaId) {
        areaRepo.deleteById(areaId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{areaId}/ubicaciones")
    public ResponseEntity<LocalUbicacion> addUbicacion(@PathVariable Long areaId, @RequestBody LocalUbicacion ubi) {
        LocalArea area = areaRepo.findById(areaId).orElseThrow();
        ubi.setArea(area);
        return ResponseEntity.ok(ubicacionRepo.save(ubi));
    }

    @DeleteMapping("/ubicaciones/{ubiId}")
    public ResponseEntity<Void> deleteUbicacion(@PathVariable Long ubiId) {
        ubicacionRepo.deleteById(ubiId);
        return ResponseEntity.noContent().build();
    }
}
